'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Volume2,
    VolumeX,
    CheckCircle2,
    Loader,
    X,
    Target,
    Zap,
    ShieldCheck,
    Video,
    Trophy,
    ArrowRight,
    HelpCircle,
    Award
} from 'lucide-react'
import { toast } from 'sonner'
import { CertificateOverlay } from '@/components/employee/certificate-overlay'

interface Slide {
    id: string
    type: 'intro' | 'video' | 'question' | 'conclusion'
    title?: string
    description?: string
    image?: string
    videoType?: 'youtube' | 'upload'
    youtubeUrl?: string
    videoUrl?: string
    startTime?: number
    endTime?: number
    question?: {
        title: string
        type: string
        options?: string[]
        imageOptions?: { url: string; label?: string }[]
        required: boolean
    }
}

type Template = 'vibrant' | 'elegant' | 'minimal'

const templates = {
    vibrant: {
        name: 'Vibrant',
        bg: 'from-purple-600 via-pink-600 to-red-600',
        text: 'text-white',
        accent: 'bg-yellow-400 text-purple-900'
    },
    elegant: {
        name: 'Elegant',
        bg: 'from-slate-900 via-blue-900 to-slate-900',
        text: 'text-white',
        accent: 'bg-blue-400 text-slate-900'
    },
    minimal: {
        name: 'Minimal',
        bg: 'from-emerald-50 via-teal-50 to-cyan-50',
        text: 'text-slate-900',
        accent: 'bg-emerald-600 text-white'
    }
}

interface Form {
    id: string
    name: string
    description: string
    template: Template
    slides: Slide[]
    response_status?: string
}

