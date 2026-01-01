import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { MongoClient } from 'mongodb'
import { unlink } from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `${type}-${Date.now()}-${file.name}`
    const filepath = path.join(process.cwd(), 'public', 'uploads', filename)

    await writeFile(filepath, buffer)

    // persist metadata to DB
    try {
      const MONGO_URI = process.env.DATABASE_URL
      const DB_NAME = process.env.DB_NAME || 'husu-db'
      if (MONGO_URI) {
        const client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)
        const uploadedCollection = db.collection('uploaded_videos')
        await uploadedCollection.insertOne({
          filename,
          path: `/uploads/${filename}`,
          type,
          created_by: sessionCookie?.value || null,
          created_at: new Date()
        })
        await client.close()
      }
    } catch (err) {
      console.error('Failed to persist upload metadata:', err)
    }

    return NextResponse.json({ path: `/uploads/${filename}` })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const MONGO_URI = process.env.DATABASE_URL
    const DB_NAME = process.env.DB_NAME || 'husu-db'
    if (!MONGO_URI) {
      return NextResponse.json({ data: [] })
    }
    const client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)
    const uploadedCollection = db.collection('uploaded_videos')
    const rows = await uploadedCollection.find().sort({ created_at: -1 }).limit(100).toArray()
    await client.close()
    const data = rows.map((r) => ({ path: r.path, filename: r.filename, created_at: r.created_at }))
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Upload list error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { path: filePath } = body
    if (!filePath) return NextResponse.json({ error: 'missing path' }, { status: 400 })

    const MONGO_URI = process.env.DATABASE_URL
    const DB_NAME = process.env.DB_NAME || 'husu-db'

    // remove file from public/uploads
    try {
      const filename = filePath.split('/').pop()
      if (filename) {
        const abs = path.join(process.cwd(), 'public', 'uploads', filename)
        await unlink(abs).catch(() => {})
      }
    } catch (e) {
      console.warn('Failed to delete file from disk', e)
    }

    if (MONGO_URI) {
      const client = new MongoClient(MONGO_URI)
      await client.connect()
      const db = client.db(DB_NAME)
      const uploadedCollection = db.collection('uploaded_videos')
      await uploadedCollection.deleteMany({ path: filePath })
      await client.close()
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete upload error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
