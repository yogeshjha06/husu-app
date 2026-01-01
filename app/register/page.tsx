'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Building2, Mail, Phone, Users, Globe, Briefcase, CheckCircle2, Lock, Upload, Image as ImageIcon, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RegistrationPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [uploading, setUploading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        size: '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        countryOfOperation: '',
        website: '',
        logoUrl: '',
        privacyAccepted: false,
        termsAccepted: false,
    })

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const uploadData = new FormData()
        uploadData.append('file', file)
        uploadData.append('type', 'org-logo')

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: uploadData,
            })
            if (res.ok) {
                const data = await res.json()
                setFormData(prev => ({ ...prev, logoUrl: data.path }))
            }
        } catch (err) {
            console.error('Logo upload failed')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.privacyAccepted || !formData.termsAccepted) {
            setError('Please accept the Privacy Policy and Terms & Conditions')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/register-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (res.ok) {
                setSuccess(true)
            } else {
                setError(data.error || 'Registration failed')
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 animate-in zoom-in duration-300">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</CardTitle>
                    <CardDescription className="text-slate-600 mb-8">
                        Thank you for choosing HUSU. Our team will review your application and contact you at <strong>{formData.adminEmail}</strong> to finalize your account setup.
                    </CardDescription>
                    <Button asChild className="w-full h-12 text-lg">
                        <Link href="/login">Go to Login</Link>
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex">
            {/* Left Side - Info */}
            <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden text-balance">
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white font-bold text-xl">H</span>
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">HUSU</span>
                    </Link>

                    <h1 className="text-6xl font-black text-white leading-tight mb-6">
                        Empower Your <span className="text-blue-500">People</span>.<br />
                        Define Your <span className="text-purple-500">Industry</span>.
                    </h1>
                    <p className="text-xl text-slate-400 max-w-lg mb-12">
                        The all-in-one Human Sustainability Platform designed to measure, analyze, and improve your organization's most valuable asset: its people.
                    </p>

                    <div className="space-y-6">
                        {[
                            { icon: CheckCircle2, text: 'Customizable Survey Frameworks' },
                            { icon: CheckCircle2, text: 'Real-time KPI Dashboards' },
                            { icon: CheckCircle2, text: 'AI-Powered Insights' },
                            { icon: CheckCircle2, text: 'End-to-End PII Encryption' },
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-300">
                                <feature.icon className="w-5 h-5 text-blue-500" />
                                <span className="text-lg font-medium">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Abstract Background Decor */}
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]" />

                <div className="relative z-10 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0f172a] bg-slate-800" />
                            ))}
                        </div>
                        <p className="text-sm text-slate-400">
                            Trusted by <span className="text-white font-semibold">500+ Organizations</span> globally
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-widest">ISO 27001 Certified</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 p-6 md:p-12 lg:p-24 flex items-center justify-center bg-white overflow-y-auto">
                <div className="w-full max-w-md space-y-8 my-10">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-8">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">H</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900 tracking-tight">HUSU</span>
                            </Link>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Register Your Organization</h2>
                        <p className="text-slate-500 mt-2">Get started with the HUSU platform today.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 animate-in fade-in duration-300">
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            {/* Organization Info Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-900">Organization Details</h3>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="org-name" className="text-slate-700 font-semibold px-1">Organization Name</Label>
                                    <Input
                                        id="org-name"
                                        placeholder="Acme Corp"
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="industry" className="text-slate-700 font-semibold px-1">Industry</Label>
                                        <Select onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="technology">Technology</SelectItem>
                                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                                <SelectItem value="finance">Finance</SelectItem>
                                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                                <SelectItem value="education">Education</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="size" className="text-slate-700 font-semibold px-1">Organization Size</Label>
                                        <Select onValueChange={(v) => setFormData({ ...formData, size: v })}>
                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1-50">1-50 employees</SelectItem>
                                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                                <SelectItem value="201-1000">201-1000 employees</SelectItem>
                                                <SelectItem value="1000+">1000+ employees</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="country" className="text-slate-700 font-semibold px-1">Country of Operation</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="country"
                                            placeholder="e.g. United Kingdom"
                                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                            value={formData.countryOfOperation}
                                            onChange={(e) => setFormData({ ...formData, countryOfOperation: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold px-1">Organization Logo</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                            {formData.logoUrl ? (
                                                <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <Label htmlFor="logo-upload" className="cursor-pointer">
                                                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 py-2 px-4 rounded-lg w-fit">
                                                    <Upload className="w-4 h-4" />
                                                    <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                                                </div>
                                                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                                            </Label>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Square aspect ratio recommended</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Info Section */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-900">Administrator Profile</h3>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="admin-name" className="text-slate-700 font-semibold px-1">Full Name</Label>
                                    <Input
                                        id="admin-name"
                                        placeholder="John Doe"
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                        required
                                        value={formData.adminName}
                                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="admin-email" className="text-slate-700 font-semibold px-1">Email Address</Label>
                                        <Input
                                            id="admin-email"
                                            type="email"
                                            placeholder="admin@org.com"
                                            className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                            required
                                            value={formData.adminEmail}
                                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone" className="text-slate-700 font-semibold px-1">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+44 ..."
                                            className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                            value={formData.adminPhone}
                                            onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Legal Section */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        id="terms"
                                        checked={formData.termsAccepted}
                                        onCheckedChange={(checked) => setFormData({ ...formData, termsAccepted: checked === true })}
                                        className="mt-1 border-slate-300"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="terms" className="text-sm font-medium text-slate-600 leading-normal">
                                            Accept <Link href="#" className="text-blue-600 font-bold hover:underline">Terms & Conditions</Link>. I understand how my data will be managed.
                                        </Label>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        id="privacy"
                                        checked={formData.privacyAccepted}
                                        onCheckedChange={(checked) => setFormData({ ...formData, privacyAccepted: checked === true })}
                                        className="mt-1 border-slate-300"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="privacy" className="text-sm font-medium text-slate-600 leading-normal">
                                            Accept <Link href="#" className="text-blue-600 font-bold hover:underline">Privacy Policy</Link>. I consent to the use of cookies and encryption standards.
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg rounded-xl shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 transition-all font-bold mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Complete Registration'}
                        </Button>

                        <div className="text-center pb-10">
                            <p className="text-sm text-slate-500">
                                Already have an account? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign In</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
