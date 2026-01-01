'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { Search, Settings, Building2, Mail, Users, BadgeCheck, Clock, ShieldCheck, MoreVertical, Plus, Upload, Image as ImageIcon, MapPin, Globe, CheckCircle2, Trash2, AlertTriangle, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Organization {
  id: string
  name: string
  industry: string
  size: string
  admin_name: string
  admin_email: string
  admin_phone?: string
  country_of_operation: string
  logo_url?: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'VERIFIED'
  created_at: string
}

export default function ClientsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false)
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false)
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [newOrg, setNewOrg] = useState({
    name: '',
    industry: '',
    size: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    countryOfOperation: '',
    website: '',
    logoUrl: '',
    privacyAccepted: true,
    termsAccepted: true
  })

  useEffect(() => {
    fetchOrgs()
  }, [])

  const fetchOrgs = async () => {
    try {
      const res = await fetch('/api/admin/organizations', { credentials: 'include' })
      if (res.ok) {
        const { data } = await res.json()
        setOrganizations(data)
      }
    } catch (e) {
      console.error('Failed to fetch orgs')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 200
          const MAX_HEIGHT = 200
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          // Compress as JPEG with 0.7 quality
          const base64 = canvas.toDataURL('image/jpeg', 0.7)
          setNewOrg(prev => ({ ...prev, logoUrl: base64 }))
          setUploading(false)
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Logo processing failed')
      setUploading(false)
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/organizations?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        fetchOrgs()
        setDeleteId(null)
      }
    } catch (e) {
      console.error('Failed to delete organization')
    }
  }

  const handleAddOrg = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/register-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrg)
      })
      if (res.ok) {
        setIsAddOrgOpen(false)
        setNewOrg({
          name: '', industry: '', size: '', adminName: '', adminEmail: '',
          adminPhone: '', countryOfOperation: '', website: '', logoUrl: '',
          privacyAccepted: true, termsAccepted: true
        })
        fetchOrgs()
      }
    } catch (e) {
      console.error('Failed to add org')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
        credentials: 'include'
      })
      if (res.ok) fetchOrgs()
    } catch (e) {
      console.error('Failed to update status')
    }
  }

  const handleEditClick = (org: Organization) => {
    setNewOrg({
      name: org.name,
      industry: org.industry,
      size: org.size,
      adminName: org.admin_name,
      adminEmail: org.admin_email,
      adminPhone: org.admin_phone || '',
      countryOfOperation: org.country_of_operation,
      website: (org as any).website || '',
      logoUrl: org.logo_url || '',
      privacyAccepted: true,
      termsAccepted: true
    })
    setEditingOrgId(org.id)
    setIsEditOrgOpen(true)
  }

  const saveEditedOrg = async () => {
    if (!editingOrgId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingOrgId, ...newOrg }),
        credentials: 'include'
      })
      if (res.ok) {
        setIsEditOrgOpen(false)
        setEditingOrgId(null)
        setNewOrg({
          name: '', industry: '', size: '', adminName: '', adminEmail: '',
          adminPhone: '', countryOfOperation: '', website: '', logoUrl: '',
          privacyAccepted: true, termsAccepted: true
        })
        fetchOrgs()
      }
    } catch (e) {
      console.error('Failed to save edited org')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredOrgs = organizations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.admin_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Client Desk</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage organizational partnerships and system access.</p>
        </div>
        <div className="flex gap-4">
          <Dialog open={isAddOrgOpen} onOpenChange={setIsAddOrgOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold gap-2">
                <Plus className="w-5 h-5" />
                <span>Add Client</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Register New Client</DialogTitle>
                <DialogDescription>Enter the organization details to create a new partnership.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="font-bold text-slate-700">Organization Name</Label>
                    <Input placeholder="Acme Inc" value={newOrg.name} onChange={e => setNewOrg({ ...newOrg, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="font-bold text-slate-700">Industry</Label>
                      <Select onValueChange={v => setNewOrg({ ...newOrg, industry: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accounting">Accounting</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-bold text-slate-700">Employee Count</Label>
                      <Select onValueChange={v => setNewOrg({ ...newOrg, size: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-50">1-50</SelectItem>
                          <SelectItem value="51-200">51-200</SelectItem>
                          <SelectItem value="201-1000">201-1000</SelectItem>
                          <SelectItem value="1000+">1000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="font-bold text-slate-700">Country of Operation</Label>
                      <Input placeholder="United Kingdom" value={newOrg.countryOfOperation} onChange={e => setNewOrg({ ...newOrg, countryOfOperation: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-bold text-slate-700">Website (Optional)</Label>
                      <Input placeholder="https://acme.com" value={newOrg.website} onChange={e => setNewOrg({ ...newOrg, website: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="grid gap-2">
                      <Label className="font-bold text-slate-700">Admin Name</Label>
                      <Input placeholder="John Doe" value={newOrg.adminName} onChange={e => setNewOrg({ ...newOrg, adminName: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-bold text-slate-700">Admin Email</Label>
                      <Input type="email" placeholder="admin@org.com" value={newOrg.adminEmail} onChange={e => setNewOrg({ ...newOrg, adminEmail: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold text-slate-700">Admin Phone (Optional)</Label>
                    <Input placeholder="+44 20 7123 4567" value={newOrg.adminPhone} onChange={e => setNewOrg({ ...newOrg, adminPhone: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold text-slate-700">Logo (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border-2 border-dashed flex items-center justify-center">
                        {newOrg.logoUrl ? <img src={newOrg.logoUrl} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon className="text-slate-300" />}
                      </div>
                      <Label htmlFor="modal-logo-upload" className="cursor-pointer bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold">
                        {uploading ? 'Uploading...' : 'Upload'}
                        <input id="modal-logo-upload" type="file" className="hidden" onChange={handleLogoUpload} />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOrgOpen(false)}>Cancel</Button>
                <Button onClick={handleAddOrg} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                  {submitting ? 'Registering...' : 'Register Client'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="bg-white shadow-sm border-slate-200 flex items-center px-4">
            <div className="flex items-center gap-4 py-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Total Clients</p>
                <p className="text-xl font-black text-slate-900 leading-none">{organizations.length}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="border-b bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search organizations, admin names, or emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 text-lg rounded-2xl"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-medium tracking-wide">Fetching client data...</p>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-24 px-6 italic text-slate-500">No organizations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Organization</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Administrator</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Operation</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm p-1">
                            {org.logo_url ? <img src={org.logo_url} className="w-full h-full object-contain" /> : <Building2 className="text-slate-400 w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-base leading-tight">{org.name}</p>
                            <Badge variant="outline" className="mt-1 text-[10px] uppercase font-bold tracking-wider py-0 px-2 rounded-md">
                              {org.industry}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-medium text-slate-700">
                        <p className="font-bold">{org.admin_name}</p>
                        <p className="text-xs text-slate-500">{org.admin_email}</p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-xs uppercase tracking-wider">{org.country_of_operation || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-slate-400">
                          <Users className="w-4 h-4" />
                          <span className="text-xs">{org.size} Employees</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <Badge className={`rounded-xl px-3 py-1 font-bold text-[10px] uppercase tracking-widest ${(org.status === 'ACTIVE' || org.status === 'VERIFIED') ? 'bg-green-500/10 text-green-600' :
                          org.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-red-500/10 text-red-600'
                          }`}>
                          {org.status === 'VERIFIED' ? 'ACTIVE' : org.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100">
                              <MoreVertical className="w-5 h-5 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100">
                            <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 py-2 text-[10px]">Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClick(org)} className="rounded-xl p-3 gap-3 cursor-pointer">
                              <Edit className="w-5 h-5 text-blue-600" />
                              <span className="font-bold text-slate-900">Edit Details</span>
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-100 my-1" />
                            <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 py-1 text-[10px]">Change Access</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => updateStatus(org.id, 'ACTIVE')} className="rounded-xl p-3 gap-3 cursor-pointer">
                              <BadgeCheck className="w-5 h-5 text-green-600" />
                              <span className="font-bold text-slate-900">Activate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(org.id, 'PENDING')} className="rounded-xl p-3 gap-3 cursor-pointer">
                              <Clock className="w-5 h-5 text-amber-600" />
                              <span className="font-bold text-slate-900">Mark Pending</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(org.id, 'SUSPENDED')} className="rounded-xl p-3 gap-3 cursor-pointer">
                              <ShieldCheck className="w-5 h-5 text-indigo-600" />
                              <span className="font-bold text-slate-900">Suspend</span>
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-100 my-1" />
                            <DropdownMenuItem onClick={() => setDeleteId(org.id)} className="rounded-xl p-3 gap-3 cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50">
                              <Trash2 className="w-5 h-5" />
                              <span className="font-bold">Delete Client</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl p-8">
          <AlertDialogHeader>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">Irreversible Action</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-lg">
              Are you absolutely sure you want to delete this client? All associated data, including employees and subscriptions, will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="rounded-2xl h-12 px-6 font-bold border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteClient(deleteId)}
              className="rounded-2xl h-12 px-6 font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditOrgOpen} onOpenChange={setIsEditOrgOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Client Details</DialogTitle>
            <DialogDescription>Update the organization details and administrative profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="font-bold text-slate-700">Organization Name</Label>
                <Input placeholder="Acme Inc" value={newOrg.name} onChange={e => setNewOrg({ ...newOrg, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Industry</Label>
                  <Select value={newOrg.industry} onValueChange={v => setNewOrg({ ...newOrg, industry: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accounting">Accounting</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Employee Count</Label>
                  <Select value={newOrg.size} onValueChange={v => setNewOrg({ ...newOrg, size: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-50">1-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-1000">201-1000</SelectItem>
                      <SelectItem value="1000+">1000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Country of Operation</Label>
                  <Input placeholder="United Kingdom" value={newOrg.countryOfOperation} onChange={e => setNewOrg({ ...newOrg, countryOfOperation: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Website (Optional)</Label>
                  <Input placeholder="https://acme.com" value={newOrg.website} onChange={e => setNewOrg({ ...newOrg, website: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Admin Name</Label>
                  <Input placeholder="John Doe" value={newOrg.adminName} onChange={e => setNewOrg({ ...newOrg, adminName: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Admin Email</Label>
                  <Input type="email" placeholder="admin@org.com" value={newOrg.adminEmail} onChange={e => setNewOrg({ ...newOrg, adminEmail: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-slate-700">Admin Phone (Optional)</Label>
                <Input placeholder="+44 20 7123 4567" value={newOrg.adminPhone} onChange={e => setNewOrg({ ...newOrg, adminPhone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-slate-700">Logo (Optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 border-2 border-dashed flex items-center justify-center">
                    {newOrg.logoUrl ? <img src={newOrg.logoUrl} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon className="text-slate-300" />}
                  </div>
                  <Label htmlFor="modal-logo-edit" className="cursor-pointer bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold">
                    {uploading ? 'Processing...' : 'Change Logo'}
                    <input id="modal-logo-edit" type="file" className="hidden" onChange={handleLogoUpload} />
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOrgOpen(false)}>Cancel</Button>
            <Button onClick={saveEditedOrg} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
