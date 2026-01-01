'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Clock,
    ClipboardList,
    CheckCircle2,
    Play,
    Zap,
    ArrowRight,
    Calendar,
    MessageSquare,
    Sparkles,
    Layout,
    Target,
    Award
} from 'lucide-react'
import { toast } from 'sonner'

interface ActiveTask {
    id: string
    form_id: string
    form_name: string
    form_type: string
    status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED'
    due_date: string | null
    message?: string
    thumbnail_url?: string
    progress_percentage: number
    response_id: string | null
    assigned_at: string
}

export default function EmployeeSurveysPage() {
    const { userProfile } = useAuth()
    const router = useRouter()
    const [tasks, setTasks] = useState<ActiveTask[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/employee/tasks', { credentials: 'include' })
            if (res.ok) {
                const { data } = await res.json()
                setTasks(data)
            }
        } catch (error) {
            console.error('Error fetching surveys:', error)
            toast.error('Failed to load your surveys')
        } finally {
            setLoading(false)
        }
    }

    const handleStartTask = (task: ActiveTask) => {
        if (task.status === 'SUBMITTED' || task.status === 'COMPLETED') {
            toast.info('You have already completed this survey.')
            router.push('/employee/certificates')
            return
        }

        if (task.form_type === 'INTERACTIVE') {
            router.push(`/employee/surveys/interactive/${task.form_id}`)
        } else {
            router.push(`/employee/surveys/standard/${task.form_id}`)
        }
    }

    const getDaysRemaining = (dueDate: string) => {
        const now = new Date()
        const due = new Date(dueDate)
        const diff = due.getTime() - now.getTime()
        const days = Math.ceil(diff / (1000 * 3600 * 24))
        return days > 0 ? days : 0
    }

    const activeTasks = tasks.filter(t => t.status !== 'SUBMITTED' && t.status !== 'COMPLETED')
    const completedTasks = tasks.filter(t => t.status === 'SUBMITTED' || t.status === 'COMPLETED')

    return (
        <div className="p-8 space-y-12 bg-slate-50 min-h-screen">
            {/* Dynamic Header Section */}
            <div className="relative group overflow-hidden bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl shadow-slate-900/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Impact Protocol Active</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                            Survey <span className="text-blue-500">Command</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium max-w-lg leading-relaxed">
                            Analyze, hypothesize, and contribute to the HUSU platform sustainability standards.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Assigned</p>
                            <p className="text-3xl font-black text-white">{activeTasks.length}</p>
                        </div>
                        <div className="px-8 py-4 bg-blue-600 rounded-3xl text-center shadow-xl shadow-blue-500/20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Solved</p>
                            <p className="text-3xl font-black text-white">{completedTasks.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Surveys Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Target className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">Active Missions</h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {[1, 2].map((_, i) => (
                            <div key={i} className="h-64 bg-white border-2 border-slate-100 animate-pulse rounded-[3rem]" />
                        ))}
                    </div>
                ) : activeTasks.length === 0 ? (
                    <Card className="border-4 border-dashed border-slate-200 bg-white/50 py-24 text-center rounded-[3.5rem] shadow-inner">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <CheckCircle2 className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">All Systems Clear</h3>
                        <p className="text-slate-500 mt-2 text-md font-medium max-w-sm mx-auto">
                            No pending surveys are assigned to your workspace at this time.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {activeTasks.map((task) => (
                            <Card key={task.id} className="group hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 border-none rounded-[3rem] overflow-hidden bg-white">
                                <CardContent className="p-0">
                                    <div className="flex flex-col h-full">
                                        <div className="relative h-48 sm:h-64 overflow-hidden bg-slate-100">
                                            <div className={`absolute top-6 left-6 z-10 px-5 py-2 rounded-2xl backdrop-blur-md border font-black uppercase tracking-widest text-[10px] ${task.form_type === 'INTERACTIVE' ? 'bg-purple-900/40 border-purple-400 text-white' : 'bg-blue-900/40 border-blue-400 text-white'
                                                }`}>
                                                {task.form_type.replace('_', ' ')}
                                            </div>

                                            {task.thumbnail_url ? (
                                                <img src={task.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={task.form_name} />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${task.form_type === 'INTERACTIVE' ? 'bg-purple-950' : 'bg-blue-950'}`}>
                                                    {task.form_type === 'INTERACTIVE' ? <Zap className="w-16 h-16 text-purple-500/20" /> : <Layout className="w-16 h-16 text-blue-500/20" />}
                                                    <Target className="absolute w-32 h-32 opacity-10 text-white stroke-[1]" />
                                                </div>
                                            )}

                                            {task.status === 'IN_PROGRESS' && (
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                                    <div className="bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-2xl shadow-2xl animate-pulse">
                                                        Resume Visualization
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-10 space-y-8 flex-1 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase group-hover:text-blue-600 transition-colors italic truncate">{task.form_name}</h3>
                                                {task.message && (
                                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                                                        <p className="text-sm font-bold italic text-slate-500 leading-relaxed pr-6 line-clamp-2">"{task.message}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-8">
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                                    {task.due_date && (
                                                        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${getDaysRemaining(task.due_date) <= 2 ? 'bg-red-50 text-red-600 border-red-100 shadow-lg shadow-red-200/50' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{getDaysRemaining(task.due_date)} Days Port</span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 w-full sm:w-auto h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner hidden sm:block">
                                                        <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${task.progress_percentage}%` }} />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 hidden sm:block">{task.progress_percentage}%</span>
                                                </div>

                                                <Button
                                                    onClick={() => handleStartTask(task)}
                                                    className={`w-full h-16 rounded-3xl text-lg font-black uppercase tracking-widest transition-all shadow-2xl group/btn ${task.status === 'IN_PROGRESS' ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20' : 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20'}`}
                                                >
                                                    <span className="flex items-center gap-4">
                                                        {task.status === 'IN_PROGRESS' ? 'Synchronize Progress' : 'Initialize Session'}
                                                        <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform duration-500" />
                                                    </span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Completed Surveys Section */}
            {completedTasks.length > 0 && (
                <div className="space-y-8 pt-12 border-t border-slate-200">
                    <div className="flex items-center gap-4">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">Completed Successes</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {completedTasks.map((task) => (
                            <Card key={task.id} className="group hover:shadow-xl transition-all duration-500 border-none rounded-[2.5rem] overflow-hidden bg-white/60">
                                <CardContent className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                                        </div>
                                        <Badge className="bg-green-600 text-white font-black uppercase tracking-widest text-[8px] rounded-lg">DONE</Badge>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic truncate mb-2">{task.form_name}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Assessment Finalized</p>

                                    <Button
                                        onClick={() => router.push('/employee/certificates')}
                                        variant="outline"
                                        className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-slate-100 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all group"
                                    >
                                        <Award className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                        View Certificate
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
