'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'

type Template = 'classic' | 'modern' | 'minimal'

const templates = {
  classic: {
    cardBg: 'bg-white',
    questionBg: 'bg-slate-50',
  },
  modern: {
    cardBg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    questionBg: 'bg-white/80 backdrop-blur',
  },
  minimal: {
    cardBg: 'bg-slate-900',
    questionBg: 'bg-slate-800',
  },
  vibrant: {
    cardBg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    questionBg: 'bg-white/80 backdrop-blur',
  },
  elegant: {
    cardBg: 'bg-slate-900',
    questionBg: 'bg-slate-800',
  }
}

export default function FormPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForm()
  }, [])

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/admin/forms/${params.id}`, { credentials: 'include' })
      if (response.ok) {
        const { data } = await response.json()
        setForm(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Form not found</h2>
          <Button onClick={() => router.push('/admin/forms')}>Back</Button>
        </div>
      </div>
    )
  }

  const template: Template = form.template || 'classic'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Form Preview</h1>
            <p className="text-sm text-slate-600">{form.name}</p>
          </div>
        </div>
      </div>

      <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: form.background_color || '#ffffff' }}>
        <div className="max-w-3xl mx-auto space-y-4">
          <Card className={`shadow-xl ${templates[template].cardBg} ${template === 'minimal' ? 'text-white' : ''}`}>
            {form.header_image && (
              <div className="relative h-48 md:h-56 w-full overflow-hidden rounded-t-lg">
                <img src={form.header_image} alt="Header" className="w-full h-full object-cover" />
              </div>
            )}
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className={`text-2xl md:text-3xl font-bold ${template === 'minimal' ? 'text-white' : 'text-slate-900'}`}>
                {form.name}
              </CardTitle>
              {form.description && (
                <p className={`text-sm md:text-base leading-relaxed ${template === 'minimal' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {form.description}
                </p>
              )}
            </CardHeader>
          </Card>

          {form.questions?.map((q: any, idx: number) => (
            <Card key={q.id} className={`shadow-lg ${templates[template].cardBg} ${template === 'minimal' ? 'text-white' : ''}`}>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className={`text-base md:text-lg font-semibold ${template === 'minimal' ? 'text-white' : 'text-slate-900'}`}>
                    {idx + 1}. {q.title}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {q.description && (
                    <p className={`text-sm ${template === 'minimal' ? 'text-slate-400' : 'text-slate-600'}`}>{q.description}</p>
                  )}
                </div>

                {q.type === 'MCQ' && (
                  <div className="space-y-3">
                    {q.options?.map((opt: string, i: number) => (
                      <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${template === 'classic' ? 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50' :
                          template === 'modern' ? 'bg-white/60 border-purple-200 hover:border-purple-400 hover:bg-purple-50' :
                            'bg-slate-700 border-slate-600 hover:border-emerald-500 hover:bg-slate-600'
                        }`}>
                        <input type="radio" name={q.id} className="w-4 h-4" />
                        <span className={template === 'minimal' ? 'text-slate-200' : 'text-slate-700'}>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'MULTI_OPTION' && (
                  <div className="space-y-3">
                    {q.options?.map((opt: string, i: number) => (
                      <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${template === 'classic' ? 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50' :
                          template === 'modern' ? 'bg-white/60 border-purple-200 hover:border-purple-400 hover:bg-purple-50' :
                            'bg-slate-700 border-slate-600 hover:border-emerald-500 hover:bg-slate-600'
                        }`}>
                        <input type="checkbox" className="w-4 h-4 rounded" />
                        <span className={template === 'minimal' ? 'text-slate-200' : 'text-slate-700'}>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'TRUE_FALSE' && (
                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${template === 'classic' ? 'bg-slate-50 border-slate-200 hover:border-green-400 hover:bg-green-50' :
                        template === 'modern' ? 'bg-white/60 border-purple-200 hover:border-green-400 hover:bg-green-50' :
                          'bg-slate-700 border-slate-600 hover:border-green-500 hover:bg-slate-600'
                      }`}>
                      <input type="radio" name={q.id} className="w-4 h-4" />
                      <span className={`font-medium ${template === 'minimal' ? 'text-slate-200' : 'text-slate-700'}`}>True</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${template === 'classic' ? 'bg-slate-50 border-slate-200 hover:border-red-400 hover:bg-red-50' :
                        template === 'modern' ? 'bg-white/60 border-purple-200 hover:border-red-400 hover:bg-red-50' :
                          'bg-slate-700 border-slate-600 hover:border-red-500 hover:bg-slate-600'
                      }`}>
                      <input type="radio" name={q.id} className="w-4 h-4" />
                      <span className={`font-medium ${template === 'minimal' ? 'text-slate-200' : 'text-slate-700'}`}>False</span>
                    </label>
                  </div>
                )}

                {(q.type === 'IMAGE_OPTION' || q.type === 'IMAGE_MCQ') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.imageOptions?.map((imgOpt: any, i: number) => (
                      <label key={i} className="relative group cursor-pointer">
                        <input type="radio" name={q.id} className="absolute top-2 left-2 w-5 h-5 z-10" />
                        <div className={`border-2 rounded-lg overflow-hidden transition-all group-hover:shadow-lg ${template === 'classic' ? 'border-slate-200 hover:border-blue-500' :
                            template === 'modern' ? 'border-purple-200 hover:border-purple-500' :
                              'border-slate-600 hover:border-emerald-500'
                          }`}>
                          <img src={imgOpt.url} alt={imgOpt.label || `Option ${i + 1}`} className="w-full h-40 object-cover" />
                          {imgOpt.label && (
                            <div className={`p-3 border-t ${template === 'minimal' ? 'bg-slate-700 border-slate-600' : 'bg-white'}`}>
                              <p className={`text-sm font-medium ${template === 'minimal' ? 'text-slate-200' : 'text-slate-700'}`}>{imgOpt.label}</p>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'RATING' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <span className={`text-sm ${template === 'minimal' ? 'text-slate-400' : 'text-slate-600'}`}>1 (Lowest)</span>
                      <span className={`text-sm ${template === 'minimal' ? 'text-slate-400' : 'text-slate-600'}`}>10 (Highest)</span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 font-semibold transition-all hover:scale-110 ${template === 'classic' ? 'border-slate-300 bg-slate-50 hover:bg-blue-500 hover:text-white hover:border-blue-500 text-slate-700' :
                              template === 'modern' ? 'border-purple-300 bg-white/60 hover:bg-purple-500 hover:text-white hover:border-purple-500 text-slate-700' :
                                'border-slate-600 bg-slate-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-slate-200'
                            }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {q.type === 'SUBJECTIVE' && (
                  <Textarea
                    placeholder="Type your answer here..."
                    className={`min-h-[120px] ${template === 'classic' ? 'bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-blue-500' :
                        template === 'modern' ? 'bg-white/60 border-purple-300 focus:border-purple-500 focus:ring-purple-500' :
                          'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500'
                      }`}
                  />
                )}
              </CardContent>
            </Card>
          ))}

          <Card className={`shadow-lg ${templates[template].cardBg}`}>
            <CardContent className="p-4 md:p-6 flex justify-center">
              <Button size="lg" className={`px-8 ${template === 'modern' ? 'bg-purple-600 hover:bg-purple-700' :
                  template === 'minimal' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    ''
                }`}>
                Submit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
