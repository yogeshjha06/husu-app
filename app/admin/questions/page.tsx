'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
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
import { useState, useEffect } from 'react'
import { Plus, Trash2, X, ChevronDown, ChevronUp, Edit2 } from 'lucide-react'

interface Question {
  id: string
  title: string
  type: string
  description?: string
  options?: string[]
  imageOptions?: { url: string; label?: string; file?: File }[]
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [questionType, setQuestionType] = useState('MCQ')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', '', ''],
    imageOptions: [{ url: '', label: '' }],
  })

  // Helper function to compress images aggressively
  const compressImage = (base64String: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = base64String
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Resize to very small dimensions for max compression
          const maxWidth = 400
          const maxHeight = 400
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d', { alpha: false })
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Draw with white background for better compression
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          // Try WebP first (more efficient), fallback to JPEG
          let compressed = ''
          try {
            compressed = canvas.toDataURL('image/webp', 0.4)
          } catch (e) {
            // WebP not supported, use JPEG
            compressed = canvas.toDataURL('image/jpeg', 0.4)
          }

          // If still too large, reduce quality progressively
          let quality = 0.4
          while (compressed.length > 200000 && quality > 0.05) {
            quality -= 0.05
            try {
              compressed = canvas.toDataURL('image/webp', quality)
            } catch (e) {
              compressed = canvas.toDataURL('image/jpeg', quality)
            }
          }

          const sizeInKB = Math.round(compressed.length / 1024)
          
          if (compressed.length > 200000) {
            reject(
              new Error(
                `Image too large (${sizeInKB}KB) even after aggressive compression. Try using a smaller or simpler image.`
              )
            )
            return
          }

          console.log(`Image compressed to ${sizeInKB}KB`)
          resolve(compressed)
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'))
      }
    })
  }

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions()
  }, [])

  // Filter questions when search query changes
  useEffect(() => {
    // Deduplicate questions by ID first
    const seen = new Set<string>()
    const uniqueQuestions = questions.filter((q) => {
      if (seen.has(q.id)) {
        return false
      }
      seen.add(q.id)
      return true
    })

    if (searchQuery.trim() === '') {
      setFilteredQuestions(uniqueQuestions)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredQuestions(
        uniqueQuestions.filter(
          (q) =>
            q.title.toLowerCase().includes(query) ||
            q.type.toLowerCase().includes(query) ||
            q.description?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, questions])

  const fetchQuestions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/questions', {
        credentials: 'include',
      })

      if (response.ok) {
        const { data } = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpandQuestion = (id: string) => {
    setExpandedQuestions(new Set([id]))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      options: ['', '', ''],
      imageOptions: [{ url: '', label: '' }],
    })
    setQuestionType('MCQ')
    setEditingId(null)
  }

  const handleAddOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ''],
    }))
  }

  const handleRemoveOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.title.trim()) {
      alert('Question title is required')
      return
    }

    // For MCQ and MULTI_OPTION, validate options
    if ((questionType === 'MCQ' || questionType === 'MULTI_OPTION') && 
        formData.options.filter((o) => o.trim()).length < 2) {
      alert('Please provide at least 2 options for this question type')
      return
    }

    // For IMAGE_OPTION, validate image options
    if (questionType === 'IMAGE_OPTION' &&
        formData.imageOptions.filter((o) => o.url && o.url.trim()).length < 2) {
      alert('Please provide at least 2 image options for this question type')
      return
    }

    try {
      setIsSubmitting(true)
      setUploadProgress(10)

      const payload: any = {
        title: formData.title,
        type: questionType,
      }

      if (formData.description && formData.description.trim()) {
        payload.description = formData.description
      }

      if ((questionType === 'MCQ' || questionType === 'MULTI_OPTION') && formData.options.length > 0) {
        payload.options = formData.options.filter((o) => o.trim())
      }

      // Compress images if present
      if (questionType === 'IMAGE_OPTION' && formData.imageOptions.length > 0) {
        const validImageOptions = formData.imageOptions.filter(
          (o) => o.url && o.url.trim()
        )
        
        // Compress each image
        setUploadProgress(20)
        const compressedImages = []
        try {
          for (let i = 0; i < validImageOptions.length; i++) {
            const option = validImageOptions[i]
            let compressedUrl = option.url
            
            // Only compress if it's a base64 image
            if (option.url.startsWith('data:image')) {
              try {
                compressedUrl = await compressImage(option.url)
              } catch (compressError) {
                alert(`Image ${i + 1} compression failed: ${compressError instanceof Error ? compressError.message : 'Unknown error'}`)
                setIsSubmitting(false)
                setUploadProgress(0)
                return
              }
            }
            
            compressedImages.push({
              label: option.label,
              url: compressedUrl,
            })
            
            setUploadProgress(20 + (i / validImageOptions.length) * 50)
          }
        } catch (error) {
          alert(`Error processing images: ${error instanceof Error ? error.message : 'Unknown error'}`)
          setIsSubmitting(false)
          setUploadProgress(0)
          return
        }
        
        payload.imageOptions = compressedImages
      }

      setUploadProgress(80)

      const url = editingId ? `/api/admin/questions/${editingId}` : '/api/admin/questions'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })

      setUploadProgress(90)

      if (response.ok) {
        const { data } = await response.json()
        if (editingId) {
          // Update existing question
          setQuestions((prev) =>
            prev.map((q) => (q.id === editingId ? data : q))
          )
        } else {
          // Add new question - check if it already exists to prevent duplicates
          setQuestions((prev) => {
            // Filter out any existing question with the same ID
            const filtered = prev.filter((q) => q.id !== data.id)
            return [data, ...filtered]
          })
        }
        setUploadProgress(100)
        resetForm()
        setIsOpen(false)
      } else {
        const error = await response.json()
        const errorMessage = error.details 
          ? `${error.error}: ${JSON.stringify(error.details, null, 2)}`
          : error.error || 'Failed to save question'
        
        console.error('Question save failed:', error)
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Error saving question')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handleEditQuestion = (question: Question) => {
    const frontendType = question.type === 'IMAGE_MCQ' ? 'IMAGE_OPTION' : question.type
    setFormData({
      title: question.title,
      description: question.description || '',
      options: question.options && question.options.length > 0 ? question.options : ['', '', ''],
      imageOptions: question.imageOptions && question.imageOptions.length > 0 ? question.imageOptions : [{ url: '', label: '' }],
    })
    setQuestionType(frontendType)
    setEditingId(question.id)
    setIsOpen(true)
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id))
      } else {
        alert('Failed to delete question')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Error deleting question')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Question Bank</h1>
          <p className="text-slate-600 mt-1">Create and manage survey questions</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Question' : 'Create New Question'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-2">Question Type</label>
                  <Select value={questionType} onValueChange={setQuestionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">Multiple Choice (Single)</SelectItem>
                      <SelectItem value="MULTI_OPTION">Multiple Choice (Multi-Select)</SelectItem>
                      <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                      <SelectItem value="SUBJECTIVE">Subjective (Text)</SelectItem>
                      <SelectItem value="IMAGE_OPTION">Image-Based Options</SelectItem>
                      <SelectItem value="RATING">Rating Scale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Question Title *</label>
                <Input
                  placeholder="Enter question text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <Textarea
                  placeholder="Add any additional context or instructions"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              {(questionType === 'MCQ' || questionType === 'MULTI_OPTION') && (
                <div>
                  <label className="block text-sm font-medium mb-2">Options *</label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                        />
                        {formData.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                            className="text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              {questionType === 'IMAGE_OPTION' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Image Options *</label>
                  <p className="text-xs text-slate-500 mb-3">
                    💡 Images will be automatically compressed to 100-150KB. Use simple/optimized images (photos, diagrams, icons). Avoid complex graphics.
                  </p>
                  <div className="space-y-3">
                    {formData.imageOptions.map((option, index) => (
                      <div key={index} className="space-y-2 p-3 border rounded-lg bg-slate-50">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Upload Image
                          </label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                // Check file size before processing (max 5MB to allow room for compression)
                                const maxFileSize = 5 * 1024 * 1024 // 5MB
                                if (file.size > maxFileSize) {
                                  alert(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum: 5MB`)
                                  e.target.value = ''
                                  return
                                }

                                const reader = new FileReader()
                                reader.onload = (event) => {
                                  const newImageOptions = [...formData.imageOptions]
                                  newImageOptions[index].url = event.target?.result as string
                                  setFormData((prev) => ({
                                    ...prev,
                                    imageOptions: newImageOptions,
                                  }))
                                }
                                reader.onerror = () => {
                                  alert('Failed to read file')
                                }
                                reader.readAsDataURL(file)
                              }
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Label
                          </label>
                          <Input
                            placeholder="Enter label"
                            value={option.label || ''}
                            onChange={(e) => {
                              const newImageOptions = [...formData.imageOptions]
                              newImageOptions[index].label = e.target.value
                              setFormData((prev) => ({
                                ...prev,
                                imageOptions: newImageOptions,
                              }))
                            }}
                          />
                        </div>

                        {option.url && (
                          <div className="relative w-20 h-20 bg-white border rounded overflow-hidden">
                            <img
                              src={option.url}
                              alt={`Preview ${index}`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newImageOptions = [...formData.imageOptions]
                                newImageOptions[index].url = ''
                                setFormData((prev) => ({
                                  ...prev,
                                  imageOptions: newImageOptions,
                                }))
                              }}
                              className="absolute top-0 right-0 bg-red-500 text-white hover:bg-red-600 h-5 w-5 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}

                        {formData.imageOptions.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newImageOptions = formData.imageOptions.filter(
                                (_, i) => i !== index
                              )
                              setFormData((prev) => ({
                                ...prev,
                                imageOptions: newImageOptions,
                              }))
                            }}
                            className="text-red-600 w-full"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove Image
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          imageOptions: [
                            ...prev.imageOptions,
                            { url: '', label: '' },
                          ],
                        }))
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Image Option
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                {isSubmitting && (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        {uploadProgress < 50 ? 'Compressing images...' : uploadProgress < 90 ? 'Saving...' : 'Finalizing...'}
                      </span>
                      <span className="text-sm font-medium text-slate-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false)
                    resetForm()
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-slate-900 hover:bg-slate-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : editingId ? 'Update Question' : 'Create Question'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <Input
            placeholder="Search questions by title, type, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <p className="text-slate-600 text-center py-8">
              {questions.length === 0
                ? 'No questions created yet.'
                : 'No questions match your search.'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => {
                const isExpanded = expandedQuestions.has(question.id)
                return (
                  <div
                    key={question.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                      onClick={() => toggleExpandQuestion(question.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {(question.options?.length > 0 || question.imageOptions?.length > 0) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleExpandQuestion(question.id)
                                }}
                                className="text-slate-600 hover:text-slate-900"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </button>
                            )}
                            <div>
                              <h3 className="font-semibold text-slate-900">{question.title}</h3>
                              {question.description && (
                                <p className="text-sm text-slate-600 mt-1">{question.description}</p>
                              )}
                              <div className="flex gap-4 mt-2">
                                <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-700">
                                  {question.type === 'IMAGE_OPTION' ? 'Image-Based Options' : question.type}
                                </span>
                                {question.options && question.options.length > 0 && (
                                  <span className="text-sm text-slate-600">
                                    {question.options.length} options
                                  </span>
                                )}
                                {question.imageOptions && question.imageOptions.length > 0 && (
                                  <span className="text-sm text-slate-600">
                                    {question.imageOptions.length} images
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditQuestion(question)
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteQuestion(question.id)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && question.options && question.options.length > 0 && (
                      <div className="p-4 border-t bg-white">
                        <p className="text-sm font-medium text-slate-700 mb-2">Options:</p>
                        <div className="space-y-2">
                          {question.options.map((option, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-2 rounded bg-slate-50"
                            >
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-medium">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="text-slate-700">{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isExpanded && question.imageOptions && question.imageOptions.length > 0 && (
                      <div className="p-4 border-t bg-white">
                        <p className="text-sm font-medium text-slate-700 mb-3">Image Options:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {question.imageOptions.map((imageOption, idx) => (
                            <div
                              key={idx}
                              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                              <img
                                src={imageOption.url}
                                alt={imageOption.label || `Option ${idx + 1}`}
                                className="w-full h-40 object-cover bg-slate-100"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160"%3E%3Crect fill="%23e2e8f0" width="200" height="160"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="%23475569"%3EImage Not Found%3C/text%3E%3C/svg%3E'
                                }}
                              />
                              {imageOption.label && (
                                <div className="p-2 bg-slate-50 text-center">
                                  <p className="text-xs font-medium text-slate-700">{imageOption.label}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}






