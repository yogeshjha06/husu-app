import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

interface UserProfile {
  id: string
  email: string
  role: string
}

async function getSessionUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('user_session')
  if (!sessionCookie?.value) return null
  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null

  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'HUSU_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    client = new MongoClient(MONGO_URI, { maxPoolSize: 10 })
    await client.connect()
    const db = client.db(DB_NAME)

    const forms = await db
      .collection('forms')
      .find({})
      .sort({ created_at: -1 })
      .limit(100)
      .toArray()

    const formattedForms = forms.map((form) => ({
      id: form._id.toString(),
      name: form.name,
      type: form.type,
      description: form.description,
      status: form.status || 'INACTIVE',
      questionCount: form.type === 'INTERACTIVE'
        ? (form.slides || []).filter((s: any) => s.type === 'question').length
        : (form.questions?.length || 0),
      slideCount: form.type === 'INTERACTIVE' ? (form.slides || []).length : undefined,
      createdAt: form.created_at,
    }))

    return NextResponse.json({ data: formattedForms })
  } catch (error) {
    console.error('Get forms error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}

export async function POST(request: NextRequest) {
  let client: MongoClient | null = null

  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'HUSU_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, description, headerImage, backgroundColor, questions, template, slides } = body

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    const formData: any = {
      name,
      type,
      description: description || '',
      status: 'INACTIVE',
      created_by: new ObjectId(user.id),
      created_at: new Date(),
      updated_at: new Date(),
    }

    // Optional fields - only add if provided
    if (headerImage) formData.header_image = headerImage
    if (backgroundColor) formData.background_color = backgroundColor
    if (template) formData.template = template
    if (slides) formData.slides = slides
    if (questions && questions.length > 0) {
      formData.question_ids = questions.map((q: any) =>
        typeof q.id === 'string' && q.id.match(/^[0-9a-fA-F]{24}$/)
          ? new ObjectId(q.id)
          : q.id
      )
      formData.questions = questions
    }

    const result = await db.collection('forms').insertOne(formData)

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString()
    })
  } catch (error) {
    console.error('Create form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
