'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth/auth-context'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Users,
  CheckCircle,
  TrendingUp,
  Award,
  Activity,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  Target,
  ShieldCheck,
  Zap,
  LayoutDashboard
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { generateAnalyticsReport } from '@/lib/utils/pdf-generator'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface KPIData {
  totalUsers: number
  completedSurveys: number
  pendingSurveys: number
  completionRate: number
}

export default function OrgAdminDashboard() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [kpiData, setKpiData] = useState<KPIData>({
    totalUsers: 0,
    completedSurveys: 0,
    pendingSurveys: 0,
    completionRate: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await fetch('/api/org-admin/stats', { credentials: 'include' })
        if (res.ok) {
          const { data, chartData: fetchedChartData } = await res.json()
          setKpiData(data)
          setChartData(fetchedChartData)
        }
      } catch (error) {
        console.error('Error fetching KPIs:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/org-admin/analytics')
        if (res.ok) {
          const json = await res.json()
          setAnalyticsData(json.data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      }
    }

    fetchKPIs()
    fetchAnalytics()
  }, [userProfile?.org_id, userProfile?.id])

  const handleExportReport = async () => {
    setExporting(true)
    toast.info('Generating your analytics report...')

    try {
      await generateAnalyticsReport({
        organizationName: (userProfile as any)?.organization_name || userProfile?.first_name || 'Organization',
        generatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        kpiData,
        analyticsData,
        chartData
      })

      toast.success('Report downloaded successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const radialData = [
    { name: 'Completed', value: kpiData.completionRate, color: '#2563eb' },
    { name: 'Remaining', value: 100 - kpiData.completionRate, color: '#f1f5f9' },
  ]

  const StatCard = ({ icon: Icon, label, value, color, description, trend, index }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="group relative hover:shadow-2xl transition-all duration-500 border-none rounded-[2.5rem] bg-white overflow-hidden shadow-xl shadow-slate-200/50 h-full">
        <div className={`absolute top-0 right-0 w-32 h-32 ${color.split(' ')[0]} opacity-5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-10 transition-opacity`} />

        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="space-y-6">
              <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">{label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
                  {trend && (
                    <span className="text-[10px] font-bold text-green-600 flex items-center bg-green-50 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      {trend}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-medium text-slate-500">{description}</p>
              </div>
            </div>

            <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-300 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-white text-xs font-bold uppercase tracking-tight">
                {entry.name}: <span className="text-lg ml-1">{entry.value}</span>
              </p>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-8 space-y-10 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center gap-2">
              <LayoutDashboard className="w-3 h-3 text-blue-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Admin Intelligence briefing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live Secure</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Welcome, {userProfile?.first_name || 'Visionary'}
            </h1>
            <div className="relative">
              <CheckCircle className="w-10 h-10 text-blue-600 fill-blue-50" />
              <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20 animate-pulse" />
            </div>
          </div>
          <p className="text-slate-500 text-lg font-medium max-w-xl">
            Real-time organizational intelligence and performance monitoring.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3"
        >
          <Button
            variant="outline"
            className="h-12 px-6 rounded-2xl border-2 border-slate-200 font-black uppercase tracking-widest text-[10px] hover:bg-white shadow-sm transition-all"
            onClick={handleExportReport}
            disabled={exporting}
          >
            {exporting ? 'Generating...' : 'Analytics'}
          </Button>
          <Button
            className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-900/20 transition-all"
            onClick={() => router.push('/org-admin/insights/reports')}
          >
            Report
          </Button>
        </motion.div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Operational Units"
          value={kpiData.totalUsers}
          color="bg-blue-600 text-white"
          description="Total active employees"
          trend="+12%"
          index={0}
        />
        <StatCard
          icon={CheckCircle}
          label="Mission Success"
          value={kpiData.completedSurveys}
          color="bg-green-500 text-white"
          description="Successfully submitted"
          trend="+8%"
          index={1}
        />
        <StatCard
          icon={Activity}
          label="Active Missions"
          value={kpiData.pendingSurveys}
          color="bg-amber-500 text-white"
          description="Surveys in progress"
          index={2}
        />
        <StatCard
          icon={Target}
          label="Efficiency Index"
          value={`${kpiData.completionRate}%`}
          color="bg-purple-600 text-white"
          description="Overall organization progress"
          trend="+4.2%"
          index={3}
        />
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-none rounded-[3.5rem] bg-white shadow-2xl shadow-slate-200/50 overflow-hidden h-full">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Progress Velocity</CardTitle>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly engagement and completion trends</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-[9px] font-black uppercase text-slate-500 italic">Completed</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <div className="h-[280px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#2563eb"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      name="Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Integrated Mini KPIs */}
              <div className="border-t border-slate-50 pt-8 mt-4">
                <div className="flex items-center gap-3 mb-6 px-1">
                  <div className="w-1 h-6 bg-blue-600 rounded-full" />
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 leading-none">Key Performance Indicators</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time organizational telemetry</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="group/mini p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-xl transition-all duration-500">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Current Success</p>
                    <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-black text-slate-900 italic tracking-tighter">{kpiData.completedSurveys}</h4>
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="group/mini p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-xl transition-all duration-500">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Pending Ops</p>
                    <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-black text-slate-900 italic tracking-tighter">{kpiData.pendingSurveys}</h4>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-amber-600" />
                      </div>
                    </div>
                  </div>

                  <div className="group/mini p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-xl transition-all duration-500">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Efficiency</p>
                    <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-black text-slate-900 italic tracking-tighter">{kpiData.completionRate}%</h4>
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-8"
        >
          <Card className="border-none rounded-[3.5rem] bg-slate-900 text-white shadow-2xl overflow-hidden relative group h-[300px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-[60px] -ml-24 -mb-24" />

            <CardContent className="p-8 relative z-10 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/10">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none mb-2">Platform Health</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    Data integrity: <span className="text-blue-400">98.4%</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${kpiData.completionRate}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                  />
                </div>
                <Button className="w-full h-12 bg-white text-slate-900 hover:bg-blue-50 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl">
                  Run Diagnostics
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 p-8 h-[320px] flex flex-col justify-between overflow-hidden">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 italic">Participation</h4>
              </div>
              <Award className="w-4 h-4 text-amber-500" />
            </div>

            <div className="relative w-full h-[140px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={radialData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius="85%"
                    outerRadius="115%"
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {radialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{kpiData.completionRate}%</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mt-1">Completion</span>
              </div>
            </div>

            <div className="w-full flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner mt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</p>
                  <p className="text-xs font-black text-slate-900">+{kpiData.completionRate}% Index</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                <span className="text-[10px] font-black text-slate-900">{kpiData.completedSurveys}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">/ Units</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
