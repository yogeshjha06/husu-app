'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  HelpCircle,
  Layout,
  Send,
  BarChart3,
  Users,
  Briefcase,
  FileText,
  Upload,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'

const adminMenuItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  {
    label: 'Survey',
    icon: ClipboardList,
    subItems: [
      { label: 'Question Bank', href: '/admin/questions', icon: HelpCircle },
      { label: 'Form Builder', href: '/admin/forms', icon: Layout },
      { label: 'Assign Forms', href: '/admin/assignments', icon: Send },
    ]
  },
  {
    label: 'Management',
    icon: Briefcase,
    subItems: [
      { label: 'Client Desk', href: '/admin/clients', icon: Briefcase },
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: FileText },
      { label: 'User Management', href: '/admin/users', icon: Users },
    ]
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    subItems: [
      { label: 'Response Analyzer', href: '/admin/responses', icon: BarChart3 },
      { label: 'Report Builder', href: '/admin/reports', icon: FileText },
      { label: 'Scorecard', href: '/admin/scorecard', icon: TrendingUp },
    ]
  },
  { label: 'Resources', href: '/admin/resources', icon: Upload },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  role: 'admin' | 'org-admin' | 'employee'
}

export function Sidebar({ isOpen, setIsOpen, role }: SidebarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const menuItems = role === 'admin' ? adminMenuItems : []

  // Auto-expand the active section on mount and when pathname changes
  useEffect(() => {
    const activeItem = menuItems.find(item =>
      item.subItems?.some(sub => pathname.startsWith(sub.href))
    )
    if (activeItem) {
      setExpandedItems([activeItem.label])
    }
  }, [pathname, role])

  const handleSignOut = async () => {
    await signOut()
  }

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? [] : [label]
    )
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
          <Link href="/admin/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
              <span className="font-black text-white text-xs italic">H</span>
            </div>
            <span className="font-black text-xl italic uppercase tracking-tighter">HUSU Admin</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 px-4 py-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isCollapsible = !!item.subItems
            const isExpanded = expandedItems.includes(item.label)
            const isActive = !isCollapsible && pathname.startsWith(item.href!)
            const hasActiveChild = isCollapsible && item.subItems?.some(sub => pathname.startsWith(sub.href))

            if (isCollapsible) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors group',
                      hasActiveChild ? 'bg-slate-800/50 text-white' : 'text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                    )}
                  </button>

                  <div className={cn(
                    'overflow-hidden transition-all duration-300 ml-4 border-l border-slate-800',
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  )}>
                    {item.subItems?.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isSubActive = pathname.startsWith(subItem.href)

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm my-1',
                            isSubActive
                              ? 'bg-slate-700 text-white'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span>{subItem.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
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

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/10 rounded-2xl h-12 transition-all p-4"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[11px] font-black uppercase tracking-widest leading-none">Sign Out</span>
          </Button>
        </div>
      </aside>
    </>
  )
}
