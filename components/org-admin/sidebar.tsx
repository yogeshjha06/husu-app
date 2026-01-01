'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Trophy,
  BookOpen,
  LogOut,
  X,
  ChevronDown,
  PieChart,
  ClipboardList,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [isInsightsOpen, setIsInsightsOpen] = useState(pathname.startsWith('/org-admin/insights'))
  const [subscriptionData, setSubscriptionData] = useState<any>(null)

  useEffect(() => {
    const fetchSubData = async () => {
      try {
        const res = await fetch('/api/org-admin/subscription')
        if (res.ok) {
          const json = await res.json()
          setSubscriptionData(json.data)
        }
      } catch (error) {
        console.error('Failed to fetch subscription info', error)
      }
    }
    fetchSubData()
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  const menuItems = [
    { label: 'Dashboard', href: '/org-admin/dashboard', icon: LayoutDashboard },
    {
      label: 'Insights',
      icon: Sparkles,
      isCollapsible: true,
      isOpen: isInsightsOpen,
      setOpen: setIsInsightsOpen,
      subItems: [
        { label: 'Analytics', href: '/org-admin/insights/analytics', icon: PieChart },
        { label: 'Reports', href: '/org-admin/insights/reports', icon: ClipboardList },
      ]
    },
    { label: 'Resources', href: '/org-admin/resources', icon: BookOpen },
  ]

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-white transition-all duration-300 z-50 md:z-0 border-r border-slate-800 shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-8 flex items-center justify-between">
          <Link href="/org-admin/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
              <span className="font-black text-white text-xs italic">H</span>
            </div>
            <span className="font-black text-xl italic uppercase tracking-tighter">Org Admin</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <nav className="space-y-1.5 px-4 py-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.subItems?.some(sub => pathname === sub.href))

            if (item.isCollapsible) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => item.setOpen?.(!item.isOpen)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group',
                      isActive ? 'bg-white/5 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-5 h-5 transition-transform', isActive ? 'text-blue-500' : 'group-hover:scale-110')} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', item.isOpen ? 'rotate-180' : '')} />
                  </button>

                  <AnimatePresence initial={false}>
                    {item.isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden space-y-1 ml-4 border-l border-slate-800"
                      >
                        {item.subItems?.map((sub) => {
                          const SubIcon = sub.icon
                          const isSubActive = pathname === sub.href
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ml-2',
                                isSubActive ? 'bg-blue-600/10 text-blue-500' : 'text-slate-500 hover:text-white'
                              )}
                              onClick={() => setIsOpen(false)}
                            >
                              <SubIcon className={cn('w-4 h-4', isSubActive ? 'text-blue-500' : 'group-hover:scale-110')} />
                              <span className="text-[10px] font-black uppercase tracking-[0.15em]">{sub.label}</span>
                            </Link>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            }

            return (
              <Link
                key={item.href || item.label}
                href={item.href || '#'}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group',
                  pathname === item.href
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )}
                onClick={() => setIsOpen(false)}
              >
                <Icon className={cn('w-5 h-5', pathname === item.href ? 'text-white' : 'group-hover:scale-110')} />
                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
          {subscriptionData && (
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-all duration-500" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Plan Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${subscriptionData.subscription.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                  {subscriptionData.subscription.status}
                </span>
              </div>
              <div className="space-y-1 relative z-10">
                <h4 className="text-white font-bold text-sm leading-none flex items-center gap-2">
                  {subscriptionData.organization.name}
                  {subscriptionData.subscription.status === 'ACTIVE' && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </h4>
                <p className="text-slate-400 text-[10px] font-medium">Size: <span className="text-blue-400">{subscriptionData.organization.size}</span> Units</p>

                <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-700/50">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Start Date</span>
                    <span className="text-[9px] font-bold text-slate-300 font-mono">
                      {subscriptionData.subscription.start_date
                        ? new Date(subscriptionData.subscription.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Renews</span>
                    <span className="text-[9px] font-bold text-slate-300 font-mono">
                      {subscriptionData.subscription.end_date
                        ? new Date(subscriptionData.subscription.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
