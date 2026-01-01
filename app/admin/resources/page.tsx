'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Search, Plus, Trash2, FileText, Video, Mic,
  Upload, Youtube, Link as LinkIcon, Image as ImageIcon, Loader2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Resource {
  _id: string
  title: string
  description: string
  type: 'YOUTUBE' | 'VIDEO_UPLOAD' | 'PODCAST' | 'PDF'
  url: string
  thumbnail?: string
  duration?: string
  size?: string
  created_at: string
  author?: string
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [loading, setLoading] = useState(true)

  // Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)

  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'YOUTUBE',
    url: '',
    thumbnail: '',
    duration: '',
    size: ''
  })

  useEffect(() => {
    fetchResources()
  }, [])

  useEffect(() => {
    filterResources()
  }, [searchTerm, activeTab, resources])

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/admin/resources')
      if (res.ok) {
        const { data } = await res.json()
        setResources(data)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  const filterResources = () => {
    let temp = resources

    if (activeTab !== 'ALL') {
      if (activeTab === 'VIDEO') temp = temp.filter(r => r.type === 'YOUTUBE' || r.type === 'VIDEO_UPLOAD')
      if (activeTab === 'AUDIO') temp = temp.filter(r => r.type === 'PODCAST')
      if (activeTab === 'DOCS') temp = temp.filter(r => r.type === 'PDF')
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      temp = temp.filter(r => r.title.toLowerCase().includes(lower) || r.author?.toLowerCase().includes(lower))
    }

    setFilteredResources(temp)
  }

  const handleFileUpload = async (file: File, field: 'url' | 'thumbnail') => {
    const isThumb = field === 'thumbnail'
    if (isThumb) setUploadingThumb(true)
    else setUploadingFile(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', isThumb ? 'resource-thumb' : 'resource-file')

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setNewResource(prev => ({ ...prev, [field]: data.path }))

        // Auto-detect size for main file
        if (!isThumb) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB'
          setNewResource(prev => ({ ...prev, size: sizeMB }))
        }

      } else {
        toast.error('Upload failed')
      }
    } catch (e) {
      toast.error('Upload error')
    } finally {
      if (isThumb) setUploadingThumb(false)
      else setUploadingFile(false)
    }
  }

  const handleSubmit = async () => {
    if (!newResource.title || !newResource.url) {
      toast.error('Please complete required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource)
      })

      if (res.ok) {
        toast.success('Resource created successfully')
        setIsAddOpen(false)
        setNewResource({ title: '', description: '', type: 'YOUTUBE', url: '', thumbnail: '', duration: '', size: '' })
        fetchResources()
      } else {
        toast.error('Failed to create resource')
      }
    } catch (e) {
      toast.error('Server error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      const res = await fetch(`/api/admin/resources?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Deleted successfully')
        fetchResources()
      }
    } catch (e) {
      toast.error('Delete failed')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'YOUTUBE': return <Youtube className="w-5 h-5 text-red-600" />
      case 'VIDEO_UPLOAD': return <Video className="w-5 h-5 text-blue-600" />
      case 'PODCAST': return <Mic className="w-5 h-5 text-purple-600" />
      case 'PDF': return <FileText className="w-5 h-5 text-orange-600" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Resource Library</h1>
          <p className="text-slate-500 font-medium text-lg mt-2">Manage educational content and assets.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-900/20">
              <Plus className="w-5 h-5 mr-2" />
              New Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-2xl font-black">Add New Resource</DialogTitle>
              <DialogDescription>
                Upload or link educational content for your organization partners.
              </DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Form */}
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Q1 Wellness Guide"
                  value={newResource.title}
                  onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Resource Type</Label>
                <Select
                  value={newResource.type}
                  onValueChange={(v: any) => setNewResource({ ...newResource, type: v, url: '' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YOUTUBE">YouTube Video</SelectItem>
                    <SelectItem value="VIDEO_UPLOAD">Video File Upload</SelectItem>
                    <SelectItem value="PODCAST">Audio/Podcast</SelectItem>
                    <SelectItem value="PDF">PDF Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic URL/Upload Field */}
              <div className="grid gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Label className="mb-2">Content Source</Label>
                {newResource.type === 'YOUTUBE' ? (
                  <div className="relative">
                    <Youtube className="absolute left-3 top-3 w-5 h-5 text-red-500" />
                    <Input
                      className="pl-10"
                      placeholder="https://youtube.com/watch?v=..."
                      value={newResource.url}
                      onChange={e => setNewResource({ ...newResource, url: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer relative group">
                      <input
                        type="file"
                        accept={newResource.type === 'PDF' ? 'application/pdf' : 'video/*,audio/*'}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'url')}
                      />
                      {uploadingFile ? (
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      ) : newResource.url ? (
                        <div className="flex items-center gap-2 text-green-600 font-bold">
                          <FileText className="w-5 h-5" />
                          File Uploaded
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-300 mb-2 group-hover:text-blue-500 transition-colors" />
                          <p className="text-sm font-bold text-slate-600">Click to upload file</p>
                          <p className="text-xs text-slate-400">
                            {newResource.type === 'PDF' ? 'PDF Documents only' : 'MP4, MP3, WAV supported'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {newResource.type === 'PDF' && (
                  <Input
                    placeholder="Size label (e.g. 2.4 MB)"
                    value={newResource.size}
                    onChange={e => setNewResource({ ...newResource, size: e.target.value })}
                    className="mt-2"
                  />
                )}
                {(newResource.type === 'VIDEO_UPLOAD' || newResource.type === 'PODCAST') && (
                  <Input
                    placeholder="Duration (e.g. 14:20)"
                    value={newResource.duration}
                    onChange={e => setNewResource({ ...newResource, duration: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label>Thumbnail Image</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                    {newResource.thumbnail ? (
                      <img src={newResource.thumbnail} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="thumb-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-bold">
                      {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Thumbnail
                    </Label>
                    <input id="thumb-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'thumbnail')} />
                    <p className="text-xs text-slate-400 mt-2">Recommended: 16:9 aspect ratio</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief summary of the content..."
                  value={newResource.description}
                  onChange={e => setNewResource({ ...newResource, description: e.target.value })}
                />
              </div>
            </div>
            <div className="p-8 pt-0 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting || uploadingFile || uploadingThumb} className="bg-blue-600 hover:bg-blue-700">
                {submitting ? 'Creating...' : 'Create Resource'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl w-fit shadow-sm border border-slate-100">
        {['ALL', 'VIDEO', 'AUDIO', 'DOCS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black tracking-widest transition-all",
              activeTab === tab ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          className="pl-12 h-14 bg-white border-transparent focus:border-blue-500 focus:ring-0 rounded-2xl shadow-sm text-lg"
          placeholder="Search resources by title..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map(resource => (
            <div key={resource._id} className="group bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col">
              {/* Thumbnail */}
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                {resource.thumbnail ? (
                  <img src={resource.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                  {getTypeIcon(resource.type)}
                  <span>{resource.type.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-slate-900 leading-tight mb-2 line-clamp-2">{resource.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1">{resource.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="text-xs font-medium text-slate-400">
                    {format(new Date(resource.created_at), 'MMM d, yyyy')}
                    {resource.duration && <span className="mx-2">• {resource.duration}</span>}
                    {resource.size && <span className="mx-2">• {resource.size}</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    onClick={() => handleDelete(resource._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
