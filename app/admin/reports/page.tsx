'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useCallback } from 'react'
import {
  Search, FileText, Building2, ChevronRight, ArrowLeft,
  Plus, Layout, Type, Image as ImageIcon, PieChart,
  Save, Trash2, X, MoveUp, MoveDown, Download, Eye,
  Settings2, AlignLeft, Bold, Italic, Heading1, Heading2
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type BlockType = 'HEADING' | 'SUBHEADING' | 'TEXT' | 'IMAGE' | 'CHART' | 'INFOGRAPHIC'

interface ReportBlock {
  id: string
  type: BlockType
  content: any
}

interface Report {
  id?: string
  title: string
  org_id: string
  header?: string
  footer?: string
  blocks: ReportBlock[]
}

export default function ReportsPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [path, setPath] = useState<{ id: string; name: string; type: 'ROOT' | 'ORG' }[]>([{ id: 'root', name: 'Intelligence Reports', type: 'ROOT' }])

  // Editor State
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  const currentLevel = path[path.length - 1]

  const fetchData = useCallback(async (type: string, id?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type })
      if (id) params.append('id', id)

      const res = await fetch(`/api/admin/reports?${params.toString()}`)
      const json = await res.json()

      if (type === 'ROOT') setOrganizations(json.data.organizations)
      else if (type === 'ORG') setReports(json.data.reports)
    } catch (e) {
      toast.error('Failed to connect to Intelligence Servers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData('ROOT')
  }, [fetchData])

  const navigateTo = (id: string, name: string, type: 'ORG') => {
    const newPath = [...path, { id, name, type }]
    setPath(newPath)
    fetchData(type, id)
    setSearchTerm('')
  }

  const navigateBack = () => {
    if (path.length > 1) {
      const newPath = path.slice(0, -1)
      setPath(newPath)
      fetchData(newPath[newPath.length - 1].type, newPath[newPath.length - 1].id === 'root' ? undefined : newPath[newPath.length - 1].id)
      setSearchTerm('')
    }
  }

  // --- REPORT BUILDER LOGIC ---

  const createNewReport = () => {
    const newReport: Report = {
      title: 'New Mission Report',
      org_id: currentLevel.id,
      header: 'Intelligence Division - Classified',
      footer: '© 2026 HUSU Intelligence Archive',
      blocks: [
        { id: Math.random().toString(36), type: 'HEADING', content: 'REPORT OBJECTIVE' },
        { id: Math.random().toString(36), type: 'TEXT', content: 'Enter briefing details here...' }
      ]
    }
    setSelectedReport(newReport)
    setIsEditing(true)
  }

  const addBlock = (type: BlockType) => {
    if (!selectedReport) return
    const newBlock: ReportBlock = {
      id: Math.random().toString(36),
      type,
      content: type === 'CHART' ? {
        chartType: 'horizontal',
        labels: ['Target A', 'Target B', 'Target C'],
        values: [40, 30, 30]
      } : 'New block content'
    }
    setSelectedReport({ ...selectedReport, blocks: [...selectedReport.blocks, newBlock] })
  }

  const updateBlock = (blockId: string, content: any) => {
    if (!selectedReport) return
    const newBlocks = selectedReport.blocks.map(b => b.id === blockId ? { ...b, content } : b)
    setSelectedReport({ ...selectedReport, blocks: newBlocks })
  }

  const moveBlock = (index: number, direction: 'UP' | 'DOWN') => {
    if (!selectedReport) return
    const newBlocks = [...selectedReport.blocks]
    const target = direction === 'UP' ? index - 1 : index + 1
    if (target < 0 || target >= newBlocks.length) return
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]]
    setSelectedReport({ ...selectedReport, blocks: newBlocks })
  }

  const deleteBlock = (blockId: string) => {
    if (!selectedReport) return
    setSelectedReport({ ...selectedReport, blocks: selectedReport.blocks.filter(b => b.id !== blockId) })
  }

  const saveReport = async () => {
    if (!selectedReport) return
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedReport)
      })
      if (res.ok) {
        toast.success('Report encrypted and archived.')
        setIsEditing(false)
        fetchData('ORG', currentLevel.id)
      }
    } catch (e) {
      toast.error('Archival sequence failed.')
    }
  }

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return

    try {
      const res = await fetch(`/api/admin/reports?id=${reportToDelete}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Report purged from database.')
        fetchData('ORG', currentLevel.id)
      }
    } catch (e) {
      toast.error('Failed to purge report.')
    } finally {
      setReportToDelete(null)
    }
  }

  const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setReportToDelete(id)
  }

  const filteredItems = currentLevel.type === 'ROOT'
    ? organizations.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : reports.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
            {path.length > 1 && (
              <Button variant="ghost" size="icon" onClick={navigateBack} className="hover:bg-slate-200 rounded-xl">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            )}
            Reports Archive
          </h1>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest pl-2">
            {path.map((p, i) => (
              <div key={p.id + i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                <span className={i === path.length - 1 ? "text-blue-600" : ""}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {currentLevel.type === 'ORG' && (
          <Button
            onClick={createNewReport}
            className="rounded-[1.2rem] bg-slate-900 hover:bg-black text-white px-8 h-12 flex gap-2 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Initialize New Report
          </Button>
        )}
      </div>

      {!isEditing ? (
        <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="border-b bg-white p-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input
                placeholder={`Search reports in ${currentLevel.name}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-16 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-600 text-lg rounded-[1.5rem] font-medium"
              />
            </div>
          </CardHeader>
          <CardContent className="p-8 min-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Synchronizing Archives...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-40">
                <FileText className="w-16 h-16 text-slate-200" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No entries found</p>
              </div>
            ) : (
              <div className="relative min-h-[400px]">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      draggable={currentLevel.type === 'ORG'}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('reportId', item.id)
                        const dragImg = new Image()
                        dragImg.src = '/folder.svg'
                        e.dataTransfer.setDragImage(dragImg, 50, 50)
                        setIsDragging(true)
                      }}
                      onDragEnd={() => setIsDragging(false)}
                      onClick={() => currentLevel.type === 'ROOT' ? navigateTo(item.id, item.name, 'ORG') : setSelectedReport(item)}
                      className="group cursor-pointer flex flex-col items-center gap-4 transition-all hover:scale-105"
                    >
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <img src="/folder.svg" alt="Folder" className="w-full h-full drop-shadow-md group-hover:drop-shadow-xl transition-all" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[20%] w-10 h-10 rounded-full bg-white/90 shadow-inner flex items-center justify-center overflow-hidden border border-slate-100">
                          {item.logo_url ? (
                            <img src={item.logo_url} className="w-full h-full object-contain p-1" />
                          ) : (
                            currentLevel.type === 'ROOT' ? <Building2 className="w-5 h-5 text-slate-400" /> : <FileText className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-black text-slate-800 text-[11px] uppercase tracking-tight leading-none group-hover:text-blue-600 transition-colors truncate w-32 px-2">
                          {item.name || item.title}
                        </p>
                        <p className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">
                          {currentLevel.type === 'ROOT' ? 'Organization' : 'Mission Briefing'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recycle Bin Drop Zone */}
                {currentLevel.type === 'ORG' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('scale-125', 'brightness-125')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('scale-125', 'brightness-125')
                    }}
                    onDrop={async (e) => {
                      e.preventDefault()
                      setIsDragging(false)
                      e.currentTarget.classList.remove('scale-125', 'brightness-125')
                      const reportId = e.dataTransfer.getData('reportId')
                      if (reportId) {
                        setReportToDelete(reportId)
                      }
                    }}
                    className={`fixed bottom-12 right-12 w-20 h-20 cursor-pointer transition-all duration-300 group z-[100] ${isDragging ? 'opacity-100 scale-110' : 'opacity-10 pointer-events-none'}`}
                  >
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-full tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all shadow-xl whitespace-nowrap">
                      Emergency Purge
                    </div>
                    <img
                      src="/bin.png"
                      alt="Recycle Bin"
                      className="w-full h-full object-contain drop-shadow-2xl brightness-90 group-hover:brightness-110"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* --- DYNAMIC REPORT EDITOR --- */
        <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* EDITOR PANEL */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div className="space-y-2">
                  <Input
                    value={selectedReport?.title}
                    onChange={e => setSelectedReport({ ...selectedReport!, title: e.target.value })}
                    className="bg-transparent border-none text-2xl font-black uppercase tracking-tighter p-0 h-auto focus-visible:ring-0 placeholder:text-white/20"
                    placeholder="REPORT TITLE"
                  />
                  <p className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.3em]">SECURE MISSION INTEL</p>
                </div>
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-white hover:bg-white/10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                  <Button onClick={saveReport} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">Encrypt & Save</Button>
                </div>
              </div>

              <div className="p-12 space-y-12 min-h-[800px]">
                {/* REPORT HEADER */}
                <div className="border-b-2 border-slate-900 pb-4">
                  <Input
                    value={selectedReport?.header}
                    onChange={e => setSelectedReport({ ...selectedReport!, header: e.target.value })}
                    className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 bg-transparent border-none p-0 focus-visible:ring-0"
                  />
                </div>

                {/* DYNAMIC BLOCKS */}
                <div className="space-y-12">
                  {selectedReport?.blocks.map((block, idx) => (
                    <div key={block.id} className="relative group/block animate-in fade-in slide-in-from-left-2 duration-300">
                      {/* Block Controls */}
                      <div className="absolute -left-12 top-0 flex flex-col gap-1 opacity-0 group-hover/block:opacity-100 transition-all scale-90">
                        <Button size="icon" variant="ghost" onClick={() => moveBlock(idx, 'UP')} className="h-8 w-8 rounded-lg hover:bg-slate-200"><MoveUp className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => moveBlock(idx, 'DOWN')} className="h-8 w-8 rounded-lg hover:bg-slate-200"><MoveDown className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteBlock(block.id)} className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      </div>

                      {/* Content Renderers */}
                      {block.type === 'HEADING' && (
                        <Input
                          value={block.content}
                          onChange={e => updateBlock(block.id, e.target.value)}
                          className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter border-none bg-transparent p-0 focus-visible:ring-0"
                        />
                      )}

                      {block.type === 'SUBHEADING' && (
                        <Input
                          value={block.content}
                          onChange={e => updateBlock(block.id, e.target.value)}
                          className="text-xl font-black text-blue-600 uppercase tracking-tight border-none bg-transparent p-0 focus-visible:ring-0"
                        />
                      )}

                      {block.type === 'TEXT' && (
                        <textarea
                          value={block.content}
                          onChange={e => updateBlock(block.id, e.target.value)}
                          className="w-full text-base font-medium text-slate-600 leading-relaxed border-none bg-transparent p-0 focus-visible:ring-0 min-h-[100px] resize-none"
                        />
                      )}

                      {block.type === 'IMAGE' && (
                        <div className="space-y-4">
                          <div className="w-full h-[400px] bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group/img">
                            {block.content.startsWith('http') || block.content.startsWith('data:') ? (
                              <img src={block.content} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center p-8">
                                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Drag imagery here or paste URL</p>
                              </div>
                            )}
                            <Input
                              placeholder="Paste Image URL..."
                              onChange={e => updateBlock(block.id, e.target.value)}
                              className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] opacity-0 group-hover/img:opacity-100 transition-all rounded-xl border-none shadow-2xl h-12 bg-white/90 backdrop-blur-md"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'CHART' && (
                        <div className="p-10 bg-slate-900 rounded-[2.5rem] space-y-8 animate-in zoom-in-95 duration-500">
                          <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                              <PieChart className="w-4 h-4" /> Intelligence Visualization Architype
                            </p>
                            <div className="flex bg-white/5 p-1 rounded-xl">
                              {['horizontal', 'vertical', 'pie', 'line'].map((t) => (
                                <Button
                                  key={t}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateBlock(block.id, { ...block.content, chartType: t })}
                                  className={`h-8 px-4 rounded-lg text-[8px] font-black uppercase tracking-widest ${block.content.chartType === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                  {t}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Chart UI Renderers */}
                          <div className="min-h-[200px] flex items-center justify-center py-6">
                            {(block.content.chartType === 'horizontal' || !block.content.chartType) && (
                              <div className="w-full space-y-4">
                                <div className="h-6 bg-white/5 rounded-full overflow-hidden flex gap-0.5 p-1">
                                  {block.content.values.map((v: number, i: number) => {
                                    const total = block.content.values.reduce((a: any, b: any) => a + b, 0)
                                    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500']
                                    return (
                                      <div key={i} className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: `${(v / total) * 100}%` }} />
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {block.content.chartType === 'vertical' && (
                              <div className="w-full h-64 flex items-end justify-around gap-4 px-10 border-b border-white/5 pb-4">
                                {block.content.values.map((v: number, i: number) => {
                                  const max = Math.max(...block.content.values, 1)
                                  const colors = ['bg-blue-400', 'bg-indigo-400', 'bg-violet-400', 'bg-purple-400', 'bg-pink-400']
                                  return (
                                    <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2 group/bar relative">
                                      <div className="text-[10px] font-black text-blue-400 mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity">{v}%</div>
                                      <div
                                        className={`w-12 ${colors[i % colors.length]} rounded-t-xl transition-all duration-1000 shadow-lg shadow-blue-500/20`}
                                        style={{ height: `${(v / max) * 80}%` }}
                                      />
                                      <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter mt-2">{block.content.labels[i]}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {block.content.chartType === 'pie' && (
                              <div
                                className="relative w-48 h-48 rounded-full shadow-2xl transition-all duration-700 hover:rotate-12 border-4 border-white/5"
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
                              >
                                <div className="absolute inset-10 bg-slate-900 rounded-full flex items-center justify-center shadow-inner">
                                  <PieChart className="w-8 h-8 text-blue-600/40" />
                                </div>
                              </div>
                            )}

                            {block.content.chartType === 'line' && (
                              <div className="w-full h-40 relative px-10">
                                <svg className="w-full h-full overflow-visible">
                                  <path
                                    d={`M ${block.content.values.map((v: number, i: number) => {
                                      const x = (i / (Math.max(block.content.values.length - 1, 1))) * 400
                                      const y = 80 - (v / Math.max(...block.content.values, 1)) * 60
                                      return `${x} ${y}`
                                    }).join(' L ')}`}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-all duration-700"
                                  />
                                  {block.content.values.map((v: number, i: number) => {
                                    const x = (i / (Math.max(block.content.values.length - 1, 1))) * 400
                                    const y = 80 - (v / Math.max(...block.content.values, 1)) * 60
                                    const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef']
                                    return (
                                      <circle key={i} cx={x} cy={y} r="6" fill={colors[i % colors.length]} />
                                    )
                                  })}
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-8 text-[10px] font-bold text-white/40 pt-6 border-t border-white/5">
                            <div className="space-y-2">
                              <span className="uppercase tracking-[0.2em]">Intel Category Labels</span>
                              <Input
                                value={block.content.labels.join(',')}
                                onChange={e => updateBlock(block.id, { ...block.content, labels: e.target.value.split(',') })}
                                className="bg-white/5 border-white/10 h-12 rounded-xl text-white focus-visible:ring-blue-600"
                              />
                            </div>
                            <div className="space-y-2">
                              <span className="uppercase tracking-[0.2em]">Metric Values (0-100)</span>
                              <Input
                                value={block.content.values.join(',')}
                                onChange={e => updateBlock(block.id, { ...block.content, values: e.target.value.split(',').map(Number) })}
                                className="bg-white/5 border-white/10 h-12 rounded-xl text-white focus-visible:ring-blue-600"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === 'INFOGRAPHIC' && (
                        <div className="grid grid-cols-3 gap-6">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-2 hover:bg-blue-50 transition-colors">
                              <p className="text-blue-600 font-black text-2xl tracking-tighter italic">0{i}</p>
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Metric Point</p>
                              <p className="text-sm font-bold text-slate-800">Advanced analysis recorded in this mission segment.</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* REPORT FOOTER */}
                <div className="border-t-2 border-slate-100 pt-8">
                  <Input
                    value={selectedReport?.footer}
                    onChange={e => setSelectedReport({ ...selectedReport!, footer: e.target.value })}
                    className="text-[9px] font-bold text-slate-400 bg-transparent border-none p-0 focus-visible:ring-0"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* SIDEBAR TOOLBOX */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 sticky top-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-8 flex items-center gap-3">
                <Settings2 className="w-4 h-4 text-blue-600" /> Elements Toolbox
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => addBlock('HEADING')}
                  variant="outline"
                  className="h-24 rounded-3xl border-slate-100 hover:border-blue-600 hover:text-blue-600 flex flex-col gap-2 group transition-all"
                >
                  <Type className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Heading</span>
                </Button>
                <Button
                  onClick={() => addBlock('SUBHEADING')}
                  variant="outline"
                  className="h-24 rounded-3xl border-slate-100 hover:border-blue-600 hover:text-blue-600 flex flex-col gap-2 group transition-all"
                >
                  <Layout className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Sub-Intel</span>
                </Button>
                <Button
                  onClick={() => addBlock('TEXT')}
                  variant="outline"
                  className="h-24 rounded-3xl border-slate-100 hover:border-blue-600 hover:text-blue-600 flex flex-col gap-2 group transition-all"
                >
                  <AlignLeft className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Briefing</span>
                </Button>
                <Button
                  onClick={() => addBlock('IMAGE')}
                  variant="outline"
                  className="h-24 rounded-3xl border-slate-100 hover:border-blue-600 hover:text-blue-600 flex flex-col gap-2 group transition-all"
                >
                  <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Imagery</span>
                </Button>
                <Button
                  onClick={() => addBlock('CHART')}
                  variant="outline"
                  className="h-24 rounded-3xl border-slate-100 hover:border-blue-600 hover:text-blue-600 flex flex-col gap-2 group transition-all"
                >
                  <PieChart className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Visualization</span>
                </Button>
                <Button
                  onClick={() => addBlock('INFOGRAPHIC')}
                  variant="outline"
                  className="h-24 rounded-3xl border-slate-100 hover:border-blue-600 hover:text-blue-600 flex flex-col gap-2 group transition-all"
                >
                  <Layout className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Infographic</span>
                </Button>
              </div>

              <div className="mt-12 pt-12 border-t border-slate-100 space-y-6">
                <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-2">
                  <p className="text-[8px] font-black uppercase text-blue-600 tracking-[0.2em]">Intelligence Note</p>
                  <p className="text-xs font-bold text-slate-900 leading-relaxed italic">"Reports are live-synced to the organization's encrypted vault. Ensure mission details are verified before archival."</p>
                </div>
                <Button className="w-full h-14 rounded-2xl bg-slate-100 text-slate-400 hover:bg-slate-200 font-black uppercase tracking-widest text-[10px] flex gap-2">
                  <Download className="w-4 h-4" /> Export Mission Record (PDF)
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* VIEW MODAL (When not editing but clicking a report) */}
      <Dialog open={!!selectedReport && !isEditing} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl bg-slate-50">
          {selectedReport && (
            <div className="space-y-0">
              <div className="bg-slate-900 p-8 text-white sticky top-0 z-50 flex justify-between items-center">
                <div>
                  <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Mission Preview</DialogTitle>
                  <p className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mt-1">{selectedReport.title}</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Edit Report</Button>
                  <Button variant="ghost" onClick={() => setSelectedReport(null)} className="text-white hover:bg-white/10 rounded-xl px-4 font-black uppercase tracking-widest text-[10px]">Close</Button>
                </div>
              </div>

              <div className="p-12 bg-white m-8 rounded-[2rem] shadow-xl space-y-12">
                <div className="border-b-2 border-slate-900 pb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">{selectedReport.header}</p>
                </div>

                <div className="space-y-12 pb-24">
                  {selectedReport.blocks.map((block) => (
                    <div key={block.id}>
                      {block.type === 'HEADING' && <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">{block.content}</h2>}
                      {block.type === 'SUBHEADING' && <h3 className="text-xl font-black text-blue-600 uppercase tracking-tight">{block.content}</h3>}
                      {block.type === 'TEXT' && <p className="text-base font-medium text-slate-600 leading-relaxed whitespace-pre-wrap text-left">{block.content}</p>}
                      {block.type === 'IMAGE' && <img src={block.content} className="w-full rounded-[2rem] shadow-xl" />}
                      {block.type === 'CHART' && (
                        <div className="p-10 bg-slate-900 rounded-[2.5rem] space-y-8 shadow-2xl overflow-hidden relative">
                          <div className="absolute top-0 right-0 p-6 opacity-10">
                            <PieChart className="w-24 h-24 text-white" />
                          </div>

                          <div className="relative z-10 flex flex-col gap-8">
                            {/* Horizontal Bars */}
                            {(block.content.chartType === 'horizontal' || !block.content.chartType) && (
                              <div className="space-y-6">
                                <div className="h-6 bg-white/5 rounded-full overflow-hidden flex gap-0.5 p-1">
                                  {block.content.values.map((v: number, i: number) => {
                                    const total = block.content.values.reduce((a: any, b: any) => a + b, 0)
                                    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500']
                                    return (
                                      <div key={i} className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: `${(v / total) * 100}%` }} />
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Vertical Bars */}
                            {block.content.chartType === 'vertical' && (
                              <div className="h-80 flex items-end justify-around gap-6 px-4 border-b border-white/5 pb-8">
                                {block.content.values.map((v: number, i: number) => {
                                  const max = Math.max(...block.content.values, 1)
                                  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500']
                                  return (
                                    <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-3 group/vbar">
                                      <div className="text-sm font-black text-blue-400 mb-2">{v}%</div>
                                      <div
                                        className={`w-20 ${colors[i % colors.length]} rounded-t-3xl shadow-2xl shadow-blue-500/20 transition-all duration-1000 group-hover/vbar:brightness-125`}
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

                            {/* Legends */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                              {(block.content.labels || []).map((l: string, i: number) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500'][i % 4]}`} />
                                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest truncate">{l}: {block.content.values[i]}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {block.type === 'INFOGRAPHIC' && (
                        <div className="grid grid-cols-3 gap-6">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-2">
                              <p className="text-blue-600 font-black text-2xl tracking-tighter italic">0{i}</p>
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-left">Insight Data</p>
                              <p className="text-xs font-bold text-slate-800 text-left">Strategic mission analysis recorded.</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* PURGE CONFIRMATION DIALOG */}
      <Dialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 border-none shadow-2xl bg-white overflow-hidden">
          <div className="bg-red-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-10 h-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Emergency Purge</DialogTitle>
            <p className="text-white/80 font-bold text-[10px] uppercase tracking-widest mt-2">Classified Data Disposal</p>
          </div>
          <div className="p-8 space-y-6 text-center">
            <p className="text-slate-600 font-medium leading-relaxed">
              "You are about to permanently purge this mission report from the HUSU Archive. This action is irreversible and will be logged in the security manifest."
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setReportToDelete(null)}
                className="flex-1 h-14 rounded-2xl border-slate-100 font-black uppercase tracking-widest text-[10px]"
              >
                Abort Purge
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20"
              >
                Confirm Disposal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
