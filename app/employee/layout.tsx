'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Sidebar } from '@/components/employee/sidebar'
import { Header } from '@/components/employee/header'
import { Loader } from 'lucide-react'

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userProfile, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!loading && !userProfile) {
      router.push('/login')
    }

    if (!loading && userProfile?.role !== 'EMPLOYEE') {
      router.push('/login')
    }
  }, [loading, userProfile, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'EMPLOYEE') {
    return null
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
