'use client'

import { useState, useEffect } from 'react'
import { Menu, Bell, Settings, LogOut, CheckCircle, Smartphone, ShieldCheck, Save, X, Loader2 } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

interface HeaderProps {
  onMenuClick: () => void
  role: 'admin' | 'org-admin' | 'employee'
}

export function Header({ onMenuClick, role }: HeaderProps) {
  const { userProfile, signOut, refreshUser } = useAuth()
  const router = useRouter()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Profile Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  })

  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [tempSecret, setTempSecret] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (userProfile) {
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        email: userProfile.email || ''
      })
      setIs2FAEnabled(!!userProfile.two_factor_enabled)
    }
    // Deep reset of UI states when dialog opens/refreshes
    setShowQR(false)
    setOtpToken('')
  }, [userProfile, isSettingsOpen])

  const handleSignOut = async () => {
    await signOut()
  }

  const getInitials = () => {
    if (!userProfile) return 'U'
    return `${userProfile.first_name?.[0] || ''}${userProfile.last_name?.[0] || ''}`.toUpperCase()
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success('Identity record synchronized.')
        await refreshUser()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to sync record.')
      }
    } catch (err) {
      toast.error('Connection intercept. Profile update failed.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle2FA = async (checked: boolean) => {
    if (checked) {
      // Initiate 2FA Enable Flow
      try {
        const res = await fetch('/api/auth/2fa/generate', { method: 'POST' })
        const data = await res.json()
        if (res.ok) {
          setQrCode(data.qrCode)
          setTempSecret(data.secret)
          setShowQR(true)
        }
      } catch (err) {
        toast.error('Failed to generate 2FA handshake.')
      }
    } else {
      // Show Disable Confirmation/Dialog (For now just prompt for OTP if we wanted to be secure, 
      // but let's just allow toggling off or require one last OTP verification)
      const token = prompt('Enter your 6-digit code to disable security protocols:')
      if (token) {
        verifyAndToggle2FA(token, 'DISABLE')
      }
    }
  }

  const verifyAndToggle2FA = async (token: string, action: 'ENABLE' | 'DISABLE') => {
    setVerifying(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          secret: action === 'ENABLE' ? tempSecret : undefined,
          action
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Security protocols ${action === 'ENABLE' ? 'fortified' : 'decommissioned'}.`)
        setIs2FAEnabled(action === 'ENABLE')
        setShowQR(false)
        setOtpToken('')
        await refreshUser()
      } else {
        toast.error(data.error || 'Verification failed.')
      }
    } catch (err) {
      toast.error('Signal lost. Verification failed.')
    } finally {
      setVerifying(false)
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
          {role === 'admin' ? 'HUSU Admin' : role === 'org-admin' ? 'Organisation Admin' : 'Employee'} <span className="text-blue-600">Portal</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative group">
          <Bell className="w-5 h-5 text-slate-600 transition-colors group-hover:text-blue-600" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-200 text-slate-700 font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-slate-700">
                {userProfile?.first_name} {userProfile?.last_name}
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-50" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl mt-2 border-slate-100">
            <DropdownMenuLabel className="px-4 py-3">
              <div className="flex flex-col">
                <span className="flex items-center gap-1.5 font-bold">
                  {userProfile?.first_name} {userProfile?.last_name}
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />
                </span>
                <span className="text-xs text-slate-500">{userProfile?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-2" />

            <DropdownMenuItem
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 rounded-xl cursor-pointer text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3" />
              <span className="text-[11px] font-black uppercase tracking-widest">Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="mx-2" />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="p-3 rounded-xl cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl bg-slate-50 scrollbar-hide">
          <div className="flex flex-col min-h-full">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden sticky top-0 z-50">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="relative z-10">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-1">Mission Control</DialogTitle>
                <DialogDescription className="text-blue-400 font-bold text-[10px] uppercase tracking-widest">Global Identity & Security Settings</DialogDescription>
              </div>
              <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} className="text-white hover:bg-white/10 rounded-xl relative z-10">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-10 space-y-10 flex-1">
              {/* Profile Section */}
              <form onSubmit={handleUpdateProfile} className="space-y-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none">Identity Profile</h3>
                    <p className="text-[10px] font-medium text-slate-400">Update your primary HUSU mission credentials.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</Label>
                    <Input
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="First Name"
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</Label>
                    <Input
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Last Name"
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mission Email Address</Label>
                  <Input
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    type="email"
                    placeholder="name@organization.com"
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-2 focus-visible:ring-blue-600"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Synchronize Identity Record
                </Button>
              </form>

              {/* Security Section */}
              <div className="space-y-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none">Two-Factor Authentication</h3>
                      <p className="text-[10px] font-medium text-slate-400">Add an extra layer of encryption to your login.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${is2FAEnabled ? 'text-green-600' : 'text-slate-400'}`}>
                      {is2FAEnabled ? 'Fortified' : 'Vulnerable'}
                    </span>
                    <Switch
                      checked={is2FAEnabled || showQR}
                      onCheckedChange={handleToggle2FA}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>

                {showQR && (
                  <div className="pt-6 border-t border-slate-50 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-600/5 opacity-50" />
                      <div className="w-40 h-40 bg-white p-4 rounded-2xl shrink-0 shadow-2xl relative z-10 transition-transform hover:scale-105 duration-500">
                        <img src={qrCode} alt="2FA QR Code" className="w-full h-full" />
                      </div>
                      <div className="space-y-4 relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          Scanning Required
                        </h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                          Open your <span className="text-white font-bold italic underline decoration-blue-500/50">Authenticator App</span> (Google/Microsoft) and scan the visual vector to link your HUSU profile.
                        </p>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Manual Entry String</p>
                          <p className="text-xs font-mono font-bold tracking-widest text-blue-400 break-all">{tempSecret}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Enter Verification Token</Label>
                      <InputOTP
                        maxLength={6}
                        value={otpToken}
                        onChange={setOtpToken}
                        onComplete={(val) => verifyAndToggle2FA(val, 'ENABLE')}
                      >
                        <InputOTPGroup className="gap-2">
                          {[0, 1, 2, 3, 4, 5].map(i => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className="w-12 h-14 rounded-xl bg-white border-2 border-blue-100 font-black text-xl text-slate-900 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Awaiting 6-digit cryptographic handshake...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
