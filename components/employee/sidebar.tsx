'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CheckCircle2,
  Award,
  LogOut,
  X,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'

const employeeMenuItems = [
  { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
  { label: 'Surveys', href: '/employee/surveys', icon: CheckCircle2 },
  { label: 'Certificates', href: '/employee/certificates', icon: Award },
  { label: 'Resources', href: '/employee/resources', icon: BookOpen },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-white transition-transform duration-300 z-50 md:z-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link href="/employee/dashboard" className="font-bold text-xl">
            HUSU
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-2 px-4 py-8">
          {employeeMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                )}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full flex items-center gap-2 bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/10 rounded-xl"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
          </Button>
        </div>
      </aside>
    </>
  )
}
