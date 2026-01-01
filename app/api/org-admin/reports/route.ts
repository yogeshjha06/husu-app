import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
        if (!user || user.role !== 'ORG_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const orgId = user.organization_id || user.org_id
        if (!orgId) {
            return NextResponse.json({ error: 'Organization ID not found' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Fetch reports from 'reports' collection
        const reports = await db.collection('reports').find({
            $or: [
                { organization_id: orgId },
                { organization_id: new ObjectId(orgId) },
                { org_id: orgId },
                { org_id: new ObjectId(orgId) }
            ]
        }).sort({ created_at: -1 }).toArray()

        return NextResponse.json({ data: reports })

    } catch (error) {
        console.error('Reports Fetch Error:', error)
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
