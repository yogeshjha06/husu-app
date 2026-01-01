'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, Download, FileText, Building2, UserCircle2, Calendar, ClipboardList, ChevronRight, LayoutGrid, List, PieChart, ArrowLeft, Loader2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'

export default function ResponsesPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasMore: false })

  // Navigation State
  const [path, setPath] = useState<{ id: string; name: string; type: 'ROOT' | 'ORG' | 'FORM' }[]>([{ id: 'root', name: 'Intelligence Archive', type: 'ROOT' }])
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'LIST' | 'AGGREGATED'>('LIST')

  const currentLevel = path[path.length - 1]

  const fetchData = useCallback(async (type: string, id?: string, orgId?: string, page = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({ type, page: String(page), limit: '25' })
      if (id) params.append('id', id)
      if (orgId) params.append('org_id', orgId)

      const res = await fetch(`/api/admin/responses?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        const fetchedData = json.data

        if (type === 'ROOT') {
          setOrganizations(fetchedData.organizations || [])
        } else if (type === 'ORG') {
          setForms(fetchedData.forms || [])
        } else if (type === 'FORM') {
          if (isLoadMore) {
            setResponses(prev => [...prev, ...(fetchedData.responses || [])])
          } else {
            setResponses(fetchedData.responses || [])
          }
          setPagination({
            total: fetchedData.pagination.total,
            page: fetchedData.pagination.page,
            hasMore: fetchedData.pagination.hasMore
          })
        }
      } else {
        toast.error('Failed to access encrypted data node')
      }
    } catch (e) {
      console.error('Fetch error:', e)
      toast.error('Connection to Archive interrupted')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    // Initial load
    fetchData('ROOT')
  }, [fetchData])

  const navigateTo = (id: string, name: string, type: 'ORG' | 'FORM') => {
    const newPath = [...path, { id, name, type }]
    setPath(newPath)

    // Trigger fetch for the new level
    const orgId = type === 'FORM' ? path.find(p => p.type === 'ORG')?.id : undefined
    fetchData(type, id, orgId)
    setSearchTerm('')
  }

  const navigateBack = () => {
    if (path.length > 1) {
      const newPath = path.slice(0, -1)
      const last = newPath[newPath.length - 1]
      setPath(newPath)

      // If we went back to ORG, we don't necessarily NEED to refetch if we keep state, 
      // but let's refetch to be safe/fresh.
      const orgId = last.type === 'FORM' ? newPath.find(p => p.type === 'ORG')?.id : undefined
      fetchData(last.id === 'root' ? 'ROOT' : last.type, last.id === 'root' ? undefined : last.id, orgId)
      setSearchTerm('')
    }
  }

  const handleLoadMore = () => {
    const orgId = path.find(p => p.type === 'ORG')?.id
    fetchData('FORM', currentLevel.id, orgId, pagination.page + 1, true)
  }

  const toHex = (str: string) => {
    if (!str) return 'HASH_UNKNOWN'
    return Array.from(str)
      .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 12)
      .toUpperCase()
  }

  const getQuestion = (qId: string, questions: any[]) => {
    if (!qId || !questions) return null
    const strId = String(qId)
    return questions.find(q => String(q.id || q._id) === strId)
  }

  // Content Filtering Logic (Client-side search within the current loaded level)
  const getDisplayContent = () => {
    const term = searchTerm.toLowerCase()
    if (currentLevel.type === 'ROOT') {
      return organizations.filter(o => (o.name || '').toLowerCase().includes(term))
    }
    if (currentLevel.type === 'ORG') {
      return forms.filter(f => (f.title || f.name || '').toLowerCase().includes(term))
    }
    if (currentLevel.type === 'FORM') {
      return responses.filter(r =>
        (r.user_email || '').toLowerCase().includes(term) ||
        toHex(r.user_email).toLowerCase().includes(term)
      )
    }
    return []
  }

  const items = getDisplayContent()

  // Aggregated View Logic
  const getAggregatedData = () => {
    if (currentLevel.type !== 'FORM' || responses.length === 0) return []

    // Use the questions from the first response as a template for ordering
    const formQuestions = responses[0].questions || []

    return formQuestions.map((q: any) => {
      const answers = responses
        .filter(r => r.status === 'SUBMITTED')
        .map(r => r.answers.find((a: any) => String(a.question_id) === String(q.id || q._id))?.answer)

      const distribution: Record<string, number> = {}
      let totalResponded = 0

      answers.forEach(a => {
        if (a === undefined || a === null || a === '') return
        totalResponded++
        if (Array.isArray(a)) {
          a.forEach(val => {
            const key = String(val)
            distribution[key] = (distribution[key] || 0) + 1
          })
        } else {
          const key = String(a)
          distribution[key] = (distribution[key] || 0) + 1
        }
      })

      return {
        question: q.question_text,
        type: q.type || 'SUBJECTIVE',
        total: totalResponded,
        options: q.options || [],
        allAnswers: answers.filter(a => a !== undefined && a !== null && a !== ''), // Raw answers for subjective
        distribution: Object.entries(distribution).map(([val, count]) => ({
          label: val,
          count,
          percent: totalResponded > 0 ? Math.round((count / totalResponded) * 100) : 0
        })).sort((a, b) => b.count - a.count)
      }
    }).filter((q: any) => (q.distribution.length > 0 || q.allAnswers.length > 0)) // Show if any data exists
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
            {path.length > 1 && (
              <Button variant="ghost" size="icon" onClick={navigateBack} className="hover:bg-slate-200 rounded-xl">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            )}
            Archive Explorer
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

        {currentLevel.type === 'FORM' && (
          <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-[300px]">
            <TabsList className="grid grid-cols-2 rounded-xl bg-slate-200 p-1">
              <TabsTrigger value="LIST" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex gap-2 font-bold text-[10px]">
                <List className="w-3 h-3" /> LIST
              </TabsTrigger>
              <TabsTrigger value="AGGREGATED" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex gap-2 font-bold text-[10px]">
                <PieChart className="w-3 h-3" /> INSIGHTS
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[2.5rem]">
        <CardHeader className="border-b bg-white p-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              placeholder={`Search in ${currentLevel.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 h-16 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-600 text-lg rounded-[1.5rem] font-medium"
            />
          </div>
        </CardHeader>
        <CardContent className="p-8 min-h-[500px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Accessing Data Nodes...</p>
            </div>
          ) : items.length === 0 && viewMode === 'LIST' ? (
            <div className="flex-1 flex flex-col items-center justify-center py-40 gap-4 opacity-40">
              <ClipboardList className="w-16 h-16 text-slate-200" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Folder is empty</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {currentLevel.type !== 'FORM' ? (
                // GRID VIEW FOR FOLDERS
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigateTo(item.id, item.name || item.title, currentLevel.type === 'ROOT' ? 'ORG' : 'FORM')}
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
                          {currentLevel.type === 'ROOT' ? 'Organization' : 'Mission Module'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // FORM VIEW
                <div className="flex-1 flex flex-col space-y-6">
                  {viewMode === 'LIST' ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50/50 border-b">
                            <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Agent Hash</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Recorded</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">View</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 uppercase">
                            {items.map((r, idx) => (
                              <tr key={r._id + idx} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-6 font-mono text-xs text-blue-600 font-bold">
                                  {toHex(r.user_email)}
                                </td>
                                <td className="px-6 py-6">
                                  <Badge className={`rounded-lg px-2 py-0.5 font-bold text-[9px] tracking-widest ${r.status === 'SUBMITTED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                    {r.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-6 font-bold text-slate-400 text-[10px]">
                                  {new Date(r.submitted_at || r.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-6 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedResponse(r)}
                                    className="h-9 w-9 p-0 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all font-black"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {pagination.hasMore && (
                        <div className="flex justify-center pt-8">
                          <Button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-lg group"
                          >
                            {loadingMore ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                            )}
                            Sync Next 25 Records
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    // AGGREGATED INSIGHTS
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {getAggregatedData().map((agg: any, idx: number) => {
                        const isSubjective = agg.type === 'SUBJECTIVE' || agg.type === 'TEXT' || agg.type === 'textarea' || (agg.options?.length === 0 && agg.distribution.length > 5)

                        return (
                          <div key={idx} className="bg-slate-50 rounded-[2rem] p-8 border border-white shadow-sm flex flex-col min-h-[400px]">
                            <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight mb-6 flex gap-3">
                              <span className="text-blue-600">Q{idx + 1}</span>
                              {agg.question}
                            </h4>

                            <div className="flex-1 overflow-hidden flex flex-col">
                              {isSubjective ? (
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
                                  <div className="p-4 bg-slate-900 text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] flex justify-between items-center">
                                    <span>Mission Message Feed</span>
                                    <span className="text-white">{agg.allAnswers.length} Entries</span>
                                  </div>
                                  <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-200">
                                    {agg.allAnswers.map((ans: any, aIdx: number) => (
                                      <div key={aIdx} className="flex gap-3 items-start group">
                                        <span className="text-[10px] font-black text-slate-300 group-hover:text-blue-600 transition-colors pt-1 flex-none">
                                          {String(aIdx + 1).padStart(2, '0')}.
                                        </span>
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 w-full whitespace-pre-wrap text-left">
                                          {String(ans)}
                                        </p>
                                      </div>
                                    ))}
                                    {agg.allAnswers.length === 0 && (
                                      <div className="py-12 text-center text-slate-300 italic text-[10px] uppercase font-black tracking-widest">
                                        No data recorded
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {agg.distribution.map((dist: any, i: number) => {
                                    const isImage = dist.label.includes('data:image') || dist.label.includes('http')
                                    const matchingOption = isImage ? agg.options?.find((o: any) =>
                                      String(o.url || o.image || o.image_url) === dist.label ||
                                      String(o.label || o.value || o.text) === dist.label
                                    ) : null

                                    return (
                                      <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest px-1 gap-4">
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {isImage ? (
                                              <>
                                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-none border border-slate-200 bg-white">
                                                  <img src={dist.label} className="w-full h-full object-cover" alt="Selected" />
                                                </div>
                                                <span className="text-slate-500 truncate">
                                                  {matchingOption?.label || matchingOption?.value || matchingOption?.text || 'IMG_SELECT'}
                                                </span>
                                              </>
                                            ) : (
                                              <span className="text-slate-500 truncate">{dist.label}</span>
                                            )}
                                          </div>
                                          <span className="text-blue-600 flex-none">{dist.percent}%</span>
                                        </div>
                                        <div className="h-2.5 bg-white rounded-full overflow-hidden border border-slate-200 p-0.5">
                                          <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${dist.percent}%` }}
                                          />
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center opacity-50">
                              <p className="font-black text-[8px] uppercase tracking-[0.3em] text-slate-400">Total Samples: {agg.total}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Briefing Modal */}
      <Dialog open={!!selectedResponse} onOpenChange={(open) => !open && setSelectedResponse(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none shadow-2xl">
          {selectedResponse && (
            <>
              <div className="bg-slate-900 p-8 text-white sticky top-0 z-10">
                <DialogHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                        Intelligence Briefing
                      </DialogTitle>
                      <DialogDescription className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                        ID: {selectedResponse._id}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-white/10 uppercase tracking-widest text-[9px] font-black">
                  <div className="space-y-1">
                    <p className="text-slate-500">Agent Hash</p>
                    <p className="text-blue-400 font-mono text-sm">{toHex(selectedResponse.user_email)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500">Time Record</p>
                    <p className="text-white text-sm">
                      {new Date(selectedResponse.submitted_at || selectedResponse.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8 bg-white">
                <div className="space-y-8">
                  {(selectedResponse.questions || []).map((q: any, idx: number) => {
                    const ansObj = selectedResponse.answers.find((a: any) => String(a.question_id) === String(q.id || q._id))
                    const answer = ansObj?.answer
                    const options = q.options || []
                    const isSubjective = ['TEXT', 'SUBJECTIVE', 'textarea', 'TEXTAREA'].includes(q.type) || options.length === 0

                    return (
                      <div key={idx} className="group">
                        <div className="flex gap-4">
                          <div className="flex-none w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                            {idx + 1}
                          </div>
                          <div className="space-y-4 flex-1 pt-1">
                            <h4 className="text-xs font-black uppercase tracking-tight text-slate-500 leading-tight">
                              {q.question_text}
                            </h4>

                            {/* Render Mode Logic: MCQ Grid vs Subjective Block */}
                            {!isSubjective && options.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {options.map((opt: any, oIdx: number) => {
                                  const optLabel = String(typeof opt === 'string' ? opt : (opt.label || opt.value || opt.text || `Option ${oIdx + 1}`));
                                  const isSelected = Array.isArray(answer)
                                    ? answer.includes(optLabel)
                                    : String(answer) === optLabel

                                  return (
                                    <div
                                      key={oIdx}
                                      className={`p-4 rounded-2xl border transition-all ${isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-white' : 'border-slate-300'}`}>
                                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <div className="flex flex-col gap-2 w-full">
                                          {(opt.url || opt.image || opt.image_url) ? (
                                            <img
                                              src={opt.url || opt.image || opt.image_url}
                                              className={`rounded-lg object-contain max-h-32 w-full bg-white/10 ${isSelected ? '' : 'grayscale'}`}
                                              alt="Option"
                                            />
                                          ) : (
                                            <p className="text-xs font-bold leading-tight">{optLabel}</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                {answer && String(answer).startsWith('data:image') ? (
                                  <img src={String(answer)} className="rounded-xl max-h-64 object-contain shadow-sm" alt="Subjective Image" />
                                ) : (
                                  <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap text-left">
                                    {answer || (<span className="text-slate-300 italic">No response recorded</span>)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 sticky bottom-0 z-10">
                <Button
                  variant="outline"
                  onClick={() => setSelectedResponse(null)}
                  className="rounded-xl font-black uppercase tracking-widest text-[10px] px-6 h-10 border-slate-200"
                >
                  Close Briefing
                </Button>
                <Button
                  className="rounded-xl font-black uppercase tracking-widest text-[10px] px-6 h-10 bg-slate-900 hover:bg-black text-white"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print Record
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
