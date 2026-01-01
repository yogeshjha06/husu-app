'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Smartphone, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { useAuth } from '@/lib/auth/auth-context'

function Verify2FAContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { refreshUser } = useAuth()

    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const role = searchParams.get('role')

    const [otpToken, setOtpToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!userId) {
            router.push('/login')
        }
    }, [userId, router])

    const handleVerify = async (token: string) => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    userId,
                    action: 'LOGIN_VERIFY'
                })
            })

            const data = await res.json()
            if (res.ok) {
                toast.success('Identity Verified. Access Granted.')
                await refreshUser()

                // Redirect based on role
                if (role === 'HUSU_OWNER') {
                    router.push('/admin/dashboard')
                } else if (role === 'ORG_ADMIN') {
                    router.push('/org-admin/dashboard')
                } else if (role === 'EMPLOYEE') {
                    router.push('/employee/tasks')
                } else {
                    router.push('/')
                }
            } else {
                setError(data.error || 'Invalid 2FA code')
            }
        } catch (err) {
            setError('Signal lost. Verification failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Visual Identity */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -ml-64 -mb-64" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="mb-6 inline-flex p-4 rounded-[2rem] bg-slate-900 shadow-2xl shadow-slate-900/20">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Security <span className="text-blue-600">Checkpoint</span></h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-4">
                        Identity verification required for <span className="text-slate-900 italic underline decoration-blue-500/30">{email}</span>
                    </p>
                </div>

                <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="p-10">
                        <div className="flex flex-col items-center space-y-8">
                            <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-blue-600/10 rounded-[2rem] animate-ping opacity-20" />
                                <Smartphone className="w-10 h-10 text-blue-600 relative z-10" />
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-xl font-black text-slate-900 uppercase italic">Enter Secure Key</h2>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">
                                    Open your <span className="text-slate-900 font-bold italic underline decoration-blue-500/30">Authenticator App</span> and provide the 6-digit cryptographic token.
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50 text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="font-bold text-[10px] uppercase tracking-widest">{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex flex-col items-center space-y-4 w-full">
                                <InputOTP
                                    maxLength={6}
                                    value={otpToken}
                                    onChange={setOtpToken}
                                    onComplete={handleVerify}
                                    disabled={loading}
                                >
                                    <InputOTPGroup className="gap-2 sm:gap-3">
                                        {[0, 1, 2, 3, 4, 5].map(i => (
                                            <InputOTPSlot
                                                key={i}
                                                index={i}
                                                className="w-12 h-16 sm:w-14 sm:h-18 rounded-2xl bg-white border-2 border-blue-100 font-black text-2xl text-slate-900 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                                            />
                                        ))}
                                    </InputOTPGroup>
                                </InputOTP>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">Awaiting Handshake...</p>
                                </div>
                            </div>

                            <Button
                                onClick={() => handleVerify(otpToken)}
                                disabled={loading || otpToken.length !== 6}
                                className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Execute Identity Verification</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-4">
                    <button onClick={() => router.push('/login')} className="hover:text-blue-600 transition-colors">Abort Mission</button>
                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                    <button onClick={() => window.location.reload()} className="hover:text-blue-600 transition-colors">Re-sync Signal</button>
                </div>
            </div>
        </div>
    )
}

export default function Verify2FAPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-6">Initializing Handshake Terminal...</p>
            </div>
        }>
            <Verify2FAContent />
        </Suspense>
    )
}
