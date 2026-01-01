import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

async function getSessionUser() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session')
    if (!sessionCookie?.value) return null
    try {
        return JSON.parse(sessionCookie.value)
    } catch {
        return null
    }
}

export async function GET() {
    let client: MongoClient | null = null
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        const resources = await db.collection('resources').find({}).sort({ created_at: -1 }).toArray()

        return NextResponse.json({ data: resources })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}

export async function POST(req: Request) {
    let client: MongoClient | null = null
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { title, description, type, url, thumbnail, duration, size, author } = body

        if (!title || !type || !url) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        const newResource: any = {
            title,
            description: description || '', // Ensure description is at least empty string
            type,
            url,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: new ObjectId(user.id) // Enforce ObjectId
        }

        // Optional fields with specific checks
        if (thumbnail) newResource.thumbnail = thumbnail;
        if (duration) newResource.duration = duration;
        if (size) newResource.size = size;

        // Default author if not provided
        newResource.author = author || 'HUSU Admin';

        await db.collection('resources').insertOne(newResource)

        return NextResponse.json({ success: true, resource: newResource })
    } catch (error) {
        console.error('Resource Creation Error:', error)
        return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}

export async function DELETE(req: Request) {
    let client: MongoClient | null = null
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        await db.collection('resources').deleteOne({ _id: new ObjectId(id) })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
