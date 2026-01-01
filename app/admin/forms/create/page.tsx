'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GripVertical, Plus, Trash2, Save, Eye, ArrowLeft, Library, Edit2, Palette, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface Question {
  id: string
  title: string
  type: string
  description?: string
  options?: string[]
  imageOptions?: { url: string; label?: string }[]
  required: boolean
}

type Template = 'classic' | 'modern' | 'minimal'

const templates = {
  classic: {
    name: 'Classic',
    cardBg: 'bg-white',
    questionBg: 'bg-slate-50',
    accentColor: 'blue',
    borderStyle: 'border-slate-200',
    headerBorder: 'border-t-8 border-blue-600'
  },
  modern: {
    name: 'Modern',
    cardBg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    questionBg: 'bg-white/80 backdrop-blur',
    accentColor: 'purple',
    borderStyle: 'border-purple-200',
    headerBorder: 'border-t-4 border-gradient-to-r from-purple-600 to-pink-600'
  },
  minimal: {
    name: 'Minimal',
    cardBg: 'bg-slate-900',
    questionBg: 'bg-slate-800',
    accentColor: 'emerald',
    borderStyle: 'border-slate-700',
    headerBorder: 'border-t-2 border-emerald-500'
  }
}

export default function FormBuilderPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const formType = searchParams.get('type') as 'SINGLE_PAGE' | 'INTERACTIVE'

  // Redirect INTERACTIVE to new builder
  useEffect(() => {
    if (formType === 'INTERACTIVE') {
      router.push('/admin/forms/create-interactive')
    }
  }, [formType, router])

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [headerImage, setHeaderImage] = useState('')
  const [backgroundType, setBackgroundType] = useState<'color' | 'image'>('color')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [backgroundImage, setBackgroundImage] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showQuestionBank, setShowQuestionBank] = useState(false)
  const [bankQuestions, setBankQuestions] = useState<Question[]>([])
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([])
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [template, setTemplate] = useState<Template>('classic')
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [saving, setSaving] = useState(false)

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      title: '',
      type: 'MCQ',
      options: ['Option 1', 'Option 2'],
      required: false
    }
    setQuestions([newQuestion, ...questions])
    setEditingQuestion(newQuestion.id)
  }

  const fetchQuestionBank = async () => {
    try {
      const response = await fetch('/api/admin/questions', { credentials: 'include' })
      if (response.ok) {
        const { data } = await response.json()
        setBankQuestions(data)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const addQuestionsFromBank = () => {
    const selected = bankQuestions.filter(q => selectedBankQuestions.includes(q.id))
    setQuestions([...questions, ...selected])
    setSelectedBankQuestions([])
    setShowQuestionBank(false)
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newQuestions = [...questions]
    const draggedItem = newQuestions[draggedIndex]
    newQuestions.splice(draggedIndex, 1)
    newQuestions.splice(index, 0, draggedItem)
    setQuestions(newQuestions)
    setDraggedIndex(index)
  }

  const handleImageUpload = async (file: File, type: 'header' | 'background') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      
      if (response.ok) {
        const { path } = await response.json()
        if (type === 'header') {
          setHeaderImage(path)
        } else {
          setBackgroundImage(path)
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const formData = {
      name: formName,
      type: formType,
      description: formDescription,
      headerImage,
      backgroundColor,
      questions,
      template
    }
    
    try {
      const response = await fetch('/api/admin/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      })
      
      if (response.ok) {
        router.push('/admin/forms')
      }
    } catch (error) {
      console.error('Error saving form:', error)
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
            <p className="text-lg font-semibold">Saving form...</p>
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
              <h1 className="text-xl font-semibold text-slate-900">
                {formType === 'SINGLE_PAGE' ? 'Single Page Form' : 'Interactive Form'}
              </h1>
              <p className="text-sm text-slate-600">Create and customize your form</p>
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
        {showPreview ? (
          <>
            {/* Floating Template Selector */}
            <div className="fixed bottom-6 right-6 z-50">
              <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
                <DialogTrigger asChild>
                  <Button size="lg" className="rounded-full shadow-2xl h-14 w-14 p-0">
                    <Palette className="w-6 h-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Choose Form Template</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => { setTemplate('classic'); setShowTemplateSelector(false) }}
                      className={`p-4 border-2 rounded-lg hover:shadow-lg transition-all ${template === 'classic' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                    >
                      <div className="aspect-video bg-white rounded border-t-4 border-blue-600 mb-3" />
                      <h3 className="font-semibold">Classic</h3>
                      <p className="text-sm text-slate-600">Clean and professional</p>
                    </button>
                    <button
                      onClick={() => { setTemplate('modern'); setShowTemplateSelector(false) }}
                      className={`p-4 border-2 rounded-lg hover:shadow-lg transition-all ${template === 'modern' ? 'border-purple-600 bg-purple-50' : 'border-slate-200'}`}
                    >
                      <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded border-t-4 border-purple-600 mb-3" />
                      <h3 className="font-semibold">Modern</h3>
                      <p className="text-sm text-slate-600">Vibrant and colorful</p>
                    </button>
                    <button
                      onClick={() => { setTemplate('minimal'); setShowTemplateSelector(false) }}
                      className={`p-4 border-2 rounded-lg hover:shadow-lg transition-all ${template === 'minimal' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}
                    >
                      <div className="aspect-video bg-slate-900 rounded border-t-2 border-emerald-500 mb-3" />
                      <h3 className="font-semibold">Minimal</h3>
                      <p className="text-sm text-slate-600">Dark and elegant</p>
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div
              className="min-h-screen p-4 md:p-8"
              style={{
                backgroundColor: backgroundType === 'color' ? backgroundColor : 'transparent',
                backgroundImage: backgroundType === 'image' && backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="max-w-3xl mx-auto space-y-4">
                {/* Header Card */}
                <Card className={`shadow-xl ${templates[template].cardBg} ${template === 'minimal' ? 'text-white' : ''}`}>
                  {headerImage && (
                    <div className="relative h-48 md:h-56 w-full overflow-hidden rounded-t-lg">
                      <img src={headerImage} alt="Header" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="space-y-3 pb-6">
                    <CardTitle className={`text-2xl md:text-3xl font-bold ${template === 'minimal' ? 'text-white' : 'text-slate-900'}`}>
                      {formName || 'Untitled Form'}
                    </CardTitle>
                    {formDescription && (
                      <p className={`text-sm md:text-base leading-relaxed ${template === 'minimal' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {formDescription}
                      </p>
                    )}
                  </CardHeader>
                </Card>

                {/* Question Cards */}
                {questions.map((q, idx) => (
                  <Card key={q.id} className={`shadow-lg ${templates[template].cardBg} ${template === 'minimal' ? 'text-white' : ''}`}>
                    <CardContent className="p-4 md:p-6 space-y-4">
                      <div className="space-y-2">
                        <h3 className={`text-base md:text-lg font-semibold ${template === 'minimal' ? 'text-white' : 'text-slate-900'}`}>
                          {idx + 1}. {q.title || 'Untitled Question'}
                          {q.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        {q.description && (
                          <p className={`text-sm ${template === 'minimal' ? 'text-slate-400' : 'text-slate-600'}`}>{q.description}</p>
                        )}
                      </div>

                      {/* MCQ */}
                      {q.type === 'MCQ' && (
                        <div className="space-y-3">
                          {q.options?.map((opt, i) => (
                            <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              template === 'classic' ? 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50' :
                              template === 'modern' ? 'bg-white/60 border-purple-200 hover:border-purple-400 hover:bg-purple-50' :
                              'bg-slate-700 border-slate-600 hover:border-emerald-500 hover:bg-slate-600'
                            }`}>
                              <input type="radio" name={q.id} className={`w-4 h-4 ${template === 'modern' ? 'text-purple-600' : template === 'minimal' ? 'text-emerald-600' : 'text-blue-600'}`} />
                              <span className={template === 'minimal' ? 'text-slate-200' : 'text-slate-700'}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* MULTI_OPTION */}
                      {q.type === 'MULTI_OPTION' && (
                        <div className="space-y-3">
                          {q.options?.map((opt, i) => (
                            <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              template === 'classic' ? 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50' :
                              template === 'modern' ? 'bg-white/60 border-purple-200 hover:border-purple-400 hover:bg-purple-50' :
                              'bg-slate-700 border-slate-600 hover:border-emerald-500 hover:bg-slate-600'
                            }`}>
                              <input type="checkbox" className={`w-4 h-4 rounded ${template === 'modern' ? 'text-purple-600' : template === 'minimal' ? 'text-emerald-600' : 'text-blue-600'}`} />
                              <span className={template === 'minimal' ? 'text-slate-200' : 'text-slate-700'}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* TRUE_FALSE */}
                      {q.type === 'TRUE_FALSE' && (
                        <div className="space-y-3">
                          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            template === 'classic' ? 'bg-slate-50 border-slate-200 hover:border-green-400 hover:bg-green-50' :
                            template === 'modern' ? 'bg-white/60 border-purple-200 hover:border-green-400 hover:bg-green-50' :
                            'bg-slate-700 border-slate-600 hover:border-green-500 hover:bg-slate-600'
                          }`}>
                            <input type="radio" name={q.id} className="w-4 h-4 text-green-600" />
                            <span className={`font-medium ${template === 'minimal' ? 'text-slate-200' : 'text-slate-700'}`}>True</span>
                          </label>
                          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            template === 'classic' ? 'bg-slate-50 border-slate-200 hover:border-red-400 hover:bg-red-50' :
                            template === 'modern' ? 'bg-white/60 border-purple-200 hover:border-red-400 hover:bg-red-50' :
                            'bg-slate-700 border-slate-600 hover:border-red-500 hover:bg-slate-600'
                          }`}>
                            <input type="radio" name={q.id} className="w-4 h-4 text-red-600" />
                            <span className={`font-medium ${template === 'minimal' ? 'text-slate-200' : 'text-slate-700'}`}>False</span>
                          </label>
                        </div>
                      )}

                      {/* IMAGE_OPTION or IMAGE_MCQ */}
                      {(q.type === 'IMAGE_OPTION' || q.type === 'IMAGE_MCQ') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.imageOptions?.map((imgOpt, i) => (
                            <label key={i} className="relative group cursor-pointer">
                              <input type="radio" name={q.id} className="absolute top-2 left-2 w-5 h-5 z-10" />
                              <div className={`border-2 rounded-lg overflow-hidden transition-all group-hover:shadow-lg ${
                                template === 'classic' ? 'border-slate-200 hover:border-blue-500' :
                                template === 'modern' ? 'border-purple-200 hover:border-purple-500' :
                                'border-slate-600 hover:border-emerald-500'
                              }`}>
                                <img src={imgOpt.url} alt={imgOpt.label || `Option ${i + 1}`} className="w-full h-40 object-cover" />
                                {imgOpt.label && (
                                  <div className={`p-3 border-t ${template === 'minimal' ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white'}`}>
                                    <p className={`text-sm font-medium ${template === 'minimal' ? 'text-slate-200' : 'text-slate-700'}`}>{imgOpt.label}</p>
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* RATING */}
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
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 font-semibold transition-all hover:scale-110 ${
                                  template === 'classic' ? 'border-slate-300 bg-slate-50 hover:bg-blue-500 hover:text-white hover:border-blue-500 text-slate-700' :
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

                      {/* SUBJECTIVE */}
                      {q.type === 'SUBJECTIVE' && (
                        <Textarea
                          placeholder="Type your answer here..."
                          className={`min-h-[120px] ${
                            template === 'classic' ? 'bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-blue-500' :
                            template === 'modern' ? 'bg-white/60 border-purple-300 focus:border-purple-500 focus:ring-purple-500' :
                            'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500'
                          }`}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Submit Button Card */}
                <Card className={`shadow-lg ${templates[template].cardBg}`}>
                  <CardContent className="p-4 md:p-6 flex justify-center">
                    <Button size="lg" className={`px-8 ${
                      template === 'modern' ? 'bg-purple-600 hover:bg-purple-700' :
                      template === 'minimal' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      ''
                    }`}>
                      Submit
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <>
        <Card>
          <CardHeader>
            <CardTitle>Form Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Form Name *</label>
              <Input
                placeholder="Enter form name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                placeholder="Enter form description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Header Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'header')
                  }}
                />
                {headerImage && (
                  <div className="relative mt-2">
                    <img src={headerImage} alt="Header" className="h-20 w-full object-cover rounded" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1"
                      onClick={() => setHeaderImage('')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Background</label>
                <Select value={backgroundType} onValueChange={(v: 'color' | 'image') => setBackgroundType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
                {backgroundType === 'color' ? (
                  <Input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="mt-2"
                  />
                ) : (
                  <>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'background')
                      }}
                      className="mt-2"
                    />
                    {backgroundImage && (
                      <img src={backgroundImage} alt="Background" className="mt-2 h-20 w-full object-cover rounded" />
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Questions</CardTitle>
            <div className="flex gap-2">
              <Dialog open={showQuestionBank} onOpenChange={setShowQuestionBank}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={fetchQuestionBank}>
                    <Library className="w-4 h-4 mr-2" />
                    From Question Bank
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Select Questions from Bank</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {bankQuestions.map((q) => (
                      <div key={q.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedBankQuestions.includes(q.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBankQuestions([...selectedBankQuestions, q.id])
                            } else {
                              setSelectedBankQuestions(selectedBankQuestions.filter(id => id !== q.id))
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{q.title}</p>
                          <span className="text-xs text-slate-600">{q.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowQuestionBank(false)}>Cancel</Button>
                    <Button onClick={addQuestionsFromBank}>Add Selected ({selectedBankQuestions.length})</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                No questions added yet. Click "Add Question" to start.
              </div>
            ) : (
              questions.map((question, index) => (
                <div
                  key={question.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-slate-400 mt-2 cursor-move" />
                    <div className="flex-1 space-y-3">
                      {editingQuestion === question.id ? (
                        <>
                          <Input
                            placeholder="Question title"
                            value={question.title}
                            onChange={(e) => updateQuestion(question.id, 'title', e.target.value)}
                          />
                          <Textarea
                            placeholder="Description (optional)"
                            value={question.description || ''}
                            onChange={(e) => updateQuestion(question.id, 'description', e.target.value)}
                          />
                          <Select
                            value={question.type}
                            onValueChange={(value) => updateQuestion(question.id, 'type', value)}
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
                              <SelectItem value="IMAGE_OPTION">Image Options</SelectItem>
                            </SelectContent>
                          </Select>
                          {(question.type === 'MCQ' || question.type === 'MULTI_OPTION') && (
                            <div className="space-y-2">
                              {question.options?.map((option, optIndex) => (
                                <Input
                                  key={optIndex}
                                  placeholder={`Option ${optIndex + 1}`}
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(question.options || [])]
                                    newOptions[optIndex] = e.target.value
                                    updateQuestion(question.id, 'options', newOptions)
                                  }}
                                />
                              ))}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newOptions = [...(question.options || []), '']
                                  updateQuestion(question.id, 'options', newOptions)
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                          )}
                          {(question.type === 'IMAGE_OPTION' || question.type === 'IMAGE_MCQ') && (
                            <div className="space-y-2">
                              {question.imageOptions?.map((imgOpt, optIndex) => (
                                <div key={optIndex} className="flex gap-2 items-start">
                                  <img src={imgOpt.url} alt="" className="w-12 h-12 object-cover rounded" />
                                  <Input
                                    placeholder="Label"
                                    value={imgOpt.label || ''}
                                    onChange={(e) => {
                                      const newOptions = [...(question.imageOptions || [])]
                                      newOptions[optIndex] = { ...newOptions[optIndex], label: e.target.value }
                                      updateQuestion(question.id, 'imageOptions', newOptions)
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          <Button size="sm" onClick={() => setEditingQuestion(null)}>Done</Button>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">{question.title || 'Untitled Question'}</p>
                          <span className="text-xs text-slate-600">{question.type}</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editingQuestion !== question.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingQuestion(question.id)}
                          className="text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        </>
        )}
      </div>
    </div>
  )
}
