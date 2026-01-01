'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { Search, Mail, Trash2, UserPlus, Building2, Shield, User, Filter, MoreVertical, X, BadgeCheck, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface UserItem {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'HUSU_OWNER' | 'ORG_ADMIN' | 'EMPLOYEE'
  organization_name: string
  organization_id: string | null
  created_at: string
}

interface Organization {
  id: string
  name: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    organizationId: ''
  })

  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchOrgs()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' })
      if (res.ok) {
        const { data } = await res.json()
        setUsers(data)
      }
    } catch (e) {
      console.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrgs = async () => {
    try {
      const res = await fetch('/api/admin/organizations', { credentials: 'include' })
      if (res.ok) {
        const { data } = await res.json()
        setOrgs(data)
      }
    } catch (e) {
      console.error('Failed to fetch orgs')
    }
  }

  const handleAddUser = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
        credentials: 'include'
      })
      if (res.ok) {
        setIsAddUserOpen(false)
        setSuccessMsg(`User ${newUser.firstName} created successfully!`)
        setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE', organizationId: '' })
        fetchUsers()
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } catch (e) {
      console.error('Failed to add user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        setSuccessMsg('User deleted successfully')
        fetchUsers()
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } catch (e) {
      console.error('Failed to delete user')
    }
  }

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-2 text-lg">Grant access, manage roles, and monitor organizational members.</p>
        </div>

        {successMsg && (
          <div className="bg-green-100 text-green-700 px-6 py-3 rounded-xl border border-green-200 font-bold animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold gap-2">
              <UserPlus className="w-5 h-5" />
              <span>Add New User</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Create Profile</DialogTitle>
              <DialogDescription>Add a new administrator or employee to the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input id="password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Platform Role</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORG_ADMIN">Organization Admin</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee (Survey User)</SelectItem>
                    <SelectItem value="HUSU_OWNER">HUSU Internal Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(newUser.role === 'ORG_ADMIN' || newUser.role === 'EMPLOYEE') && (
                <div className="grid gap-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="org">Assign Organization</Label>
                  <Select value={newUser.organizationId} onValueChange={(v) => setNewUser({ ...newUser, organizationId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orgs.filter(o => o.id).map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleAddUser} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="border-b bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search by name, email, or organization..."
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
              <p className="text-slate-500 font-medium tracking-wide">Securely loading system users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-24 px-6 italic text-slate-500">No users match your current search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User Profile</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Organization</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${user.role === 'HUSU_OWNER' ? 'bg-indigo-600' :
                            user.role === 'ORG_ADMIN' ? 'bg-blue-500' : 'bg-slate-400'
                            }`}>
                            {user.first_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {user.organization_name}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <Badge className={`rounded-xl px-3 py-1 font-bold text-[10px] uppercase tracking-wider ${user.role === 'HUSU_OWNER' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100' :
                          user.role === 'ORG_ADMIN' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                            'bg-slate-100 text-slate-600 hover:bg-slate-100'
                          }`}>
                          {user.role === 'HUSU_OWNER' && <Shield className="w-3 h-3 mr-1" />}
                          {user.role === 'ORG_ADMIN' && <BadgeCheck className="w-3 h-3 mr-1" />}
                          {user.role === 'EMPLOYEE' && <User className="w-3 h-3 mr-1" />}
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-10 w-10 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </td>
                    </tr>
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
