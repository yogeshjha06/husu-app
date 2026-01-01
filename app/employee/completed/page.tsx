'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download } from 'lucide-react'
import { toast } from 'sonner'

interface CompletedTask {
  id: string
  form_name: string
  completed_at: string
  time_spent_seconds: number
  score?: number
}

export default function CompletedTasksPage() {
  const { userProfile } = useAuth()
  const [tasks, setTasks] = useState<CompletedTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompletedTasks()
  }, [])

  const fetchCompletedTasks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/employee/completed-tasks', { credentials: 'include' })
      if (res.ok) {
        const { data } = await res.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching completed tasks:', error)
      toast.error('Failed to load completed tasks')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Completed Surveys</h1>
        <p className="text-slate-600 mt-1">View your completed survey submissions</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-100 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Completed</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{tasks.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-slate-900">{task.form_name}</h3>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Completed</p>
                        <p className="font-semibold text-slate-900 mt-1">
                          {new Date(task.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Time Spent</p>
                        <p className="font-semibold text-slate-900 mt-1">
                          {formatTime(task.time_spent_seconds)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Score</p>
                        <p className="font-semibold text-slate-900 mt-1">
                          {Math.round(task.score!)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="ml-4" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No completed surveys yet. Start a survey to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
