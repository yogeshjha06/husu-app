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

export async function GET(req: Request) {
    let client: MongoClient | null = null

    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'ORG_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const orgIdStr = user.organization_id || user.org_id
        if (!orgIdStr) {
            return NextResponse.json({ error: 'Org ID missing' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Enforce Subscription Check
        const sub = await db.collection('subscriptions').findOne({
            $or: [
                { org_id: new ObjectId(orgIdStr) },
                { org_id: orgIdStr }
            ]
        })

        if (!sub || sub.status !== 'ACTIVE' || (sub.end_date && new Date(sub.end_date) < new Date())) {
            return NextResponse.json({
                error: 'Your organization subscription is suspended or expired. Please contact support.',
                data: [] // Return empty to prevent UI crash, or let 403 handle it
            }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '9')
        const skip = (page - 1) * limit

        // Fetch real data from 'resources' collection
        const total = await db.collection('resources').countDocuments({})
        const resources = await db.collection('resources')
            .find({})
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .toArray()

        return NextResponse.json({
            data: resources,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('Resource fetch error', error)
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
