'use client'

import { Menu, Bell, LogOut, CheckCircle, Trash2, ShieldAlert, FileText, BookOpen, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface HeaderProps {
  onMenuClick: () => void
}

interface Notification {
  id: string
  title: string
  description: string
  type: 'REPORT' | 'RESOURCE'
  time: string
  link: string
}

export function Header({ onMenuClick }: HeaderProps) {
  const { userProfile, signOut } = useAuth()
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const [reportsRes, resourcesRes] = await Promise.all([
        fetch('/api/org-admin/reports'),
        fetch('/api/org-admin/resources?limit=3')
      ])

      const reportsData = reportsRes.ok ? await reportsRes.json() : { data: [] }
      const resourcesData = resourcesRes.ok ? await resourcesRes.json() : { data: [] }

      const derived: Notification[] = []

      // Latest 3 reports
      if (reportsData.data) {
        reportsData.data.slice(0, 3).forEach((report: any) => {
          derived.push({
            id: `report-${report._id}`,
            title: 'New Strategic Report',
            description: report.title,
            type: 'REPORT',
            time: 'Available Now',
            link: '/org-admin/insights/reports'
          })
        })
      }

      // Top 3 resources
      if (resourcesData.data) {
        resourcesData.data.slice(0, 3).forEach((resource: any) => {
          derived.push({
            id: `resource-${resource._id}`,
            title: 'New Resource Added',
            description: resource.title,
            type: 'RESOURCE',
            time: 'Recently Added',
            link: '/org-admin/resources'
          })
        })
      }

      setNotifications(derived)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/org-admin/profile/delete', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Account permanently deleted')
        router.push('/login')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error('Failed to delete account')
      }
    } catch (error) {
      console.error('Deletion error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const getInitials = () => {
    if (!userProfile) return 'U'
    return `${userProfile.first_name?.[0] || ''}${userProfile.last_name?.[0] || ''}`.toUpperCase()
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">
          Organisation Admin <span className="text-blue-600">Portal</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative group">
              <Bell className="w-5 h-5 text-slate-600 transition-colors group-hover:text-blue-600" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 rounded-[1.5rem] overflow-hidden shadow-2xl border-slate-100">
            <div className="bg-slate-900 p-4">
              <DropdownMenuLabel className="text-white font-black uppercase tracking-widest text-[10px] flex justify-between items-center">
                System Briefing
                <span className="text-blue-400">{notifications.length} New Updates</span>
              </DropdownMenuLabel>
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => router.push(n.link)}
                    className="p-4 cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'REPORT' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {n.type === 'REPORT' ? <FileText className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 leading-none">{n.title}</p>
                        <p className="text-[10px] font-medium text-slate-500 leading-snug line-clamp-2">{n.description}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-blue-500/60">{n.time}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All systems updated</p>
                </div>
              )}
            </div>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem
              onClick={() => router.push('/org-admin/insights/reports')}
              className="p-4 text-center justify-center text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
            >
              View Analytics Center
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-200 text-slate-700">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-slate-700">
                {userProfile?.first_name} {userProfile?.last_name}
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-50" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl mt-2 border-slate-100">
            <DropdownMenuLabel className="px-4 py-3">
              <div className="flex flex-col">
                <span className="flex items-center gap-1.5 font-bold">
                  {userProfile?.first_name} {userProfile?.last_name}
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />
                </span>
                <span className="text-xs text-slate-500">{userProfile?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-2" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="p-3 rounded-xl cursor-pointer text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="mx-2 my-1" />

            <DropdownMenuItem
              onClick={() => setShowDeleteConfirm(true)}
              className="p-3 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Delete Account</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden max-w-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none">
              Critical <span className="text-red-600">Action</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium text-sm leading-relaxed">
              This will result in the <span className="text-red-600 font-bold">permanent destruction</span> of your administrator account. You will lose access to all organization data immediately. This action is cryptographically irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 px-6 rounded-xl border-2 border-slate-100 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
              Abort Mission
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteAccount()
              }}
              disabled={isDeleting}
              className="h-12 px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/20 transition-all"
            >
              {isDeleting ? 'Erasing...' : 'Confirm Wipe'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
