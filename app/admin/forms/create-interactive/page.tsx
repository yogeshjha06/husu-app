'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Save, ArrowLeft, Play, Loader2, ChevronUp, ChevronDown, Eye, Library, Upload, Video, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface Slide {
  id: string
  type: 'intro' | 'video' | 'question' | 'conclusion'
  title?: string
  description?: string
  image?: string
  videoType?: 'youtube' | 'upload'
  youtubeUrl?: string
  videoUrl?: string
  startTime?: number
  endTime?: number
  question?: {
    title: string
    type: string
    options?: string[]
    imageOptions?: { url: string; label?: string }[]
    required: boolean
  }
}

type Template = 'vibrant' | 'elegant' | 'minimal'

const templates = {
  vibrant: {
    name: 'Vibrant',
    bg: 'from-purple-600 via-pink-600 to-red-600',
    text: 'text-white',
    accent: 'bg-yellow-400 text-purple-900'
  },
  elegant: {
    name: 'Elegant',
    bg: 'from-slate-900 via-blue-900 to-slate-900',
    text: 'text-white',
    accent: 'bg-blue-400 text-slate-900'
  },
  minimal: {
    name: 'Minimal',
    bg: 'from-emerald-50 via-teal-50 to-cyan-50',
    text: 'text-slate-900',
    accent: 'bg-emerald-600 text-white'
  }
}

