'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, CheckCircle, BookOpen, Activity, Building2, Plus, ArrowRight, Settings, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

interface KPIData {
  totalQuestions: number
  totalForms: number
  activeForms: number
  formResponses: number
  activeUsers: number
  totalOrganizations: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function AdminDashboard() {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalQuestions: 0,
    totalForms: 0,
    activeForms: 0,
    formResponses: 0,
    activeUsers: 0,
    totalOrganizations: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/kpis', {
          credentials: 'include',
        })

        if (!res.ok) throw new Error('Failed to fetch KPIs')

        const data = await res.json()
        setKpiData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('KPI fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
  }, [])

  if (loading) {
    return (
      <div className="p-10 space-y-8 bg-slate-50 min-h-screen">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-12 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-[2rem]" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-10 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto text-red-600">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">System Error</h3>
          <p className="text-slate-500">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry Connection</Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="p-10 space-y-12 bg-slate-50/50 min-h-screen"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 bg-slate-900 rounded-full inline-flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">System Online</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">v2.4.0</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Master <span className="text-blue-600">Control</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-xl">
            Overview of platform performance, content library, and organizational growth.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/questions/new">
            <Button className="h-12 px-6 rounded-xl bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-bold shadow-sm transition-all md:w-auto w-full">
              <Plus className="w-4 h-4 mr-2 text-blue-600" />
              New Question
            </Button>
          </Link>
          <Link href="/admin/forms/new">
            <Button className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all md:w-auto w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Form
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Organizations Card */}
        <div className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:rotate-12 transition-transform duration-500">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Organizations</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight italic">{kpiData.totalOrganizations}</h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-lg">Active</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Partner Network</span>
            </div>
          </div>
        </div>

        {/* Users Card */}
        <div className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:rotate-12 transition-transform duration-500">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Active Employees</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight italic">{kpiData.activeUsers}</h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Verified</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Userbase</span>
            </div>
          </div>
        </div>

        {/* Responses Card */}
        <div className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:rotate-12 transition-transform duration-500">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Submissions</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight italic">{kpiData.formResponses}</h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Collected</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data Points</span>
            </div>
          </div>
        </div>

        {/* Forms Card */}
        <div className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-pink-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center mb-6 text-pink-600 group-hover:rotate-12 transition-transform duration-500">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Survey Library</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-slate-900 tracking-tight italic">{kpiData.totalForms}</h3>
              <span className="text-sm font-bold text-slate-400">Forms</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-2 py-1 rounded-lg">{kpiData.activeForms} Live</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Currently Deployed</span>
            </div>
          </div>
        </div>

        {/* Questions Card */}
        <div className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-slate-900/10 transition-colors" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-900 group-hover:rotate-12 transition-transform duration-500">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Question Bank</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight italic">{kpiData.totalQuestions}</h3>
                </div>
                <div className="max-w-xs">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Total distinct questions available in the global repository for creating new assessments and surveys.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Repository Status: <span className="text-green-600">Healthy</span></span>
              <Link href="/admin/questions" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Manage Repository <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Access Grid */}
      <motion.div variants={item}>
        <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-slate-400" />
          Control Center
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/questions" className="group">
            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-slate-50 h-full flex flex-col justify-between">
              <div className="mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Questions</h4>
                <p className="text-xs text-slate-500">Manage global question bank</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center ml-auto group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/admin/forms" className="group">
            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-slate-50 h-full flex flex-col justify-between">
              <div className="mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4 text-slate-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Forms</h4>
                <p className="text-xs text-slate-500">Build and publish surveys</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center ml-auto group-hover:bg-pink-600 group-hover:border-pink-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/admin/clients" className="group">
            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-slate-50 h-full flex flex-col justify-between">
              <div className="mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4 text-slate-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Clients</h4>
                <p className="text-xs text-slate-500">View registered organizations</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center ml-auto group-hover:bg-purple-600 group-hover:border-purple-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/admin/settings" className="group">
            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-slate-50 h-full flex flex-col justify-between">
              <div className="mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Settings</h4>
                <p className="text-xs text-slate-500">Global system configuration</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center ml-auto group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}
