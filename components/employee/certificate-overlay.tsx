'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Award, Download, X, ShieldCheck, Sparkles, Star, CheckCircle2, Medal, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface CertificateOverlayProps {
    isOpen: boolean
    onClose: () => void
    formName: string
    userName: string
    certificateId: string
    issuedAt?: string
}

export function CertificateOverlay({ isOpen, onClose, formName, userName, certificateId, issuedAt }: CertificateOverlayProps) {
    const [orgData, setOrgData] = useState<{ name: string; logo_url: string } | null>(null)
    const certRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            fetch('/api/employee/organization')
                .then(res => res.json())
                .then(data => setOrgData(data.data))
                .catch(err => console.error('Failed to fetch org logo', err))
        }
    }, [isOpen])

    const handleDownload = async () => {
        if (!certRef.current) return;

        try {
            // Temporarily remove shadow for clean capture
            const element = certRef.current;
            const originalShadow = element.style.boxShadow;
            element.style.boxShadow = 'none';

            const canvas = await html2canvas(element, {
                scale: 3, // Even higher quality
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            });

            // Restore shadow
            element.style.boxShadow = originalShadow;

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`HUSU_Certificate_${formName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Failed to generate PDF', error);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-transparent"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 40 }}
                        className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-3xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] flex flex-col border border-slate-100"
                    >
                        {/* Compact Header/Toolbar (Hidden on Print) */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white print:hidden">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                                    <Award className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic leading-none">Certificate <span className="text-blue-500">Preview</span></h2>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">HUSU Verification</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleDownload}
                                    className="bg-slate-900 hover:bg-black text-white rounded-xl h-9 px-5 font-black uppercase tracking-widest text-[8px] shadow-sm transition-all hover:scale-105"
                                >
                                    <Download className="w-3 h-3 mr-2" />
                                    Download PDF
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl w-9 h-9 p-0 border border-slate-100"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Print Styles */}
                        <style jsx global>{`
                            @media print {
                                body * {
                                    visibility: hidden;
                                }
                                .printable-certificate-outer, .printable-certificate-outer * {
                                    visibility: visible;
                                }
                                .printable-certificate-outer {
                                    position: fixed;
                                    left: 0;
                                    top: 0;
                                    width: 100vw;
                                    height: 100vh;
                                    padding: 0;
                                    margin: 0;
                                    background: white !important;
                                    display: flex !important;
                                    align-items: center;
                                    justify-content: center;
                                }
                                @page {
                                    size: landscape;
                                    margin: 0;
                                }
                            }
                        `}</style>

                        {/* Certificate Preview Scroller */}
                        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 md:p-12 lg:p-16 flex items-start justify-center">
                            <div className="printable-certificate-outer w-full max-w-[850px] scale-[0.8] lg:scale-95 transition-transform duration-700 origin-top">
                                <div
                                    ref={certRef}
                                    className="printable-certificate aspect-[1.414/1] w-full bg-white relative flex flex-col justify-between overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)]"
                                    style={{
                                        padding: '4rem'
                                    }}
                                >
                                    {/* Minimalist Black/Slate Frame */}
                                    <div className="absolute inset-0 border-[8px] border-slate-900 pointer-events-none" />
                                    <div className="absolute inset-[8px] border-[1px] border-slate-200 pointer-events-none" />
                                    <div className="absolute inset-[12px] border-[1px] border-slate-100 pointer-events-none" />

                                    {/* Elite metallic trim lines - Subdued for minimal look */}
                                    <div className="absolute inset-[18px] border-[1px] border-slate-900/10 pointer-events-none" />
                                    <div className="absolute inset-[24px] border-[1px] border-slate-900/5 pointer-events-none" />

                                    {/* Watermark Pattern */}
                                    <div className="absolute inset-0 opacity-[0.012] pointer-events-none grid grid-cols-3 gap-x-64 gap-y-48 p-20 rotate-[-15deg] scale-125">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <h1 key={i} className="text-4xl font-black uppercase text-slate-900 tracking-widest">HUSU </h1>
                                        ))}
                                    </div>

                                    {/* Header Section */}
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                                                    <ShieldCheck className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">HUSU</span>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mt-2">Systems</span>
                                                </div>
                                                <div className="h-px w-20 bg-slate-200 ml-6 self-center" />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-400 mb-1">Credential Identification</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xs font-black text-slate-930">ID: HUSU-AUTH-{certificateId.substring(0, 10).toUpperCase()}</p>
                                                    {issuedAt && (
                                                        <>
                                                            <div className="w-[1px] h-3 bg-slate-200" />
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                                {new Date(issuedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-3 text-right">
                                            {orgData?.logo_url ? (
                                                <img src={orgData.logo_url} className="h-10 w-auto grayscale contrast-125 object-contain" alt="Org Logo" />
                                            ) : (
                                                <div className="h-10 px-4 border-2 border-slate-900 flex items-center justify-center font-black text-[10px] uppercase italic">
                                                    {orgData?.name || 'Partner Org'}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Industry Standard</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content Section */}
                                    <div className="relative z-10 text-center flex-1 flex flex-col justify-center py-2">
                                        <div className="space-y-2 mb-1">
                                            <h4 className="text-[11px] font-black uppercase tracking-[1em] text-blue-600 mb-2">Certificate of Achievement</h4>
                                            <div className="flex items-center justify-center gap-6">
                                                <div className="h-[2px] w-6 bg-slate-100" />
                                                <p className="text-slate-400 font-serif italic text-base">Presenting this award to</p>
                                                <div className="h-[2px] w-6 bg-slate-100" />
                                            </div>
                                        </div>

                                        <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic py-8 w-full px-4 leading-[1.2] flex items-center justify-center">
                                            {userName}
                                        </h3>

                                        <div className="space-y-2">
                                            <p className="text-slate-400 font-serif italic text-base leading-relaxed">
                                                For demonstrating exceptional proficiency and dedication while finalizing the
                                            </p>
                                            <div className="relative inline-block px-12 py-3 border-y-[1.5px] border-slate-900">
                                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{formName}</h2>
                                                <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-slate-900 -translate-x-1/2 -translate-y-1/2" />
                                                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-slate-900 translate-x-1/2 -translate-y-1/2" />
                                                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-slate-900 -translate-x-1/2 translate-y-1/2" />
                                                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-slate-900 translate-x-1/2 translate-y-1/2" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Section */}
                                    <div className="relative z-10 flex justify-between items-end gap-2 pb-2">
                                        <div className="flex-1">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 italic">Platform Authority</span>
                                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">HUSU Systems Intelligence</span>
                                            </div>
                                        </div>

                                        <div className="flex-[0.5] relative group flex flex-col items-center justify-end pb-1">
                                            <div className="relative flex flex-col items-center">
                                                <div className="border-[3px] border-slate-900/5 p-0.5 rounded-full mb-2">
                                                    <div className="border-[1.5px] border-blue-600 p-1.5 rounded-full bg-blue-50/30">
                                                        <BadgeCheck className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                </div>
                                                <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Verified Document</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 text-right">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 italic">{orgData?.name || 'Strategic Partner'}</span>
                                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">Authorized Endorser</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
