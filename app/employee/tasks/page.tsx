'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, ClipboardList, CheckCircle2, ChevronRight, Play, Layout, Zap, ArrowRight, Calendar, MessageSquare } from 'lucide-react'

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

export default function EmployeeTasksPage() {
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
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTask = (task: ActiveTask) => {
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
  const completedCount = tasks.length - activeTasks.length

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Active Tasks</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Complete your assigned surveys to help your organization grow.</p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <Card className="bg-white border-none shadow-sm flex-1 md:flex-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 leading-none mb-1">Pending</p>
                <p className="text-xl font-black text-slate-900 leading-none">{activeTasks.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm flex-1 md:flex-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 leading-none mb-1">Completed</p>
                <p className="text-xl font-black text-slate-900 leading-none">{completedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-3xl" />
          ))
        ) : activeTasks.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200 bg-white/50 py-16 text-center rounded-3xl">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">All caught up!</h3>
            <p className="text-slate-500 mt-2">You have no pending tasks at the moment.</p>
          </Card>
        ) : (
          activeTasks.map((task) => (
            <Card key={task.id} className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border-none rounded-3xl overflow-hidden bg-white">
              <div className="flex flex-col md:flex-row items-stretch">
                <div className={`w-2 md:w-3 ${task.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-blue-600'}`} />
                <CardContent className="flex-1 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shadow-inner border border-slate-100 flex items-center justify-center shrink-0">
                        {task.thumbnail_url ? (
                          <img src={task.thumbnail_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${task.form_type === 'INTERACTIVE' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            {task.form_type === 'INTERACTIVE' ? <Play className="w-7 h-7" /> : <ClipboardList className="w-7 h-7" />}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors uppercase">{task.form_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`rounded-lg py-0 px-2 text-[10px] font-black uppercase tracking-widest ${task.status === 'IN_PROGRESS' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-blue-200 bg-blue-50 text-blue-700'
                            }`}>
                            {task.status === 'IN_PROGRESS' ? 'In Progress' : 'New Assignment'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {task.message && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm italic text-slate-600 leading-relaxed shadow-inner">
                        <MessageSquare className="w-4 h-4 mb-2 text-slate-400" />
                        "{task.message}"
                      </div>
                    )}

                    <div className="space-y-2 max-w-md">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Completion Progress</span>
                        <span className="text-sm font-black text-slate-900">{task.progress_percentage}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${task.status === 'IN_PROGRESS' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}
                          style={{ width: `${task.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {task.due_date && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border transition-colors ${getDaysRemaining(task.due_date) <= 2 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                        <Calendar className="w-4 h-4" />
                        <span>Ends {getDaysRemaining(task.due_date)} Days</span>
                      </div>
                    )}

                    <Button
                      onClick={() => handleStartTask(task)}
                      className={`h-14 px-8 rounded-2xl text-lg font-black uppercase tracking-widest transition-all group/btn ${task.status === 'IN_PROGRESS'
                        ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                        }`}
                    >
                      <span className="flex items-center gap-3">
                        {task.status === 'IN_PROGRESS' ? 'Continue' : 'Start Now'}
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