export default function InteractiveFormBuilder() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const formId = searchParams.get('id')
  const isPreviewParam = searchParams.get('preview') === 'true'

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [template, setTemplate] = useState<Template>('vibrant')
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', type: 'intro', title: 'Welcome', description: '' }
  ])
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([])
  const [showVideoLibrary, setShowVideoLibrary] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [videoEnded, setVideoEnded] = useState(false)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [showQuestionBank, setShowQuestionBank] = useState(false)
  const [bankQuestions, setBankQuestions] = useState<any[]>([])
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([])
  const [trimVideoRef, setTrimVideoRef] = useState<HTMLVideoElement | null>(null)

  // Load form if ID is provided
  useEffect(() => {
    if (formId) {
      const loadForm = async () => {
        try {
          const res = await fetch(`/api/admin/forms/${formId}`, { credentials: 'include' })
          if (res.ok) {
            const { data } = await res.json()
            setFormName(data.name || '')
            setFormDescription(data.description || '')
            setTemplate(data.template || 'vibrant')
            if (data.slides && data.slides.length > 0) {
              setSlides(data.slides)
            }
            if (isPreviewParam) {
              setShowPreview(true)
            }
          }
        } catch (e) {
          console.error('Failed to load form:', e)
        }
      }
      loadForm()
    }
  }, [formId, isPreviewParam])

  // Helper function to check if file is a video (not an image)
  const isVideoFile = (path: string): boolean => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']
    const lowerPath = path.toLowerCase()
    return !imageExtensions.some(ext => lowerPath.endsWith(ext))
  }

  // Load persisted uploaded videos from localStorage
  useEffect(() => {
    // try to fetch persisted list from server first
    const load = async () => {
      try {
        const res = await fetch('/api/admin/upload')
        if (res.ok) {
          const json = await res.json()
          const data = (json.data || []).map((d: any) => d.path).filter(isVideoFile)
          if (Array.isArray(data) && data.length > 0) {
            setUploadedVideos(data)
            return
          }
        }
      } catch (e) {
        console.warn('Failed to fetch uploaded videos from server', e)
      }

      // fallback to localStorage
      try {
        const raw = localStorage.getItem('uploadedVideos')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            const videoFiles = parsed.filter(isVideoFile)
            setUploadedVideos(videoFiles)
          }
        }
      } catch (e) {
        console.warn('Failed to load uploadedVideos from localStorage', e)
      }
    }
    load()
  }, [])

  // Persist uploaded videos to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('uploadedVideos', JSON.stringify(uploadedVideos))
    } catch (e) {
      console.warn('Failed to save uploadedVideos to localStorage', e)
    }
  }, [uploadedVideos])

  const fetchQuestionBank = async () => {
    try {
      const response = await fetch('/api/admin/questions', { credentials: 'include' })
      if (response.ok) {
        const { data } = await response.json()
        setBankQuestions(data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const addQuestionsFromBank = () => {
    const selected = bankQuestions.filter(q => selectedBankQuestions.includes(q.id))
    const newSlides = selected.map(q => ({
      id: Date.now().toString() + Math.random(),
      type: 'question' as const,
      question: {
        title: q.title,
        // preserve original bank type (EX: IMAGE_MCQ) so interactive form can render appropriately
        type: q.type || 'MCQ',
        options: q.options || [],
        imageOptions: q.imageOptions || q.image_options || [],
        required: q.required || false
      }
    }))
    setSlides([...slides, ...newSlides])
    setSelectedBankQuestions([])
    setShowQuestionBank(false)
  }

  const addSlide = (type: Slide['type']) => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      type,
      title: type === 'intro' ? 'Welcome' : type === 'conclusion' ? 'Thank You' : '',
      description: '',
      videoType: type === 'video' ? 'youtube' : undefined,
      youtubeUrl: type === 'video' ? '' : undefined,
      videoUrl: type === 'video' ? '' : undefined,
      startTime: type === 'video' ? 0 : undefined,
      endTime: type === 'video' ? 15 : undefined,
      question: type === 'question' ? { title: '', type: 'MCQ', options: ['', ''], required: false } : undefined
    }
    setSlides([...slides, newSlide])
  }

  const removeSlide = (id: string) => {
    setSlides(slides.filter(s => s.id !== id))
  }

  const updateSlide = (id: string, field: string, value: any) => {
    console.debug('updateSlide', { id, field, value })
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === slides.length - 1)) return
    const newSlides = [...slides]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
      ;[newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]]
    setSlides(newSlides)
  }

  const handleImageUpload = async (file: File, slideId: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'slide')

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      if (response.ok) {
        const { path } = await response.json()
        updateSlide(slideId, 'image', path)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleVideoUpload = async (file: File, slideId: string) => {
    setUploadProgress(0)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'video')

    try {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const { path } = JSON.parse(xhr.responseText)
          // Only update slide if it's not a temp ID (from floating menu upload)
          if (!slideId.startsWith('temp-upload-')) {
            updateSlide(slideId, 'videoUrl', path)
            updateSlide(slideId, 'videoType', 'upload')
          }
          // Always add to uploaded videos library (use functional update) - only if it's a video file
          if (isVideoFile(path)) {
            setUploadedVideos((prev) => [...prev, path])
          }
          setUploadProgress(0)
        }
      })

      xhr.open('POST', '/api/admin/upload')
      xhr.send(formData)
    } catch (error) {
      console.error('Error:', error)
      setUploadProgress(0)
    }
  }

  const deleteUploadedVideo = async (videoUrl: string) => {
    try {
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: videoUrl })
      })
    } catch (e) {
      console.warn('Failed to delete on server', e)
    }
    // update local state
    setUploadedVideos((prev) => prev.filter((v) => v !== videoUrl))
    // clear selection from any slides using this video
    setSlides((prev) => prev.map((s) => (s.videoUrl === videoUrl ? { ...s, videoUrl: undefined, videoType: 'youtube' } : s)))
  }

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
      setVideoEnded(false)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
      setVideoEnded(false)
    }
  }

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    return match ? match[1] : ''
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = formId ? `/api/admin/forms/${formId}` : '/api/admin/forms'
      const method = formId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName || 'Untitled Interactive Form',
          description: formDescription,
          type: 'INTERACTIVE',
          template,
          slides
        }),
        credentials: 'include'
      })
      if (response.ok) {
        router.push('/admin/forms')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Dialog open={saving}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Saving Form</DialogTitle>
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg font-semibold">Saving interactive form...</p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Interactive Form Builder</h1>
              <p className="text-sm text-slate-600">Slide-based form with videos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Form
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {showPreview ?
          <div className="min-h-[600px] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8">
            <div className="max-w-3xl mx-auto">

              {/* Progress Dots */}
              <div className="mb-6 flex items-center justify-center gap-2">
                {slides.map((s, i) => (
                  <div
                    key={s.id}
                    className={`transition-all duration-300 ${s.type === 'video' ? 'w-3 h-3 rounded-full' : 'w-2 h-2 rounded-full'
                      } ${i === currentSlide ? 'bg-blue-600 scale-125' : i < currentSlide ? 'bg-blue-400' : 'bg-slate-300'
                      }`}
                  />
                ))}
              </div>

              {/* Current Slide */}
              <div key={currentSlide} className="animate-in fade-in slide-in-from-right-10 duration-500">
                <Card className="shadow-2xl">
                  <CardContent className="p-8">
                    {slides[currentSlide]?.type === 'intro' && (
                      <div className={`text-center space-y-8 min-h-[500px] flex flex-col items-center justify-center bg-gradient-to-br ${templates[template].bg} rounded-2xl p-12 animate-in zoom-in duration-700`}>
                        {slides[currentSlide].image && (
                          <img src={slides[currentSlide].image} alt="" className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-2xl" />
                        )}
                        <h1 className={`text-6xl font-black ${templates[template].text} tracking-tight`}>
                          {slides[currentSlide].title}
                        </h1>
                        <p className={`text-2xl ${templates[template].text} opacity-90 max-w-2xl`}>
                          {slides[currentSlide].description}
                        </p>
                      </div>
                    )}

                    {slides[currentSlide]?.type === 'video' && (
                      <div className="space-y-4">
                        <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative">
                          {slides[currentSlide].videoType === 'upload' && slides[currentSlide].videoUrl ? (
                            <video
                              src={slides[currentSlide].videoUrl}
                              autoPlay
                              className="w-full h-full"
                              onLoadedMetadata={(e) => {
                                const video = e.currentTarget
                                video.currentTime = slides[currentSlide].startTime || 0
                              }}
                              onTimeUpdate={(e) => {
                                const video = e.currentTarget
                                if (video.currentTime >= (slides[currentSlide].endTime || 15)) {
                                  video.pause()
                                  setVideoEnded(true)
                                }
                              }}
                            />
                          ) : (
                            <>
                              <iframe
                                src={`https://www.youtube.com/embed/${extractYouTubeId(slides[currentSlide].youtubeUrl || '')}?start=${slides[currentSlide].startTime || 0}&end=${slides[currentSlide].endTime || 15}&autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=0&cc_load_policy=0&playsinline=1`}
                                className="w-full h-full"
                                allow="autoplay"
                                onLoad={() => {
                                  setTimeout(() => setVideoEnded(true), ((slides[currentSlide].endTime || 15) - (slides[currentSlide].startTime || 0)) * 1000)
                                }}
                              />
                              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(transparent 85%, black)' }} />
                            </>
                          )}
                        </div>
                        {!videoEnded && (
                          <div className="text-center text-slate-600 font-medium animate-pulse">
                            Please watch the video to continue
                          </div>
                        )}
                      </div>
                    )}

                    {slides[currentSlide]?.type === 'question' && slides[currentSlide].question && (
                      <div className={`space-y-6 min-h-[500px] flex flex-col justify-center bg-gradient-to-br ${templates[template].bg} rounded-2xl p-12 animate-in zoom-in duration-500`}>
                        <h2 className={`text-5xl font-black ${templates[template].text} tracking-tight mb-8`}>
                          {slides[currentSlide].question?.title}
                        </h2>

                        {(slides[currentSlide].question?.type === 'IMAGE_MCQ' || slides[currentSlide].question?.type === 'IMAGE_OPTION') ? (
                          <div className="grid grid-cols-2 gap-4">
                            {slides[currentSlide].question?.imageOptions?.map((imgOpt, i) => (
                              <label key={i} className={`relative group cursor-pointer transition-all hover:scale-105 ${answers[slides[currentSlide].id] === imgOpt.url ? 'ring-4 ring-blue-400 rounded-xl' : ''}`}>
                                <input
                                  type="radio"
                                  name={slides[currentSlide].id}
                                  value={imgOpt.url}
                                  checked={answers[slides[currentSlide].id] === imgOpt.url}
                                  onChange={(e) => setAnswers({ ...answers, [slides[currentSlide].id]: e.target.value })}
                                  className="absolute top-3 left-3 w-5 h-5 z-10 cursor-pointer"
                                />
                                <div className="border-2 rounded-xl overflow-hidden transition-all group-hover:shadow-xl hover:border-blue-400">
                                  <img src={imgOpt.url} alt={imgOpt.label || `Option ${i + 1}`} className="w-full h-48 object-cover" />
                                  {imgOpt.label && (
                                    <div className="p-3 bg-white border-t">
                                      <p className="text-sm font-medium text-slate-700">{imgOpt.label}</p>
                                    </div>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        ) : slides[currentSlide].question?.type === 'MCQ' ? (
                          <div className="space-y-3">
                            {slides[currentSlide].question?.options?.map((opt, i) => (
                              <label key={i} className={`flex items-center gap-4 p-5 rounded-xl cursor-pointer transition-all hover:scale-105 border-2 ${answers[slides[currentSlide].id] === opt
                                ? `border-white shadow-lg ${templates[template].accent}`
                                : 'border-white/20 bg-white/10 hover:bg-white/20'
                                } ${templates[template].text}`}>
                                <input
                                  type="radio"
                                  name={slides[currentSlide].id}
                                  value={opt}
                                  checked={answers[slides[currentSlide].id] === opt}
                                  onChange={(e) => setAnswers({ ...answers, [slides[currentSlide].id]: e.target.value })}
                                  className="w-6 h-6 border-2 border-white"
                                />
                                <span className="text-xl font-medium">{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : null}

                        {slides[currentSlide].question?.type === 'MULTI_OPTION' && (
                          <div className="space-y-3">
                            {slides[currentSlide].question?.options?.map((opt, i) => (
                              <label key={i} className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 hover:scale-105">
                                <input
                                  type="checkbox"
                                  value={opt}
                                  checked={(answers[slides[currentSlide].id] || []).includes(opt)}
                                  onChange={(e) => {
                                    const current = answers[slides[currentSlide].id] || []
                                    setAnswers({
                                      ...answers,
                                      [slides[currentSlide].id]: e.target.checked ? [...current, opt] : current.filter((v: string) => v !== opt)
                                    })
                                  }}
                                  className="w-5 h-5 rounded text-blue-600"
                                />
                                <span className="text-lg">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {slides[currentSlide].question?.type === 'TRUE_FALSE' && (
                          <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-green-500 hover:bg-green-50 hover:scale-105">
                              <input
                                type="radio"
                                name={slides[currentSlide].id}
                                value="true"
                                checked={answers[slides[currentSlide].id] === 'true'}
                                onChange={() => setAnswers({ ...answers, [slides[currentSlide].id]: 'true' })}
                                className="w-5 h-5 text-green-600"
                              />
                              <span className="text-xl font-semibold">True</span>
                            </label>
                            <label className="flex items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-red-500 hover:bg-red-50 hover:scale-105">
                              <input
                                type="radio"
                                name={slides[currentSlide].id}
                                value="false"
                                checked={answers[slides[currentSlide].id] === 'false'}
                                onChange={() => setAnswers({ ...answers, [slides[currentSlide].id]: 'false' })}
                                className="w-5 h-5 text-red-600"
                              />
                              <span className="text-xl font-semibold">False</span>
                            </label>
                          </div>
                        )}

                        {slides[currentSlide].question?.type === 'RATING' && (
                          <div className="space-y-4">
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>1 (Lowest)</span>
                              <span>10 (Highest)</span>
                            </div>
                            <div className="flex gap-2 justify-center flex-wrap">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <button
                                  key={num}
                                  onClick={() => setAnswers({ ...answers, [slides[currentSlide].id]: num })}
                                  className={`w-14 h-14 rounded-xl border-2 font-bold text-lg transition-all hover:scale-110 ${answers[slides[currentSlide].id] === num
                                    ? 'bg-blue-600 text-white border-blue-600 scale-110'
                                    : 'border-slate-300 hover:border-blue-500'
                                    }`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {slides[currentSlide].question?.type === 'SUBJECTIVE' && (
                          <Textarea
                            placeholder="Type your answer here..."
                            value={answers[slides[currentSlide].id] || ''}
                            onChange={(e) => setAnswers({ ...answers, [slides[currentSlide].id]: e.target.value })}
                            className="min-h-[200px] text-lg border-2 focus:border-blue-500"
                          />
                        )}
                      </div>
                    )}

                    {slides[currentSlide]?.type === 'conclusion' && (
                      <div className={`text-center space-y-8 min-h-[500px] flex flex-col items-center justify-center bg-gradient-to-br ${templates[template].bg} rounded-2xl p-12 animate-in zoom-in duration-700`}>
                        {slides[currentSlide].image && (
                          <img src={slides[currentSlide].image} alt="" className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-2xl" />
                        )}
                        <h1 className={`text-6xl font-black ${templates[template].text} tracking-tight`}>
                          {slides[currentSlide].title}
                        </h1>
                        <p className={`text-2xl ${templates[template].text} opacity-90 max-w-2xl`}>
                          {slides[currentSlide].description}
                        </p>
                      </div>
                    )}
                  </CardContent>

                  {/* Navigation */}
                  <div className="p-6 bg-slate-50 flex items-center justify-between border-t">
                    <Button
                      variant="outline"
                      onClick={prevSlide}
                      disabled={currentSlide === 0}
                    >
                      Previous
                    </Button>

                    {slides[currentSlide]?.type === 'video' && !videoEnded ? (
                      <div className="text-sm text-slate-600 font-medium">Watching video...</div>
                    ) : (
                      <Button onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
                        {currentSlide === slides.length - 1 ? 'Finish' : 'Next'}
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
          : (
            <>
              <Card>
                <CardContent className="p-6">
                  <Input
                    placeholder="Enter form name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="text-2xl font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-auto"
                  />
                  <Input
                    placeholder="Add a short description..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="text-sm border-none bg-transparent focus-visible:ring-0 px-0 h-auto text-slate-500"
                  />
                </CardContent>
              </Card>

              <Card className="sticky top-20 z-10 shadow-sm border-slate-200">
                <CardContent className="p-4 flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Management Group */}
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border">
                      <Dialog open={showVideoLibrary} onOpenChange={setShowVideoLibrary}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-semibold">
                            <Video className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            Library
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                              <Video className="w-6 h-6 text-blue-600" />
                              Video Library Manager
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6 pt-4">
                            <div className="rounded-xl border border-slate-200 overflow-hidden text-slate-900">
                              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="bg-blue-600 text-white rounded-lg p-2">
                                    <Upload className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">Upload Videos</h3>
                                    <p className="text-xs text-slate-600">Step 1 of 2</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-6">
                                <Input
                                  type="file"
                                  accept="video/*"
                                  className="cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      const tempId = 'temp-upload-' + Date.now()
                                      handleVideoUpload(file, tempId)
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 overflow-hidden text-slate-900">
                              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <h3 className="font-semibold">Your Videos</h3>
                              </div>
                              <div className="p-6">
                                {uploadedVideos.length === 0 ? (
                                  <p className="text-center text-slate-500">No videos yet</p>
                                ) : (
                                  <div className="grid grid-cols-3 gap-4">
                                    {uploadedVideos.map((url, i) => (
                                      <div key={i} className="rounded-lg border overflow-hidden">
                                        <video src={url} className="w-full h-24 object-cover" />
                                        <div className="p-2 flex justify-between items-center bg-white border-t">
                                          <span className="text-[10px] truncate w-20">{url.split('/').pop()}</span>
                                          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" onClick={() => deleteUploadedVideo(url)}>
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showQuestionBank} onOpenChange={setShowQuestionBank}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-semibold" onClick={fetchQuestionBank}>
                            <Library className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                            Bank
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Question Bank</DialogTitle></DialogHeader>
                          <div className="space-y-3 pt-4">
                            {bankQuestions.map((q) => (
                              <div key={q.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                <Checkbox checked={selectedBankQuestions.includes(q.id)} onCheckedChange={(c) => c ? setSelectedBankQuestions([...selectedBankQuestions, q.id]) : setSelectedBankQuestions(selectedBankQuestions.filter(id => id !== q.id))} />
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">{q.title}</p>
                                  <span className="text-xs text-slate-500">{q.type}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2 mt-4 text-slate-900">
                            <Button variant="outline" onClick={() => setShowQuestionBank(false)}>Cancel</Button>
                            <Button onClick={addQuestionsFromBank}>Add Selected ({selectedBankQuestions.length})</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="w-px h-6 bg-slate-200 mx-1" />

                    {/* Creation Group */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-600 hover:text-blue-600 transition-all font-semibold" onClick={() => addSlide('intro')}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Intro
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-600 hover:text-blue-600 transition-all font-semibold" onClick={() => addSlide('video')}>
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Video
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-600 hover:text-blue-600 transition-all font-semibold" onClick={() => addSlide('question')}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Question
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-600 hover:text-blue-600 transition-all font-semibold" onClick={() => addSlide('conclusion')}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Conclusion
                      </Button>
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="w-48">
                    <Select value={template} onValueChange={(v: Template) => setTemplate(v)}>
                      <SelectTrigger className="h-9 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${templates[template].bg}`} />
                          <SelectValue placeholder="Select Template" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vibrant">Vibrant Theme</SelectItem>
                        <SelectItem value="elegant">Elegant Theme</SelectItem>
                        <SelectItem value="minimal">Minimal Theme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {slides.map((slide, index) => (
                  <Card key={slide.id} className="relative">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          <span className="font-semibold capitalize">{slide.type}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => moveSlide(index, 'up')} disabled={index === 0}>
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => moveSlide(index, 'down')} disabled={index === slides.length - 1}>
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeSlide(slide.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {(slide.type === 'intro' || slide.type === 'conclusion') && (
                        <>
                          <Input
                            placeholder="Title"
                            value={slide.title || ''}
                            onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                          />
                          <Textarea
                            placeholder="Description"
                            value={slide.description || ''}
                            onChange={(e) => updateSlide(slide.id, 'description', e.target.value)}
                          />
                          <div>
                            <label className="text-sm text-slate-600">Image (optional)</label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file, slide.id)
                              }}
                            />
                            {slide.image && (
                              <img src={slide.image} alt="" className="mt-2 h-20 w-20 object-cover rounded-full" />
                            )}
                          </div>
                        </>
                      )}

                      {slide.type === 'video' && (
                        <>
                          {!slide.videoUrl && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm text-blue-900"><strong>Note:</strong> Upload videos first using the Video Library button, then select them from the carousel below.</p>
                              </div>
                            </div>
                          )}

                          <Select
                            value={slide.videoType || 'youtube'}
                            onValueChange={(value: 'youtube' | 'upload') => {
                              updateSlide(slide.id, 'videoType', value)
                              if (value === 'youtube') {
                                updateSlide(slide.id, 'videoUrl', undefined)
                              } else {
                                updateSlide(slide.id, 'youtubeUrl', '')
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="youtube">YouTube URL</SelectItem>
                              <SelectItem value="upload">Uploaded Video</SelectItem>
                            </SelectContent>
                          </Select>

                          {slide.videoType === 'upload' ? (
                            <>
                              <div>
                                <label className="text-sm text-slate-600 font-medium block mb-3">Select a Video</label>
                                {uploadedVideos.length === 0 ? (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                                    <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                                    <p className="text-sm text-yellow-800 font-semibold">No videos uploaded yet</p>
                                    <p className="text-xs text-yellow-700 mt-2">Upload videos first using the Video Library button in the bottom right</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {/* Horizontal Scrollable Video Carousel */}
                                    <div className="overflow-x-auto pb-2 -mx-4 px-4">
                                      <div className="flex gap-3 min-w-min">
                                        {uploadedVideos.map((videoUrl, i) => (
                                          <div
                                            key={i}
                                            onClick={() => updateSlide(slide.id, 'videoUrl', videoUrl)}
                                            className={`relative group cursor-pointer flex-shrink-0 rounded-lg border-2 transition-all duration-200 ${slide.videoUrl === videoUrl
                                              ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                                              : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                                              }`}
                                          >
                                            <video
                                              src={videoUrl}
                                              className="w-32 h-24 object-cover rounded-md"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md flex items-center justify-center pointer-events-none">
                                              <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:rotate-6" />
                                            </div>
                                            {slide.videoUrl === videoUrl && (
                                              <div className="absolute inset-0 flex items-center justify-center rounded-md">
                                                <CheckCircle className="w-6 h-6 text-blue-500 drop-shadow-lg" />
                                              </div>
                                            )}
                                            <div className="px-2 py-1 bg-white text-center absolute bottom-0 left-0 right-0 rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity">
                                              <p className="text-xs font-medium text-slate-700 truncate">
                                                {videoUrl.split('/').pop() || `Video ${i + 1}`}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {!slide.videoUrl && (
                                      <p className="text-xs text-slate-600 text-center mt-2">Click a video to select</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {slide.videoUrl && (
                                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border-2 border-green-300">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-sm text-green-700">Video Selected</span>
                                  </div>
                                  <div className="bg-black rounded-lg overflow-hidden shadow-lg">
                                    <video
                                      key={slide.videoUrl}
                                      ref={(el) => setTrimVideoRef(el)}
                                      src={slide.videoUrl}
                                      controls
                                      controlsList="nodownload"
                                      className="w-full h-auto min-h-[300px] bg-black"
                                      onLoadedMetadata={(e) => {
                                        const video = e.currentTarget
                                        if (!slide.endTime) {
                                          updateSlide(slide.id, 'endTime', Math.min(15, video.duration))
                                        }
                                      }}
                                      onError={(e) => {
                                        console.error('Video failed to load:', e)
                                      }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm text-slate-600 font-medium">Start Time (seconds)</label>
                                      <div className="flex gap-2 mt-1">
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          value={slide.startTime || 0}
                                          onChange={(e) => updateSlide(slide.id, 'startTime', parseFloat(e.target.value))}
                                          step="0.1"
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            if (trimVideoRef) {
                                              updateSlide(slide.id, 'startTime', trimVideoRef.currentTime)
                                            }
                                          }}
                                        >
                                          Set
                                        </Button>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm text-slate-600 font-medium">End Time (seconds)</label>
                                      <div className="flex gap-2 mt-1">
                                        <Input
                                          type="number"
                                          placeholder="15"
                                          value={slide.endTime || 15}
                                          onChange={(e) => updateSlide(slide.id, 'endTime', parseFloat(e.target.value))}
                                          step="0.1"
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            if (trimVideoRef) {
                                              updateSlide(slide.id, 'endTime', trimVideoRef.currentTime)
                                            }
                                          }}
                                        >
                                          Set
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="text-sm text-slate-600 font-medium block mb-2">YouTube URL</label>
                                <Input
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  value={slide.youtubeUrl || ''}
                                  onChange={(e) => updateSlide(slide.id, 'youtubeUrl', e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm text-slate-600 font-medium">Start Time (seconds)</label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={slide.startTime || 0}
                                    onChange={(e) => updateSlide(slide.id, 'startTime', parseInt(e.target.value))}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-slate-600 font-medium">End Time (seconds)</label>
                                  <Input
                                    type="number"
                                    placeholder="15"
                                    value={slide.endTime || 15}
                                    onChange={(e) => updateSlide(slide.id, 'endTime', parseInt(e.target.value))}
                                  />
                                </div>
                              </div>
                              {slide.youtubeUrl && (
                                <div className="bg-slate-50 p-4 rounded-lg border-2 border-green-300">
                                  <div className="font-semibold text-sm text-green-700 mb-3">✓ YouTube Video Preview</div>
                                  <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${extractYouTubeId(slide.youtubeUrl)}?start=${slide.startTime || 0}&end=${slide.endTime || 15}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
                                      className="w-full h-full"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {slide.type === 'question' && (
                        <>
                          <Input
                            placeholder="Question title"
                            value={slide.question?.title || ''}
                            onChange={(e) => updateSlide(slide.id, 'question', { ...slide.question, title: e.target.value, type: slide.question?.type || 'MCQ', options: slide.question?.options || [], required: slide.question?.required || false })}
                          />
                          <Select
                            value={slide.question?.type || 'MCQ'}
                            onValueChange={(value) => {
                              const baseQuestion = {
                                title: slide.question?.title || '',
                                type: value,
                                required: slide.question?.required || false
                              }
                              if (value === 'IMAGE_MCQ' || value === 'IMAGE_OPTION') {
                                updateSlide(slide.id, 'question', { ...baseQuestion, imageOptions: slide.question?.imageOptions || [] })
                              } else {
                                updateSlide(slide.id, 'question', { ...baseQuestion, options: slide.question?.options || ['', ''] })
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MCQ">Multiple Choice</SelectItem>
                              <SelectItem value="MULTI_OPTION">Multi-Select</SelectItem>
                              <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                              <SelectItem value="SUBJECTIVE">Text Answer</SelectItem>
                              <SelectItem value="RATING">Rating</SelectItem>
                              <SelectItem value="IMAGE_MCQ">Image MCQ</SelectItem>
                              <SelectItem value="IMAGE_OPTION">Image Options</SelectItem>
                            </SelectContent>
                          </Select>
                          {(slide.question?.type === 'MCQ' || slide.question?.type === 'MULTI_OPTION') && (
                            <div className="space-y-2">
                              {(slide.question?.options || []).map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                  <Input
                                    placeholder={`Option ${i + 1}`}
                                    value={opt || ''}
                                    onChange={(e) => {
                                      const newOptions = [...(slide.question?.options || [])]
                                      newOptions[i] = e.target.value
                                      updateSlide(slide.id, 'question', { ...slide.question, options: newOptions })
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newOptions = (slide.question?.options || []).filter((_, idx) => idx !== i)
                                      updateSlide(slide.id, 'question', { ...slide.question, options: newOptions })
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newOptions = [...(slide.question?.options || []), '']
                                  updateSlide(slide.id, 'question', { ...slide.question, options: newOptions })
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                          )}
                          {(slide.question?.type === 'IMAGE_MCQ' || slide.question?.type === 'IMAGE_OPTION') && (
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-slate-700">Image Options</label>
                              {(slide.question?.imageOptions || []).map((imgOpt, i) => (
                                <div key={i} className="flex gap-3 items-start p-4 border-2 rounded-lg bg-white hover:border-blue-300 transition-colors">
                                  <img src={imgOpt.url} alt="" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                                  <div className="flex-1">
                                    <Input
                                      placeholder="Label (optional)"
                                      value={imgOpt.label || ''}
                                      onChange={(e) => {
                                        const newOptions = [...(slide.question?.imageOptions || [])]
                                        newOptions[i] = { ...newOptions[i], label: e.target.value }
                                        updateSlide(slide.id, 'question', { ...slide.question, imageOptions: newOptions })
                                      }}
                                      className="text-base"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newOptions = (slide.question?.imageOptions || []).filter((_, idx) => idx !== i)
                                      updateSlide(slide.id, 'question', { ...slide.question, imageOptions: newOptions })
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <div className="mt-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      const formData = new FormData()
                                      formData.append('file', file)
                                      formData.append('type', 'question')
                                      try {
                                        const response = await fetch('/api/admin/upload', {
                                          method: 'POST',
                                          body: formData,
                                          credentials: 'include'
                                        })
                                        if (response.ok) {
                                          const { path } = await response.json()
                                          const newOptions = [...(slide.question?.imageOptions || []), { url: path, label: '' }]
                                          updateSlide(slide.id, 'question', { ...slide.question, imageOptions: newOptions })
                                        }
                                      } catch (error) {
                                        console.error('Error uploading image:', error)
                                      }
                                      e.target.value = ''
                                    }
                                  }}
                                  className="cursor-pointer"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )
        }
      </div>
    </div>
  )
}
