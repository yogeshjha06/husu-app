'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { motion } from 'framer-motion'
import {
    BarChart3,
    TrendingUp,
    Trophy,
    Target,
    Activity,
    Calendar,
    CheckCircle2,
    Sparkles,
    Globe,
    ShieldCheck,
    Flag,
    ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ScorecardItem {
    id: string
    title: string
    value?: string
    percentage?: number
    date?: string
    achievements?: string[]
    type?: string
}

interface AnalyticsData {
    kpis: ScorecardItem[]
    benchmarks: ScorecardItem[]
    milestones: ScorecardItem[]
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/org-admin/analytics')
                if (res.ok) {
                    const json = await res.json()
                    setData(json.data)
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchAnalytics()
    }, [])

    const SectionHeader = ({ icon: Icon, title, subtitle, color }: any) => (
        <div className="flex items-center gap-4 mb-8">
            <div className={cn("p-4 rounded-2xl bg-opacity-10 flex items-center justify-center border border-current border-opacity-20 shadow-lg shadow-current/5", color)}>
                <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
            </div>
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic italic-none leading-none mb-1">{title}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{subtitle}</p>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="p-8 space-y-8 animate-pulse bg-slate-50 min-h-screen">
                <div className="h-12 w-48 bg-slate-200 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-64 bg-slate-200 rounded-[2.5rem]" />
                    <div className="h-64 bg-slate-200 rounded-[2.5rem]" />
                </div>
            </div>
        )
    }

    const hasData = data && (data.kpis?.length > 0 || data.benchmarks?.length > 0 || data.milestones?.length > 0);

    return (
        <div className="p-8 space-y-12 bg-slate-50 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="px-3 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-purple-600">Live Insights</span>
                    </div>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Performance Scorecard</h1>
                <p className="text-slate-500 text-lg font-medium max-w-2xl">
                    Real-time analysis of your organization's key performance indicators, strategic benchmarks, and milestone progression.
                </p>
            </motion.div>

            {!hasData && (
                <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No Analytics Data Yet</h3>
                    <p className="text-slate-500 mt-2">Your dedicated account manager is currently preparing your scorecard.</p>
                </div>
            )}

            {hasData && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column: KPIs & Benchmarks */}
                    <div className="xl:col-span-2 space-y-12">

                        {/* KPIs */}
                        {data?.kpis?.length > 0 && (
                            <section>
                                <SectionHeader
                                    icon={TrendingUp}
                                    title="Key Performance Indicators"
                                    subtitle="Operational Success Metrics"
                                    color="bg-blue-600"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {data.kpis.map((kpi) => (
                                        <Card key={kpi.id} className="border-none rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                                            <CardContent className="p-8">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{kpi.title}</span>
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                                                        <Activity className="w-4 h-4" />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-end justify-between">
                                                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{kpi.value}</h3>
                                                        {kpi.percentage !== undefined && (
                                                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-1">
                                                                {kpi.percentage}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    {kpi.percentage !== undefined && (
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${kpi.percentage}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className="h-full bg-blue-600"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Benchmarks */}
                        {data?.benchmarks?.length > 0 && (
                            <section>
                                <SectionHeader
                                    icon={Target}
                                    title="Strategic Benchmarks"
                                    subtitle="Industry Standard Indexing"
                                    color="bg-purple-600"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {data.benchmarks.map((bm) => (
                                        <Card key={bm.id} className="border-none rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                                            <CardContent className="p-8">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{bm.title}</span>
                                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-full">
                                                        <Target className="w-4 h-4" />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-end justify-between">
                                                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{bm.value}</h3>
                                                    </div>
                                                    {bm.percentage !== undefined && (
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${bm.percentage}%` }}
                                                                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                                                className="h-full bg-purple-600"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column: Milestones Timeline */}
                    <div className="xl:col-span-1">
                        {data?.milestones?.length > 0 && (
                            <section className="h-full">
                                <SectionHeader
                                    icon={Flag}
                                    title="Success Roadmap"
                                    subtitle="Key Event Timeline"
                                    color="bg-green-600"
                                />
                                <div className="space-y-6 relative pl-4 border-l-2 border-slate-200 ml-4 pb-12">
                                    {data.milestones.sort((a, b) => (a.date || '') > (b.date || '') ? 1 : -1).map((ms, idx) => (
                                        <div key={ms.id} className="relative pl-8">
                                            {/* Timeline Dot */}
                                            <div className={cn(
                                                "absolute -left-[25px] top-0 w-8 h-8 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm z-10",
                                                ms.type === 'EVENT' ? "bg-amber-100 text-amber-600" : "bg-green-600 text-white"
                                            )}>
                                                {ms.type === 'EVENT' ? <Sparkles className="w-3 h-3" /> : <CheckCircle2 className="w-4 h-4" />}
                                            </div>

                                            <Card className="border-none rounded-[1.5rem] bg-white shadow-lg shadow-slate-200/50 overflow-hidden hover:shadow-xl transition-all">
                                                <div className={cn("h-1.5 w-full", ms.type === 'EVENT' ? 'bg-amber-400' : 'bg-green-500')} />
                                                <CardContent className="p-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                        <Calendar className="w-3 h-3" />
                                                        {ms.date ? format(new Date(ms.date), 'MMM d, yyyy') : 'TBD'}
                                                        {ms.type && <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{ms.type}</span>}
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{ms.title}</h3>

                                                    {ms.achievements && ms.achievements.length > 0 && (
                                                        <div className="space-y-2 pt-3 border-t border-slate-50">
                                                            {ms.achievements.map((acc, i) => (
                                                                <div key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                                                                    <span>{acc}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            )}

            {/* Compliance Footer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Globe className="w-6 h-6" /></div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Global Compliance</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Standard Sync Active</p>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Your organization is automatically benchmarked against 14 international sustainability standards including GRI, SASB, and TCFD frameworks.
                    </p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Data Integrity</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Verification: 99.8%</p>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        All analytical outputs are verified through HUSU's proprietary multi-stage validation engine, ensuring audit-ready reporting.
                    </p>
                </div>
            </div>
        </div>
    )
}
