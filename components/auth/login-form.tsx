'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Lock, Mail, ArrowRight, CheckCircle2, KeyRound, ShieldAlert, UserPlus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export function LoginForm({ role }: { role: 'HUSU_OWNER' | 'ORG_ADMIN' | 'EMPLOYEE' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'LOGIN' | 'FORGOT' | 'FIRST_TIME' | 'SIGN_UP'>('LOGIN')
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

        // The signin API already set the cookie if no MFA/FirstTime
        toast.success('Successfully signed in!')
        await refreshUser()

        if (role === 'ORG_ADMIN') {
          router.push('/org-admin/dashboard')
        } else if (role === 'EMPLOYEE') {
          router.push('/employee/tasks')
        } else {
          router.push('/admin/dashboard')
        }
      } else if (mode === 'SIGN_UP') {
        // Sign up logic (if any)
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
          {mode === 'LOGIN' ? 'Welcome Back' : mode === 'SIGN_UP' ? 'Join Network' : mode === 'FIRST_TIME' ? 'Setup Account' : 'Recovery'}
        </h2>
        <p className="text-slate-500 font-medium tracking-tight">
          {mode === 'LOGIN'
            ? `Access your ${role.replace('_', ' ')} portal dashboard`
            : mode === 'SIGN_UP'
              ? 'Enter your email to verify your enrollment'
              : mode === 'FIRST_TIME'
                ? 'Set your new secure password to activate your access'
                : 'Enter your email to receive a recovery link'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50 text-red-600">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-1">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="you@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={mode === 'FIRST_TIME'}
                className="pl-12 h-14 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 text-lg font-bold rounded-2xl transition-all"
              />
            </div>
          </div>

          {mode === 'LOGIN' && (
            <div className="space-y-2">
              <Label htmlFor="password" className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-1">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 h-14 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 text-lg font-bold rounded-2xl transition-all"
                />
              </div>
            </div>
          )}

          {mode === 'FIRST_TIME' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-1">New Password</Label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Create your password"
                    value={confirmPassword} // Use separate states if needed
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-12 h-14 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 text-lg font-bold rounded-2xl transition-all"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/10"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Authorizing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {mode === 'LOGIN' ? 'Sign In' : mode === 'SIGN_UP' ? 'Check Enrollment' : mode === 'FIRST_TIME' ? 'Set password' : 'Send Reset Link'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
      </form>

      <div className="flex items-center justify-between px-2">
        <button
          onClick={() => setMode(mode === 'LOGIN' ? 'FORGOT' : 'LOGIN')}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
        >
          {mode === 'LOGIN' ? 'Forgot Password?' : 'Back to Login'}
        </button>
        {role !== 'HUSU_OWNER' && mode === 'LOGIN' && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">New here?</span>
            <button
              onClick={() => setMode('SIGN_UP')}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
            >
              Verify Enrollment
              <UserPlus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
