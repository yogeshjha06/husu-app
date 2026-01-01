'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
    ChevronLeft,
    CheckCircle2,
    Loader,
    ShieldCheck,
    Info,
    ArrowRight,
    ClipboardList,
    Trophy
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { CertificateOverlay } from '@/components/employee/certificate-overlay'

interface Question {
    id: string
    text?: string
    title?: string
    question_text?: string
    type: 'MCQ' | 'TRUE_FALSE' | 'MULTI_OPTION' | 'SUBJECTIVE' | 'RATING' | 'IMAGE_MCQ'
    image_options?: { label: string, url: string }[]
    options?: any[]
    required?: boolean
}

interface Form {
    id: string
    name: string
    description: string
    questions: Question[]
    response_status?: string
    header_image?: string
    background_color?: string
    template?: string
}

export default function StandardSurveyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { userProfile } = useAuth()
    const router = useRouter()

    const [form, setForm] = useState<Form | null>(null)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showCertificate, setShowCertificate] = useState(false)

    useEffect(() => {
        fetchForm()
    }, [id])

    const fetchForm = async () => {
        try {
            const res = await fetch(`/api/employee/forms/${id}`)
            if (res.ok) {
                const { data } = await res.json()
                setForm(data)
                if (data.response_status === 'SUBMITTED' || data.response_status === 'COMPLETED') {
                    setShowSuccess(true)
                }
            }
        } catch (error) {
            console.error('Error fetching form:', error)
            toast.error('Failed to load survey')
        } finally {
            setLoading(false)
        }
    }

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
    }

    const handleMultiSelectChange = (questionId: string, optionValue: string, checked: boolean) => {
        setAnswers(prev => {
            const current = Array.isArray(prev[questionId]) ? prev[questionId] : []
            if (checked) {
                return { ...prev, [questionId]: [...current, optionValue] }
            } else {
                return { ...prev, [questionId]: current.filter((v: string) => v !== optionValue) }
            }
        })
    }

    const handleSubmit = async () => {
        if (!form) return

        const missingRequired = form.questions.filter(q => {
            if (!q.required) return false
            const ans = answers[q.id]
            if (Array.isArray(ans)) return ans.length === 0
            return !ans
        })

        if (missingRequired.length > 0) {
            toast.error(`Please answer all required questions.`)
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/employee/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    form_id: id,
                    answers,
                    progress_percentage: 100,
                    status: 'SUBMITTED'
                })
            })

            if (res.ok) {
                toast.success('Survey submitted successfully!')
                setShowSuccess(true)
            }
        } catch (error) {
            console.error('Submission error:', error)
            toast.error('Failed to submit survey')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Initializing Encryption Shield...</p>
            </div>
        )
    }

    if (!form) return null

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-xl w-full text-center space-y-10 animate-in zoom-in-95 duration-700">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 relative z-10">
                            <CheckCircle2 className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Mission <span className="text-blue-600">Complete</span></h1>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed">
                            Your survey responses have been successfully added to the HUSU platform. You've earned a new Industry Certificate!
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                            onClick={() => setShowCertificate(true)}
                            className="h-16 rounded-3xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-xl group"
                        >
                            <Trophy className="w-5 h-5 mr-3 text-amber-500" />
                            View Certificate
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/employee/surveys')}
                            className="h-16 rounded-3xl border-2 border-slate-200 hover:bg-white font-black uppercase tracking-widest text-xs"
                        >
                            Back to Dashboard
                            <ArrowRight className="ml-3 w-5 h-5" />
                        </Button>
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Verified by HUSU Authorization Protocol</p>

                    <CertificateOverlay
                        isOpen={showCertificate}
                        onClose={() => setShowCertificate(false)}
                        formName={form.name}
                        userName={`${userProfile?.first_name} ${userProfile?.last_name}`}
                        certificateId={id}
                    />
                </div>
            </div>
        )
    }

    return (
        <div
            className="min-h-full p-6 md:p-12 pb-24 transition-colors duration-500 overflow-x-hidden"
            style={{ backgroundColor: form.background_color || '#f8fafc' }}
        >
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center mb-12">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/employee/surveys')}
                        className="text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px] group"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Exit Session
                    </Button>

                    <Badge variant="outline" className="px-4 py-2 rounded-full bg-white border-slate-200">
                        <ShieldCheck className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Protocol v2.1</span>
                    </Badge>
                </div>

                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    {form.header_image && (
                        <div className="h-64 w-full relative">
                            <img src={form.header_image} className="w-full h-full object-cover" alt="Header" />
                        </div>
                    )}
                    <div className="p-10 md:p-16 space-y-6 text-black">
                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 bg-blue-600">
                            <ClipboardList className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">{form.name}</h1>
                        <p className="text-lg font-medium leading-relaxed max-w-2xl opacity-70">
                            {form.description}
                        </p>
                    </div>
                </Card>

                <div className="space-y-8">
                    {form.questions.map((q, idx) => (
                        <Card key={q.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                            <CardContent className="p-10 md:p-14 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                                            {idx + 1}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section {idx + 1}</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                        {q.title || q.text || q.question_text}
                                    </h2>
                                </div>

                                <div className="space-y-6">
                                    {q.type === 'MCQ' || q.type === 'TRUE_FALSE' ? (
                                        <RadioGroup
                                            value={answers[q.id] || ''}
                                            onValueChange={(val) => handleAnswerChange(q.id, val)}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                        >
                                            {(q.type === 'TRUE_FALSE' ? ['True', 'False'] : (q.options || [])).map((option: any, oIdx: number) => {
                                                const label = String(typeof option === 'string' ? option : (option.label || option.value || `Option ${oIdx + 1}`));
                                                return (
                                                    <Label
                                                        key={oIdx}
                                                        className={`relative flex items-center gap-4 p-6 rounded-3xl border-2 transition-all cursor-pointer group ${answers[q.id] === label
                                                            ? 'border-blue-600 bg-blue-50'
                                                            : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'}`}
                                                    >
                                                        <RadioGroupItem value={label} className="sr-only" />
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${answers[q.id] === label ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                                            {answers[q.id] === label && <div className="w-2 h-2 rounded-full bg-white" />}
                                                        </div>
                                                        <span className={`text-lg font-bold ${answers[q.id] === label ? 'text-blue-900' : 'text-slate-600'}`}>
                                                            {label}
                                                        </span>
                                                    </Label>
                                                )
                                            })}
                                        </RadioGroup>
                                    ) : q.type === 'MULTI_OPTION' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(q.options || []).map((option: any, oIdx: number) => {
                                                const label = String(typeof option === 'string' ? option : (option.label || option.value || `Option ${oIdx + 1}`));
                                                const isChecked = Array.isArray(answers[q.id]) && answers[q.id].includes(label)

                                                return (
                                                    <Label
                                                        key={oIdx}
                                                        className={`relative flex items-center gap-4 p-6 rounded-3xl border-2 transition-all cursor-pointer group ${isChecked
                                                            ? 'border-blue-600 bg-blue-50'
                                                            : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'}`}
                                                    >
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) => handleMultiSelectChange(q.id, label, !!checked)}
                                                            className="w-6 h-6 border-2 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                        />
                                                        <span className={`text-lg font-bold ${isChecked ? 'text-blue-900' : 'text-slate-600'}`}>
                                                            {label}
                                                        </span>
                                                    </Label>
                                                )
                                            })}
                                        </div>
                                    ) : q.type === 'IMAGE_MCQ' ? (
                                        <RadioGroup
                                            value={answers[q.id] || ''}
                                            onValueChange={(val) => handleAnswerChange(q.id, val)}
                                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                        >
                                            {(q.image_options || q.options || [])?.map((option: any, oIdx: number) => {
                                                const optVal = String(typeof option === 'string' ? option : (option.label || option.value || `Option ${oIdx + 1}`));
                                                const optImg = typeof option === 'string' ? option : (option.url || option.image || '');

                                                return (
                                                    <Label
                                                        key={oIdx}
                                                        className={`relative flex flex-col overflow-hidden rounded-[2rem] border-4 transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${answers[q.id] === optVal
                                                            ? 'border-blue-600 ring-4 ring-blue-500/20 shadow-xl shadow-blue-500/10'
                                                            : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                                                    >
                                                        <RadioGroupItem value={optVal} className="sr-only" />
                                                        <div className="aspect-square w-full bg-slate-50 overflow-hidden">
                                                            {optImg ? (
                                                                <img
                                                                    src={optImg}
                                                                    alt={optVal}
                                                                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${answers[q.id] === optVal ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}`}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                                    <ClipboardList className="w-12 h-12" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`p-5 text-center font-black uppercase tracking-widest text-[10px] transition-colors ${answers[q.id] === optVal ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'}`}>
                                                            {optVal}
                                                        </div>
                                                        {answers[q.id] === optVal && (
                                                            <div className="absolute top-4 right-4 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in-50 ring-4 ring-white">
                                                                <CheckCircle2 className="w-6 h-6 text-white" />
                                                            </div>
                                                        )}
                                                    </Label>
                                                )
                                            })}
                                        </RadioGroup>
                                    ) : q.type === 'RATING' ? (
                                        <RadioGroup
                                            value={answers[q.id] || ''}
                                            onValueChange={(val) => handleAnswerChange(q.id, val)}
                                            className="flex flex-wrap gap-3"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                                                <Label
                                                    key={val}
                                                    className={`relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl border-2 transition-all cursor-pointer text-lg font-black ${answers[q.id] === val.toString()
                                                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                        : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 text-slate-400'}`}
                                                >
                                                    <RadioGroupItem value={val.toString()} className="sr-only" />
                                                    {val}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    ) : (
                                        <div className="space-y-4">
                                            <Textarea
                                                placeholder="Type your response here..."
                                                className="min-h-[150px] border-none bg-slate-50 rounded-[2rem] p-8 text-lg font-medium shadow-inner focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                                                value={answers[q.id] || ''}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                            />
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Info className="w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest italic opacity-60 px-2">Encrypted stream direct to HUSU archive</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-col items-center py-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">Final Verification</h3>
                        <p className="text-slate-500 font-medium">Please review your answers before submitting the mission log.</p>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="h-20 px-16 rounded-[2.5rem] bg-blue-600 hover:bg-black text-white shadow-2xl shadow-blue-500/30 font-black uppercase tracking-[0.2em] text-sm group transition-all hover:scale-105 active:scale-95 disabled:grayscale"
                    >
                        {submitting ? (
                            <Loader className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                Finalize & Upload Survey
                                <CheckCircle2 className="ml-4 w-6 h-6 group-hover:scale-125 transition-transform" />
                            </>
                        )}
                    </Button>

                    <div className="flex items-center gap-4 text-slate-400 pt-8 opacity-40">
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Readiness Protocol v1.5</p>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}
