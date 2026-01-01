import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

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
        if (!user || !user.org_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        const org = await db.collection('organizations').findOne({ _id: new ObjectId(user.org_id) })

        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        return NextResponse.json({
            data: {
                id: org._id.toString(),
                name: org.name,
                logo_url: org.logo_url
            }
        })

    } catch (error) {
        console.error('Fetch Org Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
