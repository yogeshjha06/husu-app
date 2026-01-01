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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | null = null

  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'HUSU_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    const form = await db.collection('forms').findOne({ _id: new ObjectId(id) })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        id: form._id.toString(),
        name: form.name,
        type: form.type,
        description: form.description,
        header_image: form.header_image,
        background_color: form.background_color,
        template: form.template,
        questions: form.questions,
        slides: form.slides,
        questionCount: form.type === 'INTERACTIVE'
          ? (form.slides || []).filter((s: any) => s.type === 'question').length
          : (form.questions?.length || 0),
        status: form.status,
      }
    })
  } catch (error) {
    console.error('Get form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | null = null

  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'HUSU_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, type, description, headerImage, backgroundColor, questions, template, slides } = body

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    const updateData: any = {
      name,
      type,
      description: description || '',
      updated_at: new Date(),
    }

    if (headerImage !== undefined) updateData.header_image = headerImage
    if (backgroundColor !== undefined) updateData.background_color = backgroundColor
    if (template) updateData.template = template
    if (slides) updateData.slides = slides
    if (questions) updateData.questions = questions

    await db.collection('forms').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | null = null

  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'HUSU_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    await db.collection('forms').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