export default function InteractiveSurveyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { userProfile } = useAuth()
    const router = useRouter()

    const [form, setForm] = useState<Form | null>(null)
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [videoProgress, setVideoProgress] = useState(0)
    const [videoEnded, setVideoEnded] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showCertificate, setShowCertificate] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        fetchForm()
    }, [id])

    // Sync video element with isPlaying state to avoid "play() interrupted by pause()" errors
    useEffect(() => {
        if (!videoRef.current) return

        if (isPlaying) {
            const playPromise = videoRef.current.play()
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Video playback interrupted or blocked:', error)
                    setIsPlaying(false)
                })
            }
        } else {
            videoRef.current.pause()
        }
    }, [isPlaying, currentSlideIndex])

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
            console.error('Error fetching interactive form:', error)
            toast.error('Failed to load session')
        } finally {
            setLoading(false)
        }
    }

    const handleNext = async () => {
        if (!form) return

        if (currentSlideIndex < form.slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1)
            setIsPlaying(false)
            setVideoProgress(0)
            setVideoEnded(false)
            await saveProgress(false)
        } else {
            await saveProgress(true)
        }
    }

    const handlePrevious = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1)
            setIsPlaying(false)
            setVideoProgress(0)
            setVideoEnded(false)
        }
    }

    const saveProgress = async (isFinal: boolean) => {
        if (!form) return
        const progress = Math.round(((currentSlideIndex + 1) / form.slides.length) * 100)

        setSubmitting(true)
        try {
            const res = await fetch('/api/employee/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    form_id: id,
                    answers,
                    progress_percentage: isFinal ? 100 : progress,
                    status: isFinal ? 'SUBMITTED' : 'IN_PROGRESS'
                })
            })
            if (res.ok && isFinal) {
                toast.success('Interactive session completed!')
                setShowSuccess(true)
            }
        } catch (error) {
            console.error('Progress save error:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const extractYouTubeId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
        return match ? match[1] : ''
    }

    const togglePlay = () => {
        setIsPlaying(!isPlaying)
    }

    const handleVideoTimeUpdate = () => {
        if (videoRef.current && form) {
            const slide = form.slides[currentSlideIndex]
            const duration = (slide.endTime || 60) - (slide.startTime || 0)
            const current = videoRef.current.currentTime - (slide.startTime || 0)
            const progress = (current / duration) * 100
            setVideoProgress(progress)

            if (videoRef.current.currentTime >= (slide.endTime || 60)) {
                videoRef.current.pause()
                setIsPlaying(false)
                setVideoEnded(true)
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
                <Loader className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Synchronizing Core Systems...</p>
            </div>
        )
    }

    if (!form || !form.slides || form.slides.length === 0) return null

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-xl w-full text-center space-y-10 animate-in zoom-in-95 duration-700 relative z-10">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/40 relative z-10">
                            <CheckCircle2 className="w-16 h-16 text-white" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Session <span className="text-blue-500">Mastered</span></h1>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">
                            You've successfully completed the interactive journey. Your performance metrics have been recorded and your certificate is ready.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                            onClick={() => setShowCertificate(true)}
                            className="h-16 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 group"
                        >
                            <Trophy className="w-5 h-5 mr-3" />
                            Claim Certificate
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/employee/surveys')}
                            className="h-16 rounded-3xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs"
                        >
                            Back to Dashboard
                            <ArrowRight className="ml-3 w-5 h-5" />
                        </Button>
                    </div>

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

    const currentSlide = form.slides[currentSlideIndex]
    const isLastSlide = currentSlideIndex === form.slides.length - 1
    const t = templates[form.template || 'vibrant']

    return (
        <div className={`min-h-screen ${currentSlide.type === 'video' ? 'bg-black' : 'bg-slate-50'} text-slate-900 flex flex-col overflow-hidden transition-colors duration-1000`}>
            {/* Platform Header */}
            <div className="p-6 md:p-10 flex justify-between items-center relative z-20">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/employee/surveys')}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group ${currentSlide.type === 'video' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-200 hover:bg-slate-300'}`}
                    >
                        <X className={`w-5 h-5 ${currentSlide.type === 'video' ? 'text-slate-400 group-hover:text-white' : 'text-slate-600'}`} />
                    </button>
                    <div className="hidden md:block">
                        <h2 className={`text-sm font-black uppercase tracking-widest mb-1 leading-none italic ${currentSlide.type === 'video' ? 'text-white/40' : 'text-slate-400'}`}>Interactive Session</h2>
                        <h1 className={`text-xl font-black uppercase tracking-tight italic leading-none ${currentSlide.type === 'video' ? 'text-white' : 'text-slate-900'}`}>{form.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Impact Protocol</span>
                        <div className="flex gap-1">
                            {form.slides.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1 rounded-full transition-all duration-500 ${idx === currentSlideIndex ? 'w-8 bg-blue-500' : idx < currentSlideIndex ? 'w-4 bg-blue-400' : (currentSlide.type === 'video' ? 'w-4 bg-white/10' : 'w-4 bg-slate-200')}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${currentSlide.type === 'video' ? 'bg-blue-600/20 border-blue-500/30' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                    </div>
                </div>
            </div>

            {/* Main Experience Engine */}
            <div className="flex-1 relative flex items-center justify-center p-6 sm:p-12 pt-0">
                <div className="w-full max-w-6xl h-full flex flex-col justify-center">

                    {/* Introductory / Content Slides */}
                    {(currentSlide.type === 'intro' || currentSlide.type === 'conclusion') && (
                        <div key={currentSlide.id} className={`max-w-4xl mx-auto w-full min-h-[500px] flex flex-col items-center justify-center bg-gradient-to-br ${t.bg} rounded-[3rem] p-12 md:p-20 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-1000`}>
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48" />

                            <div className="relative z-10 text-center space-y-10">
                                {currentSlide.image && (
                                    <div className="relative inline-block">
                                        <img src={currentSlide.image} alt="" className="w-40 h-40 object-cover rounded-[2.5rem] border-4 border-white shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500" />
                                        <Award className="absolute -bottom-4 -right-4 w-12 h-12 text-yellow-400 bg-white rounded-full p-2 shadow-xl" />
                                    </div>
                                )}
                                <h1 className={`text-6xl md:text-8xl font-black ${t.text} tracking-tighter uppercase italic leading-none`}>
                                    {currentSlide.title}
                                </h1>
                                <p className={`text-xl md:text-3xl ${t.text} opacity-90 font-medium italic leading-relaxed max-w-2xl mx-auto`}>
                                    {currentSlide.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Video Slides */}
                    {currentSlide.type === 'video' && (
                        <div key={currentSlide.id} className="relative group w-full aspect-video rounded-[3rem] overflow-hidden bg-slate-900 shadow-[0_0_120px_rgba(0,0,0,0.6)] border border-white/5 animate-in zoom-in-95 duration-1000">
                            {currentSlide.videoType === 'upload' && currentSlide.videoUrl ? (
                                <video
                                    ref={videoRef}
                                    src={currentSlide.videoUrl}
                                    className="w-full h-full object-cover"
                                    onLoadedMetadata={(e) => {
                                        e.currentTarget.currentTime = currentSlide.startTime || 0
                                    }}
                                    onTimeUpdate={handleVideoTimeUpdate}
                                    onEnded={() => {
                                        setIsPlaying(false)
                                        setVideoEnded(true)
                                    }}
                                    onClick={togglePlay}
                                    muted={isMuted}
                                    playsInline
                                />
                            ) : (
                                <iframe
                                    src={`https://www.youtube.com/embed/${extractYouTubeId(currentSlide.youtubeUrl || '')}?start=${currentSlide.startTime || 0}&end=${currentSlide.endTime || 60}&autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=0&cc_load_policy=0&playsinline=1`}
                                    className="w-full h-full"
                                    allow="autoplay"
                                    onLoad={() => {
                                        // Simulate video end for youtube because we can't easily detect end in iframe without API
                                        setTimeout(() => setVideoEnded(true), ((currentSlide.endTime || 60) - (currentSlide.startTime || 0)) * 1000)
                                    }}
                                />
                            )}

                            {/* HUD Controls for uploaded videos */}
                            {currentSlide.videoType === 'upload' && (
                                <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-100 opacity-0 transition-opacity duration-500 pointer-events-none">
                                    <div className="flex items-center gap-8 pointer-events-auto">
                                        <button onClick={togglePlay} className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center transform active:scale-95 transition-all shadow-xl">
                                            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                                        </button>
                                        <div className="flex-1 space-y-4">
                                            <h4 className="text-xl font-black uppercase tracking-tight text-white italic">{currentSlide.title || 'Analysis Module'}</h4>
                                            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                                            </div>
                                        </div>
                                        <button onClick={() => setIsMuted(!isMuted)} className="p-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                                            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isPlaying && videoProgress === 0 && currentSlide.videoType === 'upload' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                                    <div className="text-center space-y-6">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-blue-600 flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                                            <Video className="w-10 h-10 text-white" />
                                        </div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic">Initialize Simulation</h3>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tap to begin visualization</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Question Slides */}
                    {currentSlide.type === 'question' && (
                        <div key={currentSlide.id} className={`max-w-4xl mx-auto w-full min-h-[600px] flex flex-col justify-center bg-gradient-to-br ${t.bg} rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-700`}>
                            <div className="relative z-10 space-y-12">
                                <div className="space-y-4">
                                    <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-full border ${t.text} opacity-60 font-black uppercase tracking-[0.2em] text-[10px]`}>
                                        <HelpCircle className="w-4 h-4" /> Cognitive Analysis Phase
                                    </span>
                                    <h2 className={`text-4xl md:text-6xl font-black ${t.text} tracking-tighter uppercase italic leading-tight`}>
                                        {currentSlide.question?.title}
                                    </h2>
                                </div>

                                {/* Question Types Implementation */}
                                <div className="w-full">
                                    {/* IMAGE_MCQ */}
                                    {(currentSlide.question?.type === 'IMAGE_MCQ' || currentSlide.question?.type === 'IMAGE_OPTION') && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {currentSlide.question.imageOptions?.map((imgOpt, i) => (
                                                <label key={i} className={`relative group cursor-pointer transition-all hover:scale-[1.03] active:scale-95 ${answers[currentSlide.id] === imgOpt.url ? 'scale-[1.03]' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name={currentSlide.id}
                                                        value={imgOpt.url}
                                                        checked={answers[currentSlide.id] === imgOpt.url}
                                                        onChange={(e) => setAnswers({ ...answers, [currentSlide.id]: e.target.value })}
                                                        className="sr-only"
                                                    />
                                                    <div className={`rounded-[2.5rem] overflow-hidden border-4 transition-all shadow-2xl ${answers[currentSlide.id] === imgOpt.url ? 'border-white' : 'border-white/10 group-hover:border-white/40'}`}>
                                                        <img src={imgOpt.url} alt={imgOpt.label} className="w-full h-56 object-cover" />
                                                        {imgOpt.label && (
                                                            <div className={`p-5 text-center font-black uppercase italic tracking-tighter text-lg ${answers[currentSlide.id] === imgOpt.url ? t.accent : 'bg-white/10 text-white'}`}>
                                                                {imgOpt.label}
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* MCQ / TRUE_FALSE */}
                                    {(currentSlide.question?.type === 'MCQ' || currentSlide.question?.type === 'TRUE_FALSE') && (
                                        <div className="grid gap-4">
                                            {(currentSlide.question.type === 'TRUE_FALSE' ? ['True', 'False'] : currentSlide.question.options || []).map((opt, i) => (
                                                <label key={i} className={`flex items-center gap-6 p-8 rounded-[2rem] border-4 transition-all cursor-pointer group hover:scale-[1.02] active:scale-95 ${answers[currentSlide.id] === opt ? `border-white shadow-2xl ${t.accent}` : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'}`}>
                                                    <input
                                                        type="radio"
                                                        name={currentSlide.id}
                                                        value={opt}
                                                        checked={answers[currentSlide.id] === opt}
                                                        onChange={(e) => setAnswers({ ...answers, [currentSlide.id]: e.target.value })}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${answers[currentSlide.id] === opt ? 'border-current' : 'border-white/40'}`}>
                                                        {answers[currentSlide.id] === opt && <div className="w-3 h-3 rounded-full bg-current animate-in zoom-in" />}
                                                    </div>
                                                    <span className={`text-2xl font-black uppercase italic tracking-tighter ${answers[currentSlide.id] === opt ? '' : 'text-white'}`}>
                                                        {opt}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* MULTI_OPTION */}
                                    {currentSlide.question?.type === 'MULTI_OPTION' && (
                                        <div className="grid gap-4">
                                            {currentSlide.question.options?.map((opt, i) => (
                                                <label key={i} className={`flex items-center gap-6 p-8 rounded-[2rem] border-4 transition-all cursor-pointer group hover:scale-[1.02] active:scale-95 ${(answers[currentSlide.id] || []).includes(opt) ? `border-white shadow-2xl ${t.accent}` : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={(answers[currentSlide.id] || []).includes(opt)}
                                                        onChange={(e) => {
                                                            const current = answers[currentSlide.id] || []
                                                            setAnswers({ ...answers, [currentSlide.id]: e.target.checked ? [...current, opt] : current.filter((v: any) => v !== opt) })
                                                        }}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-8 h-8 rounded-xl border-4 flex items-center justify-center transition-all ${(answers[currentSlide.id] || []).includes(opt) ? 'border-current' : 'border-white/40'}`}>
                                                        {(answers[currentSlide.id] || []).includes(opt) && <CheckCircle2 className="w-5 h-5 animate-in zoom-in" />}
                                                    </div>
                                                    <span className="text-2xl font-black uppercase italic tracking-tighter">
                                                        {opt}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* RATING */}
                                    {currentSlide.question?.type === 'RATING' && (
                                        <div className="space-y-10">
                                            <div className="flex justify-between font-black uppercase tracking-widest text-[10px] text-white/40 italic">
                                                <span>Minimal Impact</span>
                                                <span>Maximum Achievement</span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 justify-center">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                    <button
                                                        key={num}
                                                        onClick={() => setAnswers({ ...answers, [currentSlide.id]: num })}
                                                        className={`w-16 h-16 rounded-2xl border-4 font-black text-2xl transition-all hover:scale-110 active:scale-90 ${answers[currentSlide.id] === num ? `border-white shadow-2xl ${t.accent}` : 'border-white/10 bg-white/5 hover:bg-white/20 text-white'}`}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* SUBJECTIVE */}
                                    {currentSlide.question?.type === 'SUBJECTIVE' && (
                                        <Textarea
                                            placeholder="Type your strategic synthesis here..."
                                            value={answers[currentSlide.id] || ''}
                                            onChange={(e) => setAnswers({ ...answers, [currentSlide.id]: e.target.value })}
                                            className="min-h-[250px] text-2xl border-4 border-white/20 bg-white/10 focus:bg-white/20 focus:border-white text-white rounded-[2rem] p-10 font-bold placeholder:text-white/20 shadow-inner"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Control HUD */}
            <div className={`p-10 flex flex-col sm:flex-row items-center justify-between gap-8 relative z-20 ${currentSlide.type === 'video' ? 'bg-black/60 backdrop-blur-md' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-3 order-2 sm:order-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest italic ${currentSlide.type === 'video' ? 'text-white/30' : 'text-slate-400'}`}>Module {currentSlideIndex + 1} // Platform Engine</span>
                    <div className={`w-1 h-1 rounded-full ${currentSlide.type === 'video' ? 'bg-white/20' : 'bg-slate-300'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Auto-sync Active</span>
                </div>
                <div className="flex items-center gap-6 w-full sm:w-auto order-1 sm:order-2">
                    <Button
                        variant="ghost"
                        onClick={handlePrevious}
                        disabled={currentSlideIndex === 0}
                        className={`h-16 px-10 rounded-2xl border-none disabled:opacity-20 font-black uppercase tracking-widest text-[10px] ${currentSlide.type === 'video' ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <ChevronLeft className="w-6 h-6 mr-2" />
                        Rewind
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={submitting || (currentSlide.type === 'video' && !videoEnded)}
                        className={`flex-1 sm:flex-none h-16 px-14 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl group ${isLastSlide ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20' : (currentSlide.type === 'video' ? 'bg-white hover:bg-blue-50 text-black shadow-white/10' : 'bg-slate-900 hover:bg-black text-white shadow-slate-900/10')}`}
                    >
                        {isLastSlide ? 'Complete Protocol' : (currentSlide.type === 'video' && !videoEnded ? 'Analyzing...' : 'Next Phase')}
                        {isLastSlide ? <CheckCircle2 className="ml-4 w-6 h-6" /> : <ChevronRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
