'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from '@/components/auth/login-form'
import { Card } from '@/components/ui/card'
import { Shield, Layout, Users, Activity, ChevronRight } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Pane - Branding & Illustration */}
      <div className="hidden lg:flex lg:w-[45%] bg-slate-900 relative flex-col justify-between p-16 text-white overflow-hidden">
        {/* Background Visual */}
        <div className="absolute inset-0 opacity-40">
          <img
            src="/uploads/login_background.png"
            className="w-full h-full object-cover"
            alt="Tech background"
            onError={(e) => {
              // Fallback if the generated image is not in the public uploads yet
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-slate-900" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">HUSU</h1>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-6xl font-black tracking-tight leading-[0.9] uppercase">
              Defining The <span className="text-blue-500">Human</span> Standard.
            </h2>
            <p className="text-xl text-slate-400 font-medium">
              Join the future of workplace sustainability and employee mental health measurement.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 border-t border-white/10 pt-12">
          {[
            { label: 'Real-time KPIs', icon: Activity, desc: 'Live data tracking' },
            { label: 'Encrypted PII', icon: Shield, desc: 'ISO 27001 standard' },
            { label: 'Bulk Deploy', icon: Layout, desc: 'Org-wide access' },
            { label: 'Network', icon: Users, desc: '1M+ users scale' },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2 group cursor-default">
                <item.icon className="w-4 h-4 text-blue-500 transition-transform group-hover:scale-110" />
                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane - Authentication Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 relative">
        {/* Mobile Header */}
        <div className="lg:hidden mb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900 leading-none">HUSU</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Human Sustainability Platform</p>
        </div>

        <div className="w-full max-w-md">
          <Tabs defaultValue="employee" className="w-full">
            <div className="flex justify-center mb-10 p-1.5 bg-slate-200/50 rounded-2xl w-fit mx-auto">
              <TabsList className="bg-transparent h-12 p-0 gap-1 border-none bg-none shadow-none">
                <TabsTrigger
                  value="employee"
                  className="px-8 h-full rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all"
                >
                  Employee
                </TabsTrigger>
                <TabsTrigger
                  value="org-admin"
                  className="px-8 h-full rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all"
                >
                  Client Admin
                </TabsTrigger>
              </TabsList>
            </div>

            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] bg-white overflow-hidden p-8 sm:p-12">
              <TabsContent value="org-admin" className="mt-0 focus-visible:outline-none">
                <LoginForm role="ORG_ADMIN" />
              </TabsContent>

              <TabsContent value="employee" className="mt-0 focus-visible:outline-none">
                <LoginForm role="EMPLOYEE" />
              </TabsContent>
            </Card>
          </Tabs>

          <div className="mt-12 text-center space-y-4">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Powering over 500+ enterprises worldwide
            </p>
            <div className="flex items-center justify-center gap-2">
              <a href="https://husu.co.uk" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Privacy Policy</a>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <a href="https://husu.co.uk" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Terms of Service</a>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <a
                href="https://husu.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
              >
                husu.co.uk
              </a>
            </div>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-100/50 rounded-full blur-3xl -z-10" />
      </div>
    </div>
  )
}
