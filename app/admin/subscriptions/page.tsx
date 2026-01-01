'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Calendar as CalendarIcon, Edit, Power, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface OrgSubscription {
    _id: string
    name: string
    industry: string
    admin_email: string
    subscription: {
        plan_id: string
        start_date: string
        end_date: string
        status: string
    } | null
    calculated_status: string
}

export default function SubscriptionsPage() {
    const [orgs, setOrgs] = useState<OrgSubscription[]>([])
    const [filteredOrgs, setFilteredOrgs] = useState<OrgSubscription[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedOrg, setSelectedOrg] = useState<OrgSubscription | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    // Edit Form State
    const [editForm, setEditForm] = useState({
        plan_id: '',
        start_date: '',
        end_date: '',
        status: 'ACTIVE'
    })

    useEffect(() => {
        fetchSubscriptions()
    }, [])

    useEffect(() => {
        if (searchQuery) {
            const lower = searchQuery.toLowerCase()
            setFilteredOrgs(orgs.filter(o =>
                o.name.toLowerCase().includes(lower) ||
                o.admin_email?.toLowerCase().includes(lower)
            ))
        } else {
            setFilteredOrgs(orgs)
        }
    }, [searchQuery, orgs])

    const fetchSubscriptions = async () => {
        try {
            const res = await fetch('/api/admin/subscriptions')
            if (res.ok) {
                const { data } = await res.json()
                setOrgs(data)
                setFilteredOrgs(data)
            }
        } catch (error) {
            toast.error('Failed to load subscription data')
        } finally {
            setLoading(false)
        }
    }

    const handleEditClick = (org: OrgSubscription) => {
        setSelectedOrg(org)
        setEditForm({
            plan_id: org.subscription?.plan_id || 'PRO_PLAN',
            start_date: org.subscription?.start_date ? new Date(org.subscription.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            end_date: org.subscription?.end_date ? new Date(org.subscription.end_date).toISOString().split('T')[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            status: org.calculated_status === 'PENDING_ACTIVATION' ? 'ACTIVE' : org.subscription?.status || 'ACTIVE'
        })
        setIsEditOpen(true)
    }

    const handleSave = async () => {
        if (!selectedOrg) return
        setIsUpdating(true)

        try {
            const res = await fetch('/api/admin/subscriptions/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    org_id: selectedOrg._id,
                    ...editForm
                })
            })

            if (res.ok) {
                toast.success('Subscription updated successfully')
                setIsEditOpen(false)
                fetchSubscriptions() // Refresh list
            } else {
                toast.error('Failed to update subscription')
            }
        } catch (error) {
            toast.error('An error occurred')
        } finally {
            setIsUpdating(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return <Badge className="bg-green-500/10 text-green-600 border-green-200">Active</Badge>
            case 'SUSPENDED': return <Badge className="bg-red-500/10 text-red-600 border-red-200">Suspended</Badge>
            case 'PENDING_ACTIVATION': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pending Activation</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subscription Management</h1>
                    <p className="text-slate-500 font-medium">Monitor and manage organization access plans</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                        className="pl-12 h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white transition-all"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrgs.map(org => (
                            <div key={org._id} className="group p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6">

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-lg text-slate-900">{org.name}</h3>
                                        {getStatusBadge(org.calculated_status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                        <span className="flex items-center gap-1"><Power className="w-3 h-3" /> {org.subscription ? org.subscription.plan_id : 'No Plan Assigned'}</span>
                                        {org.subscription && (
                                            <span className="flex items-center gap-1 text-slate-400">
                                                {org.subscription.start_date && !isNaN(new Date(org.subscription.start_date).getTime()) ? format(new Date(org.subscription.start_date), 'MMM d, yyyy') : 'N/A'} -
                                                <span className='text-slate-600'>
                                                    {org.subscription.end_date && !isNaN(new Date(org.subscription.end_date).getTime()) ? format(new Date(org.subscription.end_date), 'MMM d, yyyy') : 'N/A'}
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {org.calculated_status === 'SUSPENDED' && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                                            <AlertTriangle className="w-4 h-4" /> Service Halting
                                        </div>
                                    )}
                                    <Button onClick={() => handleEditClick(org)} variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-600">
                                        <Edit className="w-4 h-4 mr-2" /> Manage Plan
                                    </Button>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Manage Subscription</DialogTitle>
                        <DialogDescription>
                            Update plan details for <span className="text-blue-600 font-bold">{selectedOrg?.name}</span>.
                            {selectedOrg?.calculated_status === 'PENDING_ACTIVATION' && (
                                <span className="block mt-2 text-amber-600 font-bold text-xs bg-amber-50 p-2 rounded-lg border border-amber-100">
                                    ⚠️ This organization needs activation. Set a plan to enable access.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Plan Type</Label>
                            <Input
                                value={editForm.plan_id}
                                onChange={e => setEditForm({ ...editForm, plan_id: e.target.value })}
                                placeholder="e.g. ENTERPRISE_YEARLY"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={editForm.start_date}
                                    onChange={e => setEditForm({ ...editForm, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={editForm.end_date}
                                    onChange={e => setEditForm({ ...editForm, end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Suspended (Access Revoked)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700">
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
