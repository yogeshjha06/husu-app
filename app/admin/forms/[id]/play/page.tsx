'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Slide {
  id: string
  type: 'intro' | 'video' | 'question' | 'conclusion'
  title?: string
  description?: string
  youtubeUrl?: string
  startTime?: number
  endTime?: number
  question?: {
    title: string
    type: string
    options?: string[]
    required: boolean
  }
}

export default function InteractiveFormPlayer({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [formId, setFormId] = useState<string>('')
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [videoEnded, setVideoEnded] = useState(false)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    params.then(p => {
      setFormId(p.id)
      fetchForm(p.id)
    })
  }, [])

  const fetchForm = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/forms/${id}`, { credentials: 'include' })
      if (response.ok) {
        const { data } = await response.json()
        setSlides(data.slides || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  useEffect(() => {
    if (slides[currentSlide]?.type === 'video') {
      setVideoEnded(false)
      loadYouTubeAPI()
    }
  }, [currentSlide])

  const loadYouTubeAPI = () => {
    if (!(window as any).YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.body.appendChild(tag)
      ;(window as any).onYouTubeIframeAPIReady = initPlayer
    } else {
      initPlayer()
    }
  }

  const initPlayer = () => {
    const slide = slides[currentSlide]
    if (slide?.type === 'video' && slide.youtubeUrl) {
      const videoId = slide.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        videoId,
        playerVars: {
          start: slide.startTime || 0,
          end: slide.endTime || 15,
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          fs: 0,
          cc_load_policy: 0,
          playsinline: 1
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              setVideoEnded(true)
            }
          }
        }
      })
    }
  }

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const slide = slides[currentSlide]
  if (!slide) return null

  const questionSlides = slides.filter(s => s.type === 'question')
  const currentQuestionIndex = slides.slice(0, currentSlide + 1).filter(s => s.type === 'question').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className={`transition-all duration-300 ${
                s.type === 'video'
                  ? 'w-3 h-3 rounded-full'
                  : 'w-2 h-2 rounded-full'
              } ${
                i === currentSlide
                  ? 'bg-blue-600 scale-125'
                  : i < currentSlide
                  ? 'bg-blue-400'
                  : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Slide Content */}
        <div
          key={currentSlide}
          className="animate-in fade-in slide-in-from-right-10 duration-500"
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Intro Slide */}
            {slide.type === 'intro' && (
              <div className="p-12 text-center space-y-6 min-h-[500px] flex flex-col items-center justify-center animate-in zoom-in duration-700">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-4xl">🎯</span>
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {slide.title}
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl">{slide.description}</p>
              </div>
            )}

            {/* Video Slide */}
            {slide.type === 'video' && (
              <div className="relative">
                <div id="youtube-player" className="w-full aspect-video bg-black" />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(transparent 85%, black)' }} />
                {!videoEnded && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                    <div className="text-white text-lg font-semibold animate-pulse">
                      Video playing... Please watch
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Question Slide */}
            {slide.type === 'question' && slide.question && (
              <div className="p-12 space-y-8 min-h-[500px] animate-in fade-in zoom-in duration-500">
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-blue-600">
                    Question {currentQuestionIndex} of {questionSlides.length}
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {slide.question.title}
                    {slide.question.required && <span className="text-red-500 ml-2">*</span>}
                  </h2>
                </div>

                {/* MCQ */}
                {slide.question.type === 'MCQ' && (
                  <div className="space-y-3">
                    {slide.question.options?.map((opt, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 hover:scale-105"
                      >
                        <input
                          type="radio"
                          name={slide.id}
                          value={opt}
                          onChange={(e) => setAnswers({ ...answers, [slide.id]: e.target.value })}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="text-lg">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* MULTI_OPTION */}
                {slide.question.type === 'MULTI_OPTION' && (
                  <div className="space-y-3">
                    {slide.question.options?.map((opt, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 hover:scale-105"
                      >
                        <input
                          type="checkbox"
                          value={opt}
                          onChange={(e) => {
                            const current = answers[slide.id] || []
                            setAnswers({
                              ...answers,
                              [slide.id]: e.target.checked
                                ? [...current, opt]
                                : current.filter((v: string) => v !== opt)
                            })
                          }}
                          className="w-5 h-5 rounded text-blue-600"
                        />
                        <span className="text-lg">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* TRUE_FALSE */}
                {slide.question.type === 'TRUE_FALSE' && (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-green-500 hover:bg-green-50 hover:scale-105">
                      <input
                        type="radio"
                        name={slide.id}
                        value="true"
                        onChange={() => setAnswers({ ...answers, [slide.id]: true })}
                        className="w-5 h-5 text-green-600"
                      />
                      <span className="text-xl font-semibold">True</span>
                    </label>
                    <label className="flex items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-red-500 hover:bg-red-50 hover:scale-105">
                      <input
                        type="radio"
                        name={slide.id}
                        value="false"
                        onChange={() => setAnswers({ ...answers, [slide.id]: false })}
                        className="w-5 h-5 text-red-600"
                      />
                      <span className="text-xl font-semibold">False</span>
                    </label>
                  </div>
                )}

                {/* RATING */}
                {slide.question.type === 'RATING' && (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>1 (Lowest)</span>
                      <span>10 (Highest)</span>
                    </div>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => setAnswers({ ...answers, [slide.id]: num })}
                          className={`w-14 h-14 rounded-xl border-2 font-bold text-lg transition-all hover:scale-110 ${
                            answers[slide.id] === num
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

                {/* SUBJECTIVE */}
                {slide.question.type === 'SUBJECTIVE' && (
                  <Textarea
                    placeholder="Type your answer here..."
                    value={answers[slide.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [slide.id]: e.target.value })}
                    className="min-h-[200px] text-lg border-2 focus:border-blue-500"
                  />
                )}
              </div>
            )}

            {/* Conclusion Slide */}
            {slide.type === 'conclusion' && (
              <div className="p-12 text-center space-y-6 min-h-[500px] flex flex-col items-center justify-center animate-in zoom-in duration-700">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-4xl">✨</span>
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {slide.title}
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl">{slide.description}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="p-6 bg-slate-50 flex items-center justify-between border-t">
              <Button
                variant="outline"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {slide.type === 'video' && !videoEnded ? (
                <div className="text-sm text-slate-600 font-medium">
                  Please watch the video to continue
                </div>
              ) : (
                <Button
                  onClick={nextSlide}
                  disabled={currentSlide === slides.length - 1}
                  className="gap-2"
                >
                  {currentSlide === slides.length - 1 ? 'Submit' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
