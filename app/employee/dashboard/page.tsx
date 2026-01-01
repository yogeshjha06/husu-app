'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/lib/auth/auth-context'
import { CheckCircle2, Clock, Award, Zap, ArrowRight, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function EmployeeDashboard() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    inProgress: 0,
    certificates: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/employee/tasks', { credentials: 'include' })
        if (res.ok) {
          const { data } = await res.json()

          const completed = data?.filter((t: any) => t.status === 'SUBMITTED' || t.status === 'COMPLETED').length || 0
          const pending = data?.filter((t: any) => t.status === 'PENDING').length || 0
          const inProgress = data?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0

          setStats({
            completed,
            pending,
            inProgress,
            certificates: 0, // Will be linked to certifications API later
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userProfile?.id])

  const StatCard = ({ icon: Icon, label, value, color, delay }: any) => (
    <Card
      className="group hover:shadow-2xl transition-all duration-500 border-none rounded-[2rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <p className="text-4xl font-black text-slate-900 mt-1">{value}</p>
            </div>
          </div>
          <div className="pt-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-8 space-y-10 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Employee Command Center</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
            Hello, {userProfile?.first_name || 'Visionary'}
          </h1>
          <p className="text-slate-500 text-lg font-medium">Navigate your sustainability targets and performance metrics.</p>
        </div>

        <Button
          onClick={() => router.push('/employee/tasks')}
          className="h-14 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all group"
        >
          View All Tasks
          <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Zap}
          label="Pending Action"
          value={stats.pending}
          color="bg-amber-100 text-amber-600"
          delay={100}
        />
        <StatCard
          icon={Clock}
          label="Operational"
          value={stats.inProgress}
          color="bg-blue-100 text-blue-600"
          delay={200}
        />
        <StatCard
          icon={CheckCircle2}
          label="Finalized"
          value={stats.completed}
          color="bg-green-100 text-green-600"
          delay={300}
        />
        <StatCard
          icon={Award}
          label="Credentials"
          value={stats.certificates}
          color="bg-purple-100 text-purple-600"
          delay={400}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 p-1">
          <CardContent className="p-10 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Active Strategy</h3>
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex flex-col md:flex-row items-center gap-8 shadow-inner">
              <div className="flex-1 space-y-4 text-center md:text-left">
                {stats.pending > 0 ? (
                  <>
                    <h4 className="text-xl font-bold text-slate-900">Task Overflow Detected</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      You have <span className="text-blue-600 font-black">{stats.pending} assignments</span> waiting for your input.
                      Prompt action ensures data integrity for your organization.
                    </p>
                    <Button
                      onClick={() => router.push('/employee/tasks')}
                      variant="secondary"
                      className="mt-2 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]"
                    >
                      Initialize Tasks Now
                    </Button>
                  </>
                ) : (
                  <>
                    <h4 className="text-xl font-bold text-green-600">Peak Efficiency Reached</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Mission accomplished. All surveys are finalized. Your data is currently being synthesized by the HUSU analytics engine.
                    </p>
                  </>
                )}
              </div>
              <div className="w-32 h-32 flex-shrink-0 bg-white rounded-3xl shadow-lg flex items-center justify-center border border-slate-50">
                <div className="relative">
                  <Clock className="w-12 h-12 text-slate-200" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-slate-900">{stats.pending}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none rounded-[2.5rem] bg-slate-900 text-white p-1 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
          <CardContent className="p-10 h-full flex flex-col justify-between">
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight italic">Industry Recognition</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Every completed task brings you closer to your next verified sustainability certificate.
              </p>
            </div>
            <Button
              onClick={() => router.push('/employee/certificates')}
              className="w-full h-14 bg-white text-slate-900 hover:bg-blue-50 rounded-2xl font-black uppercase tracking-widest text-xs relative z-10"
            >
              Open Gallery
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
