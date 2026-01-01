'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Plus, Trash2, TrendingUp, Target, Flag, Calendar, Activity, CheckCircle2, Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ScorecardItem {
    id: string
    title: string
    value?: string
    percentage?: number
    date?: string // For milestones
    achievements?: string[] // For milestones sub-tasks
    type?: string // For milestones (Q1, EVENT etc)
}

interface ScorecardData {
    kpis: ScorecardItem[]
    benchmarks: ScorecardItem[]
    milestones: ScorecardItem[]
}

export default function ScorecardPage() {
    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrg, setSelectedOrg] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [scorecard, setScorecard] = useState<ScorecardData>({ kpis: [], benchmarks: [], milestones: [] })

    // Dropdown State
    const [openCombobox, setOpenCombobox] = useState(false)

    // Modal State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [addType, setAddType] = useState<'KPI' | 'BENCHMARK' | 'MILESTONE'>('KPI')
    const [newItem, setNewItem] = useState({
        title: '',
        value: '',
        percentage: '',
        milestoneType: 'Q1',
        date: '',
        subTaskInput: ''
    })
    const [subTasks, setSubTasks] = useState<string[]>([])

    useEffect(() => {
        fetchOrgs()
    }, [])

    useEffect(() => {
        if (selectedOrg) {
            fetchScorecard(selectedOrg)
        } else {
            setScorecard({ kpis: [], benchmarks: [], milestones: [] })
        }
    }, [selectedOrg])

    const fetchOrgs = async () => {
        try {
            const res = await fetch('/api/admin/organizations')
            if (res.ok) {
                const { data } = await res.json()
                setOrganizations(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchScorecard = async (orgId: string) => {
        try {
            const res = await fetch(`/api/admin/scorecard?orgId=${orgId}`)
            if (res.ok) {
                const { data } = await res.json()
                setScorecard(data || { kpis: [], benchmarks: [], milestones: [] })
            }
        } catch (e) {
            toast.error('Failed to load scorecard')
        }
    }

    const handleAddSubTask = () => {
        if (!newItem.subTaskInput) return
        setSubTasks([...subTasks, newItem.subTaskInput])
        setNewItem({ ...newItem, subTaskInput: '' })
    }

    const handleSaveItem = async () => {
        if (!selectedOrg) {
            toast.error('Select an organization first')
            return
        }

        const payload: any = {
            title: newItem.title,
            value: newItem.value,
        }

        if (newItem.percentage) payload.percentage = parseInt(newItem.percentage)

        if (addType === 'MILESTONE') {
            payload.type = newItem.milestoneType

            // Auto-set date for Quarters if not provided? Or just let user pick.
            // User requirement: "based on the month division it will auto set and event is special so it will be set manuly"
            // Let's simplified auto-set logic for Qs if date is empty, otherwise respect manual input.
            if (newItem.date) {
                payload.date = newItem.date
            } else if (newItem.milestoneType !== 'EVENT') {
                const year = new Date().getFullYear()
                if (newItem.milestoneType === 'Q1') payload.date = `${year}-03-31`
                if (newItem.milestoneType === 'Q2') payload.date = `${year}-06-30`
                if (newItem.milestoneType === 'Q3') payload.date = `${year}-09-30`
                if (newItem.milestoneType === 'Q4') payload.date = `${year}-12-31`
            }

            payload.achievements = subTasks
        }

        try {
            const res = await fetch('/api/admin/scorecard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgId: selectedOrg,
                    type: addType,
                    item: payload
                })
            })

            if (res.ok) {
                toast.success('Item added')
                setIsAddOpen(false)
                setNewItem({ title: '', value: '', percentage: '', milestoneType: 'Q1', date: '', subTaskInput: '' })
                setSubTasks([])
                fetchScorecard(selectedOrg)
            }
        } catch (e) {
            toast.error('Failed to save')
        }
    }

    const handleDelete = async (type: string, itemId: string) => {
        if (!confirm('Delete this item?')) return
        try {
            const res = await fetch('/api/admin/scorecard', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId: selectedOrg, type, itemId })
            })
            if (res.ok) {
                toast.success('Deleted')
                fetchScorecard(selectedOrg)
            }
        } catch (e) { toast.error('Error deleting') }
    }

    const openAddModal = (type: 'KPI' | 'BENCHMARK' | 'MILESTONE') => {
        setAddType(type)
        setIsAddOpen(true)
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Analytics Scorecard</h1>
                    <p className="text-slate-500 font-medium text-lg mt-2">Manage KPIs, benchmarks, and success milestones.</p>
                </div>
                <div className="w-full md:w-72">
                    <Label className="mb-2 block font-bold text-slate-700">Select Organization</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="w-full justify-between h-12 bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            >
                                {selectedOrg
                                    ? organizations.find((org) => org.id === selectedOrg)?.name
                                    : "Search Client..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search organization..." />
                                <CommandList>
                                    <CommandEmpty>No client found.</CommandEmpty>
                                    <CommandGroup>
                                        {organizations.map((org) => (
                                            <CommandItem
                                                key={org.id}
                                                value={org.name}
                                                onSelect={() => {
                                                    setSelectedOrg(org.id === selectedOrg ? "" : org.id)
                                                    setOpenCombobox(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedOrg === org.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {org.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {!selectedOrg ? (
                <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-100/50">
                    <Activity className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold">Please select an organization to view their scorecard.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: KPIs & Benchmarks */}
                    <div className="space-y-8">
                        {/* KPIs */}
                        <Card className="rounded-[2rem] border-slate-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-600" /> Key Performance Indicators
                                    </CardTitle>
                                    <CardDescription>Dynamic metrics for success tracking</CardDescription>
                                </div>
                                <Button size="sm" onClick={() => openAddModal('KPI')} className="rounded-full h-8 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 font-bold gap-1">
                                    <Plus className="w-3 h-3" /> Add KPI
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {scorecard.kpis?.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No KPIs set yet.</p>}
                                {scorecard.kpis?.map(kpi => (
                                    <div key={kpi.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-slate-700">{kpi.title}</span>
                                                <span className="font-mono font-bold text-slate-900">{kpi.value}</span>
                                            </div>
                                            {kpi.percentage !== undefined && (
                                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${kpi.percentage}%` }} />
                                                </div>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete('KPI', kpi.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 ml-4">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Benchmarks */}
                        <Card className="rounded-[2rem] border-slate-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black flex items-center gap-2">
                                        <Target className="w-5 h-5 text-purple-600" /> Strategic Benchmarks
                                    </CardTitle>
                                    <CardDescription>Long-term goals and standards</CardDescription>
                                </div>
                                <Button size="sm" onClick={() => openAddModal('BENCHMARK')} className="rounded-full h-8 px-4 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100 font-bold gap-1">
                                    <Plus className="w-3 h-3" /> Add Benchmark
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {scorecard.benchmarks?.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No benchmarks set yet.</p>}
                                {scorecard.benchmarks?.map(bm => (
                                    <div key={bm.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-slate-700">{bm.title}</span>
                                                <span className="font-mono font-bold text-slate-900">{bm.value}</span>
                                            </div>
                                            {bm.percentage !== undefined && (
                                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                    <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${bm.percentage}%` }} />
                                                </div>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete('BENCHMARK', bm.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 ml-4">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Milestones */}
                    <Card className="rounded-[2rem] border-slate-100 shadow-sm h-fit">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <Flag className="w-5 h-5 text-green-600" /> Success Milestones
                                </CardTitle>
                                <CardDescription>Quarterly objectives and key events</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => openAddModal('MILESTONE')} className="rounded-full h-8 px-4 bg-green-50 text-green-600 hover:bg-green-100 border border-green-100 font-bold gap-1">
                                <Plus className="w-3 h-3" /> Add Milestone
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6 relative ml-2">
                            {/* Timeline Line */}
                            <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-200" />

                            {scorecard.milestones?.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4 pl-4">No milestones scheduled.</p>}
                            {scorecard.milestones?.sort((a, b) => (a.date || '') > (b.date || '') ? 1 : -1).map(ms => (
                                <div key={ms.id} className="relative pl-10 group">
                                    {/* Dot */}
                                    <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${ms.type === 'EVENT' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                        <span className="text-[10px] font-black">{ms.type === 'EVENT' ? 'EVT' : ms.type}</span>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 transition-all hover:shadow-md hover:border-green-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{ms.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {ms.date ? format(new Date(ms.date), 'MMM d, yyyy') : 'No Date'}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete('MILESTONE', ms.id)} className="h-6 w-6 text-slate-300 hover:text-red-500">
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>

                                        {/* Achievements / Sub-tasks */}
                                        {ms.achievements && ms.achievements.length > 0 && (
                                            <div className="space-y-1 mt-3 pt-3 border-t border-slate-100">
                                                {ms.achievements.map((acc, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                        <span>{acc}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add Item Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Add {addType === 'KPI' ? 'KPI' : addType === 'BENCHMARK' ? 'Benchmark' : 'Milestone'}</DialogTitle>
                        <DialogDescription>Create a new metric for the scorecard.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {addType !== 'MILESTONE' ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input placeholder="e.g. Employee Retention Rate" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Display Value</Label>
                                        <Input placeholder="e.g. 94%" value={newItem.value} onChange={e => setNewItem({ ...newItem, value: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Progress % (0-100)</Label>
                                        <Input type="number" placeholder="94" value={newItem.percentage} onChange={e => setNewItem({ ...newItem, percentage: e.target.value })} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Select value={newItem.milestoneType} onValueChange={v => setNewItem({ ...newItem, milestoneType: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                                                <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                                                <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                                                <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                                                <SelectItem value="EVENT">Special Event</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input type="date" value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Milestone Title</Label>
                                    <Input placeholder="e.g. Annual Health Audit" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Achievements / Sub-tasks</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add an achievement..."
                                            value={newItem.subTaskInput}
                                            onChange={e => setNewItem({ ...newItem, subTaskInput: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubTask())}
                                        />
                                        <Button type="button" onClick={handleAddSubTask} size="icon"><Plus className="w-4 h-4" /></Button>
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        {subTasks.map((task, i) => (
                                            <div key={i} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg text-sm">
                                                <span>{task}</span>
                                                <Trash2 onClick={() => setSubTasks(subTasks.filter((_, idx) => idx !== i))} className="w-3 h-3 text-slate-400 cursor-pointer hover:text-red-500" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveItem} className="bg-slate-900 hover:bg-slate-800">Save Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
