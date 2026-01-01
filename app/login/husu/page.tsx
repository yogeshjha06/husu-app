'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Lock, Mail, ArrowRight, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth/auth-context'
import { toast } from 'sonner'

export default function HusuAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'LOGIN' | 'FIRST_TIME'>('LOGIN')
  const { refreshUser } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'LOGIN') {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error)
          return
        }

        if (data.mfaRequired) {
          toast.info('Security handshake required. Transitioning to Checkpoint...')
          router.push(`/login/verify-2fa?userId=${data.userId}&email=${data.email}&role=${data.role}`)
          return
        }

        if (data.firstTime) {
          setMode('FIRST_TIME')
          toast.info('Welcome! Please set your secure password.')
          return
        }

        // Successfully verified, cookie set by API
        toast.success('Access Granted. Welcome HUSU Owner.')
        await refreshUser()
        router.push('/admin/dashboard')
      } else {
        // First Time Setup
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match')
          return
        }

        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword, isFirstTimeSetup: true })
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error)
          return
        }

        toast.success('System password updated! Please login.')
        setMode('LOGIN')
        setPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. This terminal is restricted.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 pt-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="mb-6 inline-flex p-4 rounded-3xl bg-red-600 shadow-2xl shadow-red-600/20 ring-4 ring-red-600/20">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">HUSU <span className="text-red-600">Secure</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">
            {mode === 'LOGIN' ? 'Restricted Administrator Terminal' : 'First Time: Set your Password'}
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20 text-red-500 rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-bold text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">Admin Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@husu.network"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={mode === 'FIRST_TIME'}
                      className="pl-12 h-14 bg-white/5 border-none focus-visible:ring-2 focus-visible:ring-red-500 text-white font-bold rounded-2xl transition-all"
                    />
                  </div>
                </div>

                {mode === 'LOGIN' ? (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-12 h-14 bg-white/5 border-none focus-visible:ring-2 focus-visible:ring-red-500 text-white font-bold rounded-2xl transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">New Password</Label>
                      <div className="relative group">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Create password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="pl-12 h-14 bg-white/5 border-none focus-visible:ring-2 focus-visible:ring-red-500 text-white font-bold rounded-2xl transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">Verify Password</Label>
                      <div className="relative group">
                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Repeat password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="pl-12 h-14 bg-white/5 border-none focus-visible:ring-2 focus-visible:ring-red-500 text-white font-bold rounded-2xl transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-red-600/20 group"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authorizing...
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    {mode === 'LOGIN' ? 'Login' : 'Set Password and Login'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-slate-500">
          <p className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Session</p>
          <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-4">
            Unauthorized access is strictly prohibited
          </p>
        </div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
    </div>
  )
}
