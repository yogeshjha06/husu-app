'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Play,
    FileText,
    Headphones,
    MonitorPlay,
    X,
    Download,
    Clock,
    Search,
    BookOpen,
    Filter,
    Maximize2,
    Sparkles
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Resource {
    _id: string
    title: string
    type: 'YOUTUBE' | 'PODCAST' | 'PDF' | 'VIDEO_UPLOAD'
    description: string
    url: string
    thumbnail: string
    duration?: string
    size?: string
    author: string
}

const ResourceIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'YOUTUBE':
        case 'VIDEO_UPLOAD':
            return <MonitorPlay className="w-5 h-5" />
        case 'PODCAST':
            return <Headphones className="w-5 h-5" />
        case 'PDF':
            return <FileText className="w-5 h-5" />
        default:
            return <BookOpen className="w-5 h-5" />
    }
}

export default function EmployeeResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([])
    const [activeTab, setActiveTab] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
    const [loading, setLoading] = useState(true)

    // Pagination State
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        totalPages: 1,
        total: 0
    })

    useEffect(() => {
        fetchResources(pagination.page)
    }, [pagination.page])

    const filteredResources = resources.filter(r => {
        const matchTab = activeTab === 'ALL'
            ? true
            : activeTab === 'VIDEO' ? (r.type === 'YOUTUBE' || r.type === 'VIDEO_UPLOAD')
                : activeTab === 'AUDIO' ? r.type === 'PODCAST'
                    : activeTab === 'DOCS' ? r.type === 'PDF'
                        : true

        const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description.toLowerCase().includes(searchQuery.toLowerCase())

        return matchTab && matchSearch
    })

    const fetchResources = async (page: number) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/employee/resources?page=${page}&limit=${pagination.limit}`)
            if (res.ok) {
                const json = await res.json()
                setResources(json.data)
                if (json.pagination) {
                    setPagination(prev => ({ ...prev, ...json.pagination }))
                }
            }
        } catch (error) {
            console.error('Failed to fetch resources')
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }))
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'YOUTUBE':
            case 'VIDEO_UPLOAD':
                return 'bg-red-500/10 text-red-500 border-red-500/20'
            case 'PODCAST':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
            case 'PDF':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            default:
                return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
        }
    }

    const getYouTubeEmbedUrl = (url: string) => {
        try {
            let videoId = '';
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else if (url.includes('watch?v=')) {
                videoId = url.split('watch?v=')[1]?.split('&')[0];
            } else if (url.includes('embed/')) {
                return url;
            }

            if (videoId) return `https://www.youtube.com/embed/${videoId}`;
            return url;
        } catch (e) { return url; }
    }

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-600/20 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Growth Center</span>
                        </div>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                        Learning Resources
                    </h1>
                    <p className="text-slate-500 text-lg font-medium max-w-2xl">
                        Access curated materials for your professional development and well-being.
                    </p>
                </motion.div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    {['ALL', 'VIDEO', 'AUDIO', 'DOCS'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search & Grid */}
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search resources by title or description..."
                        className="h-14 pl-12 rounded-2xl border-none shadow-sm shadow-slate-200 bg-white font-medium italic text-slate-600"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="h-80 bg-white rounded-[2rem] animate-pulse shadow-sm" />
                        ))
                    ) : filteredResources.length > 0 ? (
                        filteredResources.map((resource, index) => (
                            <motion.div
                                key={resource._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedResource(resource)}
                            >
                                <Card className="group border-none rounded-[2rem] bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer h-full shadow-lg shadow-slate-200/50">
                                    <div className="relative h-48 overflow-hidden">
                                        {resource.thumbnail ? (
                                            <img
                                                src={resource.thumbnail}
                                                alt={resource.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center ${resource.type === 'PDF' ? 'bg-blue-50' : 'bg-slate-100'
                                                }`}>
                                                <ResourceIcon type={resource.type} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                        <div className="absolute top-4 right-4 z-10">
                                            <div className={`w-10 h-10 rounded-xl backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl ${resource.type.includes('VIDEO') || resource.type === 'YOUTUBE' ? 'bg-red-600 text-white' :
                                                resource.type === 'PODCAST' ? 'bg-purple-600 text-white' :
                                                    'bg-blue-600 text-white'
                                                }`}>
                                                <ResourceIcon type={resource.type} />
                                            </div>
                                        </div>

                                        {(resource.type.includes('VIDEO') || resource.type === 'YOUTUBE' || resource.type === 'PODCAST') && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                                                    <Play className="w-6 h-6 text-white fill-current" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute bottom-4 right-4">
                                            <span className="px-2 py-1 rounded-md bg-black/50 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest border border-white/10">
                                                {resource.duration || resource.size || 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                    {resource.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                                    {resource.description}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <span className="text-[10px] font-black text-slate-600">{(resource.author || 'H')[0]}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate max-w-[100px]">{resource.author || 'HUSU'}</span>
                                                </div>
                                                <Badge variant="outline" className={`${getTypeColor(resource.type)} border bg-opacity-50`}>
                                                    {resource.type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-6 h-6 text-slate-400" />
                            </div>
                            <h3 className="text-slate-900 font-bold">No resources found</h3>
                            <p className="text-slate-500 text-sm">Learning materials will appear here once they are available.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-12 pb-8">
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                            className="rounded-xl border-slate-200"
                        >
                            Previous
                        </Button>
                        <span className="text-sm font-bold text-slate-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || loading}
                            className="rounded-xl border-slate-200"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            {/* Premium Glass Modal */}
            <AnimatePresence>
                {selectedResource && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
                    >
                        <div
                            className="absolute inset-0"
                            onClick={() => setSelectedResource(null)}
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-5xl bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-8 border-b border-slate-200/50 bg-white/40">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <Badge className={`${getTypeColor(selectedResource.type)} border bg-opacity-50`}>
                                            {selectedResource.type}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {selectedResource.duration || selectedResource.size}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 italic tracking-tight">{selectedResource.title}</h2>
                                </div>

                                <div className="flex items-center gap-3">
                                    {selectedResource.type === 'PDF' && (
                                        <Button className="rounded-xl bg-slate-900 text-white hover:bg-black font-bold uppercase tracking-widest text-[10px] h-10">
                                            <Download className="w-4 h-4 mr-2" /> Download
                                        </Button>
                                    )}
                                    <button
                                        onClick={() => setSelectedResource(null)}
                                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-0 relative">
                                {selectedResource.type === 'YOUTUBE' ? (
                                    <div className="w-full aspect-video bg-black">
                                        <iframe
                                            src={getYouTubeEmbedUrl(selectedResource.url)}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                ) : selectedResource.type === 'VIDEO_UPLOAD' ? (
                                    <div className="w-full aspect-video bg-black flex items-center justify-center">
                                        <video
                                            controls
                                            autoPlay
                                            className="w-full h-full max-h-[60vh] object-contain"
                                            src={selectedResource.url}
                                        />
                                    </div>
                                ) : selectedResource.type === 'PODCAST' ? (
                                    <div className="p-10 flex flex-col items-center justify-center space-y-8 min-h-[400px] relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5" />

                                        <div className="relative z-10 w-64 h-64 rounded-[2rem] overflow-hidden shadow-2xl shadow-purple-500/20">
                                            <img src={selectedResource.thumbnail} className="w-full h-full object-cover" />
                                        </div>

                                        <div className="relative z-10 w-full max-w-2xl bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg">
                                            <audio controls className="w-full" src={selectedResource.url} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-10 bg-slate-100 min-h-[500px] flex items-center justify-center">
                                        <div className="bg-white p-12 rounded-[2rem] shadow-xl text-center max-w-md space-y-6">
                                            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-10 h-10 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900">Document Preview</h3>
                                                <p className="text-sm text-slate-500 mt-2">This protected document is ready for secure viewing.</p>
                                            </div>
                                            <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => window.open(selectedResource.url, '_blank')}>
                                                OPEN VIEWER
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-white border-t border-slate-100">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Description</h4>
                                <p className="text-slate-600 leading-relaxed text-sm">{selectedResource.description}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
