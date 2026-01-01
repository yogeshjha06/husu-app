'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Plus, FileText, Video, Eye, Edit2, Trash2, Loader2, Play } from 'lucide-react'
import Link from 'next/link'

interface Form {
  id: string
  name: string
  type: 'SINGLE_PAGE' | 'INTERACTIVE'
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
  questionCount: number
  slideCount?: number
  createdAt: string
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/admin/forms', {
        credentials: 'include',
      })
      if (response.ok) {
        const { data } = await response.json()
        setForms(data)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this form?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/forms/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        setForms(forms.filter(f => f.id !== id))
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredForms = forms.filter((form) =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <Dialog open={!!deletingId}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Deleting Form</DialogTitle>
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg font-semibold">Deleting form...</p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Forms</h1>
          <p className="text-slate-600 mt-1">Create and manage survey forms</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/forms/create?type=SINGLE_PAGE">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Single Page Form
            </Button>
          </Link>
          <Link href="/admin/forms/create-interactive">
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Video className="w-4 h-4 mr-2" />
              Interactive Form
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Forms</CardTitle>
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredForms.length === 0 ? (
            <p className="text-slate-600 text-center py-8">
              {forms.length === 0 ? 'No forms created yet.' : 'No forms match your search.'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredForms.map((form) => (
                <div
                  key={form.id}
                  className="border rounded-lg p-4 bg-slate-50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{form.name}</h3>
                      {form.description && (
                        <p className="text-sm text-slate-600 mt-1">{form.description}</p>
                      )}
                      <div className="flex gap-4 mt-2">
                        <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-700">
                          {form.type === 'SINGLE_PAGE' ? 'Single Page' : 'Interactive'}
                        </span>
                        <span className="text-sm text-slate-600">
                          {form.type === 'INTERACTIVE' ? `${form.slideCount || 0} slides` : `${form.questionCount} questions`}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-sm ${form.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                          {form.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">

                      <Link href={form.type === 'INTERACTIVE' ? `/admin/forms/create-interactive?id=${form.id}&preview=true` : `/admin/forms/${form.id}/preview`}>
                        <Button variant="ghost" size="sm" className="text-slate-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={form.type === 'INTERACTIVE' ? `/admin/forms/create-interactive?id=${form.id}` : `/admin/forms/${form.id}/edit`}>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(form.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
