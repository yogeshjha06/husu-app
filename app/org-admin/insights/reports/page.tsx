'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import {
    FileText,
    Download,
    Eye,
    Calendar,
    Filter,
    Search,
    ChevronRight,
    FileCheck,
    Clock,
    X,
    Shield,
    PieChart as PieIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { generateStrategicReport } from '@/lib/utils/pdf-generator'

interface ReportBlock {
    id: string
    type: string
    content: any
}

interface Report {
    _id: string
    title: string
    header?: string
    footer?: string
    blocks: ReportBlock[]
    created_at: string
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await fetch('/api/org-admin/reports')
                if (res.ok) {
                    const json = await res.json()
                    setReports(json.data)
                }
            } catch (error) {
                console.error('Failed to fetch reports:', error)
                toast.error('Failed to synchronise report database')
            } finally {
                setLoading(false)
            }
        }
        fetchReports()
    }, [])

    const filteredReports = reports.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase())
    )

    const handleDownload = async (report: Report) => {
        toast.promise(generateStrategicReport(report), {
            loading: 'Generating encrypted mission record...',
            success: 'Strategic Document Archived Successfully.',
            error: 'Failed to generate mission record.'
        })
    }

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center gap-2">
                            <Shield className="w-3 h-3 text-blue-600" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Strategic Intelligence Hub</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mission Records Ready</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Organizational Reports</h1>
                    <p className="text-slate-500 text-lg font-medium italic">Secure vault containing high-fidelity records and mission-critical intelligence.</p>
                </div>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search archives by title..."
                        className="h-14 pl-12 rounded-2xl border-none shadow-sm shadow-slate-200 bg-white font-medium italic text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-white rounded-[2rem] animate-pulse shadow-sm" />
                    ))}
                </div>
            ) : filteredReports.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredReports.map((report, index) => (
                        <motion.div
                            key={report._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="border-none rounded-[2rem] bg-white hover:shadow-2xl transition-all duration-300 group overflow-hidden shadow-sm shadow-slate-200 border-l-4 border-l-transparent hover:border-l-blue-600">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row items-center p-6 md:p-8 gap-6">
                                        <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0 shadow-lg">
                                            <FileText className="w-8 h-8 text-white" />
                                        </div>

                                        <div className="flex-1 space-y-2 text-center md:text-left">
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{new Date(report.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Classification: Strategic</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors uppercase italic leading-none">{report.title}</h3>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Mission Briefing Record • {report.blocks.length} Intelligence Modules</p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <Button
                                                variant="outline"
                                                onClick={() => setSelectedReport(report)}
                                                className="h-12 px-6 rounded-xl border-slate-100 hover:bg-slate-50 font-black uppercase tracking-widest text-[9px] italic"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Review
                                            </Button>
                                            <Button
                                                onClick={() => handleDownload(report)}
                                                className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-blue-600 hover:shadow-blue-600/30 transition-all flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download PDF
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] p-24 text-center border-2 border-dashed border-slate-200 shadow-inner">
                    <FileText className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Vault is Empty</h3>
                    <p className="text-slate-500 font-medium italic max-w-md mx-auto">
                        {search ? "No mission records match your current search query." : "Generated strategic reports will be archived here for secure access and download."}
                    </p>
                </div>
            )}

            {/* PREVIEW MODAL */}
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl bg-white">
                    {selectedReport && (
                        <div className="flex flex-col">
                            <div className="bg-slate-900 p-8 text-white flex justify-between items-center sticky top-0 z-50">
                                <div className="space-y-1">
                                    <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Strategic Review</DialogTitle>
                                    <p className="text-blue-400 font-bold text-[10px] uppercase tracking-widest">{selectedReport.title}</p>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        onClick={() => handleDownload(selectedReport)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-8 font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Download PDF
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedReport(null)}
                                        className="text-white hover:bg-white/10 rounded-xl px-4"
                                    >
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-12 space-y-12 bg-white">
                                <div className="border-b-2 border-slate-900 pb-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">{selectedReport.header || 'CLASSIFIED MISSION RECORD'}</p>
                                </div>

                                <div className="space-y-12 pb-12">
                                    {selectedReport.blocks.map((block) => (
                                        <div key={block.id}>
                                            {block.type === 'HEADING' && <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">{block.content}</h2>}
                                            {block.type === 'SUBHEADING' && <h3 className="text-xl font-black text-blue-600 uppercase tracking-tight">{block.content}</h3>}
                                            {block.type === 'TEXT' && <p className="text-base font-medium text-slate-600 leading-relaxed whitespace-pre-wrap text-left underline-offset-4 decoration-blue-100">{block.content}</p>}
                                            {block.type === 'IMAGE' && (
                                                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-slate-50">
                                                    <img src={block.content} className="w-full h-auto object-cover" alt="Mission Imagery" />
                                                </div>
                                            )}
                                            {block.type === 'CHART' && (
                                                <div className="p-10 bg-slate-900 rounded-[2.5rem] shadow-2xl space-y-8 overflow-hidden relative">
                                                    <div className="absolute top-0 right-0 p-6 opacity-5">
                                                        <PieIcon className="w-24 h-24 text-white" />
                                                    </div>

                                                    <p className="text-blue-400 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 relative z-10">
                                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                                        Strategic Metrics Visualization
                                                    </p>

                                                    <div className="relative z-10 flex flex-col gap-8">
                                                        {/* Horizontal Bars */}
                                                        {(block.content.chartType === 'horizontal' || !block.content.chartType) && (
                                                            <div className="space-y-6">
                                                                <div className="h-6 bg-white/5 rounded-full overflow-hidden flex gap-0.5 p-1">
                                                                    {(block.content.values || []).map((v: number, i: number) => {
                                                                        const total = block.content.values.reduce((a: number, b: number) => a + b, 0) || 1
                                                                        const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500']
                                                                        return (
                                                                            <div key={i} className={`h-full ${colors[i % colors.length]} rounded-full shadow-lg shadow-blue-500/20`} style={{ width: `${(v / total) * 100}%` }} />
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Vertical Bars */}
                                                        {block.content.chartType === 'vertical' && (
                                                            <div className="h-64 flex items-end justify-around gap-6 px-4 border-b border-white/5 pb-8">
                                                                {(block.content.values || []).map((v: number, i: number) => {
                                                                    const max = Math.max(...block.content.values, 1)
                                                                    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500']
                                                                    return (
                                                                        <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-3 group/vbar">
                                                                            <div className="text-sm font-black text-blue-400 mb-2">{v}%</div>
                                                                            <div
                                                                                className={`w-16 ${colors[i % colors.length]} rounded-t-2xl shadow-lg shadow-blue-500/10 transition-all duration-1000 group-hover/vbar:brightness-125`}
                                                                                style={{ height: `${(v / max) * 75}%` }}
                                                                            />
                                                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{block.content.labels[i]}</span>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Pie Distribution */}
                                                        {block.content.chartType === 'pie' && (
                                                            <div className="flex justify-center py-4">
                                                                <div className="w-48 h-48 rounded-full shadow-2xl border-8 border-white/5"
                                                                    style={{
                                                                        background: `conic-gradient(${block.content.values.map((v: number, i: number) => {
                                                                            const total = block.content.values.reduce((a: any, b: any) => a + b, 0) || 1
                                                                            const prevTotal = block.content.values.slice(0, i).reduce((a: any, b: any) => a + b, 0)
                                                                            const start = (prevTotal / total) * 100
                                                                            const end = ((prevTotal + v) / total) * 100
                                                                            const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef']
                                                                            return `${colors[i % colors.length]} ${start}% ${end}%`
                                                                        }).join(', ')
                                                                            })`
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Trend Line */}
                                                        {block.content.chartType === 'line' && (
                                                            <div className="w-full h-48 relative px-10 py-6">
                                                                <svg className="w-full h-full overflow-visible">
                                                                    <path
                                                                        d={`M ${block.content.values.map((v: number, i: number) => {
                                                                            const x = (i / (Math.max(block.content.values.length - 1, 1))) * 600
                                                                            const y = 80 - (v / Math.max(...block.content.values, 1)) * 60
                                                                            return `${x} ${y}`
                                                                        }).join(' L ')}`}
                                                                        fill="none"
                                                                        stroke="#3b82f6"
                                                                        strokeWidth="4"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                    />
                                                                    {block.content.values.map((v: number, i: number) => {
                                                                        const x = (i / (Math.max(block.content.values.length - 1, 1))) * 600
                                                                        const y = 80 - (v / Math.max(...block.content.values, 1)) * 60
                                                                        const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef']
                                                                        return (
                                                                            <circle key={i} cx={x} cy={y} r="6" fill={colors[i % colors.length]} />
                                                                        )
                                                                    })}
                                                                </svg>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-white/5">
                                                            {(block.content.labels || []).map((l: string, i: number) => (
                                                                <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                                                    <div className={`w-3 h-3 rounded-full ${['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500'][i % 5]}`} />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">{l}</span>
                                                                        <span className="text-lg font-black text-white leading-none italic">{block.content.values[i]}%</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {block.type === 'INFOGRAPHIC' && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4 hover:bg-blue-50 transition-all hover:scale-105 group/info">
                                                            <p className="text-blue-600 font-black text-4xl tracking-tighter italic group-hover/info:scale-110 transition-transform origin-left">0{i}</p>
                                                            <div className="space-y-1 text-left">
                                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mission Insight</p>
                                                                <p className="text-sm font-bold text-slate-800 leading-snug italic">High-impact strategic mission analysis recorded in this intelligence segment.</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t-2 border-slate-100 pt-8 mt-12">
                                    <p className="text-[10px] font-bold text-slate-400 italic tracking-widest">{selectedReport.footer || '© 2026 HUSU Intelligence Archive'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
