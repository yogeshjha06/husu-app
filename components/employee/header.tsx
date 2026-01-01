'use client'

import { Menu, Bell, LogOut, ClipboardList, Award, Circle, Trash2, AlertTriangle, ShieldAlert, BookOpen } from 'lucide-react'
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
  type: 'TASK' | 'CERTIFICATE' | 'RESOURCE'
  time: string
  link: string
}

export function Header({ onMenuClick }: HeaderProps) {
  const { userProfile, signOut } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const [tasksRes, resourcesRes] = await Promise.all([
        fetch('/api/employee/tasks'),
        fetch('/api/employee/resources?limit=3')
      ])

      const tasksData = tasksRes.ok ? await tasksRes.json() : { data: [] }
      const resourcesData = resourcesRes.ok ? await resourcesRes.json() : { data: [] }

      const derived: Notification[] = []

      // Task & Certificate logic
      if (tasksData.data) {
        tasksData.data.forEach((task: any) => {
          if (task.status === 'SUBMITTED' || task.status === 'COMPLETED') {
            derived.push({
              id: `cert-${task.id}`,
              title: 'Achievement Earned!',
              description: `You've earned a certificate for ${task.form_name}`,
              type: 'CERTIFICATE',
              time: 'Recently',
              link: '/employee/certificates'
            })
          } else {
            derived.push({
              id: `task-${task.id}`,
              title: 'New Mission Assigned',
              description: `${task.form_name} is waiting for your input`,
              type: 'TASK',
              time: 'Active',
              link: `/employee/surveys/${task.form_type === 'SINGLE_PAGE' ? 'standard' : 'interactive'}/${task.form_id}`
            })
          }
        })
      }

      // Resource logic
      if (resourcesData.data) {
        resourcesData.data.slice(0, 3).forEach((resource: any) => {
          derived.push({
            id: `resource-${resource._id}`,
            title: 'New Resource Added',
            description: resource.title,
            type: 'RESOURCE',
            time: 'Recently Added',
            link: '/employee/resources'
          })
        })
      }

      // Sort: Priority to Certificates, then latest tasks/resources
      const sorted = derived
        .sort((a, b) => (a.type === 'CERTIFICATE' ? -1 : 1))
        .slice(0, 5)

      setNotifications(sorted)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const getInitials = () => {
    if (!userProfile) return 'U'
    return `${userProfile.first_name?.[0] || ''}${userProfile.last_name?.[0] || ''}`.toUpperCase()
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/employee/profile/delete', { method: 'DELETE' })
      if (res.ok) {
        toast.success('All data has been permanently deleted')
        router.push('/login')
        // Force reload to clear any remaining in-memory states
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error('Failed to complete data deletion')
      }
    } catch (error) {
      console.error('Deletion error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
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
          Employee <span className="text-blue-600">Portal</span>
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
                Intelligence Briefing
                <span className="text-blue-400">{notifications.length} Active</span>
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'CERTIFICATE' ? 'bg-blue-100 text-blue-600' : n.type === 'RESOURCE' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                        {n.type === 'CERTIFICATE' ? <Award className="w-5 h-5" /> : n.type === 'RESOURCE' ? <BookOpen className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 leading-none">{n.title}</p>
                        <p className="text-[10px] font-medium text-slate-500 leading-snug">{n.description}</p>
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All systems clear</p>
                </div>
              )}
            </div>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem
              onClick={() => router.push('/employee/surveys')}
              className="p-4 text-center justify-center text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
            >
              View Mission History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-100 transition-colors">
              <Avatar className="h-8 w-8 border border-slate-200">
                <AvatarFallback className="bg-slate-900 text-white text-[10px] font-black">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-slate-700">
                {userProfile?.first_name} {userProfile?.last_name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl mt-2 border-slate-100">
            <DropdownMenuLabel className="px-4 py-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">{userProfile?.first_name} {userProfile?.last_name}</span>
                <span className="text-[9px] font-medium text-slate-500">{userProfile?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-2" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="p-3 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteConfirm(true)}
              className="p-3 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Wipe All Data</span>
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
              This will result in the <span className="text-red-600 font-bold">permanent destruction</span> of your profile, all certification history, and survey responses. This action is cryptographically irreversible.
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
