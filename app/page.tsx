'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  Activity,
  Users,
  Layout,
  Zap,
  Globe,
  Lock,
  Maximize2,
  ChevronRight,
  BarChart3,
  Cpu,
  CheckCircle2,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Decorative Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-grid-white opacity-[0.03]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-dark px-8 py-4 rounded-[2rem] border-white/5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20">
              <img src="/husu.png" alt="HUSU" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-glow">HUSU</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {['Platforms', 'Features', 'Sustainability', 'Network'].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-white text-slate-900 hover:bg-blue-600 hover:text-white rounded-xl px-6 h-11 text-[11px] font-black uppercase tracking-widest transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-dark border-white/10">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">v2.0 Tactical Build Live</span>
              </div>

              <h1 className="text-7xl sm:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic">
                Defining The <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 text-glow">Human</span> <br />
                Standard.
              </h1>

              <p className="text-xl text-slate-400 max-w-lg font-medium leading-relaxed">
                The world's most advanced Human Sustainability Platform. Measure, analyze, and optimize employee wellbeing with cryptographic precision.
              </p>

              <div className="flex flex-wrap gap-6 pt-4">
                <Link href="/register">
                  <Button className="h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-500/20 group">
                    Start Integration
                    <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button variant="outline" className="h-16 px-10 border-white/10 hover:bg-white/5 rounded-2xl font-black uppercase tracking-widest text-sm text-slate-300">
                  Documentation
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-8 border-t border-white/5">
                <div>
                  <div className="text-3xl font-black italic">500+</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Global Orgs</div>
                </div>
                <div>
                  <div className="text-3xl font-black italic">1.2M</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Users Monitored</div>
                </div>
                <div>
                  <div className="text-3xl font-black italic">99.9%</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Data Integrity</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="relative lg:h-[600px] flex items-center justify-center pt-20 lg:pt-0"
            >
              {/* Central Visual Hub */}
              <div className="relative w-full aspect-square max-w-[500px] animate-float">
                <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-purple-600/30 blur-[60px]" />
                <div className="absolute inset-0 glass-dark rounded-[3rem] border-white/10 shadow-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white opacity-[0.05]" />
                  <div className="p-12 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Telemetry</span>
                      </div>
                      <Maximize2 className="w-4 h-4 text-slate-600" />
                    </div>

                    <div className="space-y-6">
                      {[45, 78, 92].map((val, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <span>Metric Cluster _{i + 1}</span>
                            <span className="text-blue-500">{val}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 2, delay: 0.5 + (i * 0.2) }}
                              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-8 grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <Users className="w-6 h-6 text-purple-500 mb-2" />
                        <div className="text-xl font-black">2.4k</div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Active Units</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <Zap className="w-6 h-6 text-yellow-500 mb-2" />
                        <div className="text-xl font-black">12ms</div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Latency</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orbiting Elements */}
                <div className="absolute -top-10 -right-10 w-24 h-24 glass-dark rounded-2xl border-white/10 flex items-center justify-center animate-float-delayed transform rotate-12">
                  <Lock className="w-10 h-10 text-green-500/50" />
                </div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 glass-dark rounded-full border-white/10 flex items-center justify-center animate-float transform -rotate-6">
                  <BarChart3 className="w-12 h-12 text-blue-500/50" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Ticker */}
      <div className="border-y border-white/5 bg-white/[0.02] py-12">
        <div className="max-w-7xl mx-auto px-6 overflow-hidden">
          <div className="flex gap-20 items-center justify-between whitespace-nowrap opacity-40">
            {['TECHNOCORE', 'AEROSPACE', 'GLOBAL_LOGISTICS', 'NEURAL_LINK', 'QUANTUM_SYNC', 'BIO_SYSTEMS'].map(p => (
              <span key={p} className="text-xl font-black italic tracking-tighter grayscale hover:grayscale-0 transition-all cursor-default">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Tactical Infrastructure</h2>
            <h3 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter">Engineered for <span className="text-blue-500">Impact</span>.</h3>
            <p className="text-slate-500 max-w-xl mx-auto text-sm font-medium">
              Every component of HUSU is built to provide maximum clarity and actionable data while maintaining ironclad security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Dynamic Surveys', desc: 'Real-time adaptive questioning modules powered by behavioral logic.', icon: Layout, color: 'text-blue-500' },
              { title: 'Strategic Analytics', desc: 'Holistic data visualizer for organizational health and KPI tracking.', icon: BarChart3, color: 'text-purple-500' },
              { title: 'Multi-Factor Auth', desc: 'Military-grade cryptographic handshake for total data sovereignty.', icon: Shield, color: 'text-green-500' },
              { title: 'Global Deployment', desc: 'Instantly provision mission portals across thousands of remote units.', icon: Globe, color: 'text-indigo-500' },
              { title: 'Neural Reporting', desc: 'Automated analytics exports with sub-second generation latency.', icon: Activity, color: 'text-red-500' },
              { title: 'Quantum Compute', desc: 'High-performance processing of mission data with near-zero overhead.', icon: Cpu, color: 'text-yellow-500' },
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="p-8 glass-dark rounded-[2.5rem] border-white/5 hover:border-white/10 transition-all flex flex-col items-start gap-6 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-7 h-7 ${f.color}`} />
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase italic tracking-tighter mb-2">{f.title}</h4>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">{f.desc}</p>
                </div>
                <div className="mt-auto pt-6 w-full flex justify-end">
                  <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-white transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment Section */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto glass-dark rounded-[4rem] border-white/5 overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white opacity-[0.03]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -mr-32 -mt-32" />

          <div className="relative z-10 p-12 lg:p-24 grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                Mission Control <br />
                <span className="text-blue-500">For Your Org.</span>
              </h3>
              <p className="text-slate-400 font-medium leading-relaxed max-w-md">
                Provision the HUSU ecosystem in under 60 seconds. Our zero-config deployment engine handles the heavy lifting while you focus on the people.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  Self-Provisioning Org Terminals
                </div>
                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  Automated Employee Roster Sync
                </div>
                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  Real-time Handshake Protocols
                </div>
              </div>
              <Link href="/register">
                <Button className="h-16 px-10 bg-white text-slate-900 hover:bg-blue-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all group shadow-2xl shadow-white/5">
                  Initialize Mission
                  <Zap className="ml-3 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Admin Terminal', icon: Lock },
                { label: 'Client Hub', icon: Building2 },
                { label: 'Employee Portal', icon: Users },
                { label: 'Security Handshake', icon: Shield },
              ].map((portal, i) => (
                <div key={i} className="p-8 glass bg-white/5 border-white/5 rounded-3xl hover:bg-white/10 transition-all flex flex-col items-center text-center gap-4">
                  <portal.icon className="w-8 h-8 text-blue-500 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white">{portal.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Global Mission Control Footer */}
      <footer className="py-20 border-t border-white/5 relative bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tighter uppercase italic">HUSU</span>
              </div>
              <p className="text-slate-500 font-medium max-w-sm">
                Defining the Human Standard for the modern enterprise. We provide the tools for true organizational sustainability.
              </p>
              <div className="flex gap-6">
                {['Twitter', 'GitHub', 'LinkedIn'].map(s => (
                  <span key={s} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-blue-500 transition-colors cursor-pointer">{s}</span>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Tactical Routes</h4>
              <div className="flex flex-col gap-4 text-[10px] items-start font-black uppercase tracking-widest text-slate-500">
                <Link href="/login" className="hover:text-white transition-colors">Client Admin</Link>
                <Link href="/login" className="hover:text-white transition-colors">Employee Portal</Link>
                <Link href="/register" className="hover:text-white transition-colors">New Mission Enrollment</Link>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">System Info</h4>
              <div className="flex flex-col gap-4 text-[10px] items-start font-black uppercase tracking-widest text-slate-500">
                <span>Privacy Protocol</span>
                <span>Service Terms</span>
                <span className="flex items-center gap-2">
                  System Status:
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-500">Operational</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-white/5 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">&copy; 2026 HUSU. DESIGNED FOR MISSION-CRITICAL ENVIRONMENTS.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
