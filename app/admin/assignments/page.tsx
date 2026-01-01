'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, Fragment } from 'react'
import { Search, Send, Building2, ClipboardList, Calendar, Trash2, CheckCircle2, Clock, Filter, Plus, X, ListChecks, User, Mail, ChevronDown, ChevronUp, Zap, BarChart3, ArrowUpRight, MessageSquare, Image as ImageIcon, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

interface UserAssignment {
  id: string
  name: string
  email: string
  organization_name: string
  assigned_forms: {
    form_id: string
    form_name: string
    status: string
    progress: number
    message?: string
    thumbnail_url?: string
  }[]
  stats: {
    assigned_lifetime: number
    completed: number
    active: number
    pending: number
  }
}

interface Organization {
  id: string
  name: string
}

interface Form {
  id: string
  name: string
}

export default function AssignmentsPage() {
  const [data, setData] = useState<UserAssignment[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const [newAssignment, setNewAssignment] = useState({
    organizationId: '',
    formIds: [] as string[],
    deadline: '',
    message: '',
    thumbnailUrl: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [assignRes, orgRes, formRes] = await Promise.all([
        fetch('/api/admin/assignments', { credentials: 'include' }),
        fetch('/api/admin/organizations', { credentials: 'include' }),
        fetch('/api/admin/forms', { credentials: 'include' })
      ])

      if (assignRes.ok) {
        const json = await assignRes.json()
        setData(json.data)
      }
      if (orgRes.ok) {
        const json = await orgRes.json()
        console.log('Orgs fetched:', json.data)
        setOrgs(json.data)
      }
      if (formRes.ok) {
        const json = await formRes.json()
        setForms(json.data)
      }
    } catch (e) {
      console.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'task-thumbnail')
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setNewAssignment(prev => ({ ...prev, thumbnailUrl: data.path }))
      }
    } catch (err) {
      console.error('Thumbnail upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleAssign = async () => {
    if (!newAssignment.organizationId || newAssignment.formIds.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssignment),
        credentials: 'include'
      })
      if (res.ok) {
        setIsAssignOpen(false)
        setSuccessMsg(`Forms deployed successfully to organization!`)
        setNewAssignment({ organizationId: '', formIds: [], deadline: '', message: '', thumbnailUrl: '' })
        fetchData()
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } catch (e) {
      console.error('Failed to assign forms')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleFormSelection = (formId: string) => {
    setNewAssignment(prev => ({
      ...prev,
      formIds: prev.formIds.includes(formId)
        ? prev.formIds.filter(id => id !== formId)
        : [...prev.formIds, formId]
    }))
  }

  const filteredData = data.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight tracking-tight uppercase">Form Deploy</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Assign tasks to entire organizations with custom messages and visuals.</p>
        </div>

        {successMsg && (
          <div className="bg-green-100 text-green-700 px-6 py-3 rounded-xl border border-green-200 font-bold animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold gap-2">
              <Plus className="w-5 h-5" />
              <span>Form Assign</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-8">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase tracking-tight">Assign Form Task</DialogTitle>
              <DialogDescription className="font-medium text-slate-500">Deploy surveys to all employees in an organization with personalized instructions.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6 font-sans">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center px-1">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Target Organization ({orgs.length})</Label>
                    {newAssignment.organizationId && <Badge className="bg-blue-100 text-blue-600 border-none text-[8px] font-black uppercase">Selected</Badge>}
                  </div>
                  <Select value={newAssignment.organizationId} onValueChange={(v) => {
                    console.log('Org selected:', v);
                    setNewAssignment({ ...newAssignment, organizationId: v });
                  }}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-bold shadow-inner">
                      <SelectValue placeholder="Select organization..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl z-[150] bg-white border-slate-100">
                      <SelectGroup>
                        {orgs.length > 0 ? (
                          orgs.map(org => (
                            <SelectItem key={org.id} value={org.id} className="rounded-xl py-3 font-bold focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                              {org.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-sm font-bold">No registered organizations</div>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-1">Motivational Message (Optional)</Label>
                  <Textarea
                    placeholder="e.g. Please share your honest feedback to help us improve our workplace culture..."
                    value={newAssignment.message}
                    onChange={(e) => setNewAssignment({ ...newAssignment, message: e.target.value })}
                    className="min-h-[120px] rounded-2xl bg-slate-50 border-none font-medium p-4 resize-none"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-1">Task Thumbnail (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                      {newAssignment.thumbnailUrl ? (
                        <img src={newAssignment.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="thumb-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold w-fit hover:bg-blue-100 transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                        </div>
                        <input id="thumb-upload" type="file" className="hidden" onChange={handleThumbnailUpload} disabled={uploading} />
                      </Label>
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mt-2">Recommended: 400x400 PNG/JPG</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid gap-3">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-1">Select Surveys ({newAssignment.formIds.length})</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto p-4 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                    {forms.map(form => (
                      <div
                        key={form.id}
                        className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all duration-300 ${newAssignment.formIds.includes(form.id) ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10' : 'bg-white border-transparent hover:border-slate-200'
                          }`}
                        onClick={() => toggleFormSelection(form.id)}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${newAssignment.formIds.includes(form.id) ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-black text-slate-900 block truncate">{form.name}</span>
                        </div>
                        <Checkbox checked={newAssignment.formIds.includes(form.id)} className="rounded-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-1">Submission Deadline</Label>
                  <Input
                    type="datetime-local"
                    value={newAssignment.deadline}
                    onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-8">
              <Button variant="ghost" onClick={() => setIsAssignOpen(false)} className="rounded-2xl h-12 font-bold px-8">Cancel</Button>
              <Button
                onClick={handleAssign}
                disabled={submitting || !newAssignment.organizationId || newAssignment.formIds.length === 0}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-12 font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 rounded-2xl ml-4"
              >
                {submitting ? 'Deploying...' : 'Deploy Tasks'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Assignments', value: data.reduce((acc, u) => acc + u.stats.assigned_lifetime, 0), icon: ListChecks, color: 'blue' },
          { label: 'Completed Forms', value: data.reduce((acc, u) => acc + u.stats.completed, 0), icon: CheckCircle2, color: 'green' },
          { label: 'Pending Response', value: data.reduce((acc, u) => acc + u.stats.pending, 0), icon: Clock, color: 'amber' },
          { label: 'Active Progress', value: data.reduce((acc, u) => acc + u.stats.active, 0), icon: Zap, color: 'indigo' },
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${kpi.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                kpi.color === 'green' ? 'bg-green-100 text-green-600' :
                  kpi.color === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
                <p className="text-2xl font-black text-slate-900">{kpi.value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search by employee name, email or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-16 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 text-xl font-bold rounded-3xl"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 font-sans">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Tracing user activity...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-24 px-6 italic text-slate-500">No trace data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Employee Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Organization</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Lifecycle Stats</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Activity Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map((u) => (
                    <Fragment key={u.id}>
                      <tr
                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${expandedUser === u.id ? 'bg-blue-50/30' : ''}`}
                        onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                      >
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center font-black text-white text-xl shadow-lg">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-lg leading-tight uppercase">{u.name}</p>
                              <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold">{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-extrabold text-slate-800 uppercase tracking-tight">{u.organization_name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime</p>
                              <p className="text-xl font-black text-slate-900">{u.stats.assigned_lifetime}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-green-600/50 uppercase tracking-widest">Done</p>
                              <p className="text-xl font-black text-green-600">{u.stats.completed}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-amber-600/50 uppercase tracking-widest">Wait</p>
                              <p className="text-xl font-black text-amber-600">{u.stats.pending}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-right">
                          <div className="flex items-center justify-end gap-4">
                            <Badge className={`rounded-xl px-4 py-1.5 font-bold text-[10px] uppercase tracking-widest ${u.stats.pending === 0 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                              {u.stats.pending === 0 ? 'Sync Complete' : 'Active Duty'}
                            </Badge>
                            {expandedUser === u.id ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                          </div>
                        </td>
                      </tr>
                      {expandedUser === u.id && (
                        <tr className="bg-slate-50/50 animate-in slide-in-from-top-4 duration-300 transition-all">
                          <td colSpan={4} className="px-8 py-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {u.assigned_forms.map(form => (
                                <Card key={form.form_id} className="border-none shadow-md rounded-3xl overflow-hidden bg-white">
                                  <div className={`h-1.5 w-full ${form.status === 'COMPLETED' || form.status === 'SUBMITTED' ? 'bg-green-500' :
                                    form.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-slate-200'
                                    }`} />
                                  <CardContent className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-100 flex items-center justify-center">
                                          {form.thumbnail_url ? (
                                            <img src={form.thumbnail_url} className="w-full h-full object-cover" />
                                          ) : (
                                            <ClipboardList className="w-6 h-6 text-slate-300" />
                                          )}
                                        </div>
                                        <div>
                                          <h4 className="font-black text-slate-900 text-sm uppercase leading-tight">{form.form_name}</h4>
                                          <p className="text-[10px] font-black text-slate-400 mt-0.5 tracking-widest uppercase">{form.status.replace('_', ' ')}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {form.message && (
                                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-[11px] text-slate-500 leading-relaxed">
                                        "{form.message}"
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Trace</span>
                                        <span className="text-xs font-black text-slate-900">{form.progress}%</span>
                                      </div>
                                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-1000 ${form.status === 'COMPLETED' ? 'bg-green-500' :
                                            form.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-slate-200'
                                            }`}
                                          style={{ width: `${form.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                              {u.assigned_forms.length === 0 && (
                                <div className="col-span-full py-6 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                  No surveys deployed to this organization yet.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
