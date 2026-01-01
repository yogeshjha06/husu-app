'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Download, Eye, ShieldCheck, Sparkles, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { CertificateOverlay } from '@/components/employee/certificate-overlay'

interface Certificate {
  id: string
  form_id: string
  form_name: string
  issued_at: string
  certificate_url: string
}

export default function CertificatesPage() {
  const { userProfile } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    try {
      const res = await fetch('/api/employee/certificates', { credentials: 'include' })
      if (res.ok) {
        const { data } = await res.json()
        setCertificates(data)
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
      toast.error('Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-10 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/5 border border-slate-900/10">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recognition Core</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Your <span className="text-blue-600">Achievements</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-xl">
            Verify your industry-standard sustainability expertise and download your earned certifications.
          </p>
        </div>

        <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-3xl">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 leading-none mb-1">Authenticated</p>
              <p className="text-3xl font-black text-slate-900 leading-none">{certificates.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white border-2 border-slate-100 animate-pulse rounded-[2.5rem]" />
          ))}
        </div>
      ) : certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certificates.map((cert) => (
            <Card key={cert.id} className="group hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 border-none rounded-[3rem] overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] flex items-center justify-center mb-8 overflow-hidden shadow-2xl">
                  <Award className="w-24 h-24 text-blue-500 opacity-20 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-6 right-6">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-blue-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white opacity-40 mb-1">Verified Credential</p>
                    <p className="text-[10px] font-black uppercase text-white truncate">HUSU-CERT-{cert.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic leading-tight truncate">{cert.form_name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-500 pl-3">
                    Verified On {new Date(cert.issued_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <Button
                    onClick={() => setSelectedCert(cert)}
                    variant="outline"
                    className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-slate-100 hover:border-blue-600 hover:bg-transparent hover:text-blue-600 transition-all"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-900/20"
                    onClick={() => {
                      setSelectedCert(cert)
                      // Handle download will be triggered inside the overlay
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-4 border-dashed border-slate-200 bg-white/50 py-32 text-center rounded-[3.5rem] shadow-inner max-w-4xl mx-auto">
          <CardContent className="space-y-8">
            <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-12 h-12 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Your Wall of <span className="text-blue-600">Fame</span></h3>
              <p className="text-slate-500 text-lg font-medium max-w-sm mx-auto leading-relaxed">
                Complete your assigned sustainability journeys and interactive simulations to earn verified industry certificates.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCert && (
        <CertificateOverlay
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
          formName={selectedCert.form_name}
          userName={`${userProfile?.first_name} ${userProfile?.last_name}`}
          certificateId={selectedCert.form_id}
          issuedAt={selectedCert.issued_at}
        />
      )}
    </div>
  )
}
