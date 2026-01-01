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
        if (!user || user.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Fetch all SUBMITTED responses for this user
        const completedResponses = await db.collection('form_responses').find({
            user_id: new ObjectId(user.id),
            status: 'SUBMITTED'
        }).toArray()

        if (completedResponses.length === 0) {
            return NextResponse.json({ data: [] })
        }

        const formIds = completedResponses.map(r => new ObjectId(r.form_id))
        const forms = await db.collection('forms').find({ _id: { $in: formIds } }).toArray()
        const formMap = Object.fromEntries(forms.map(f => [f._id.toString(), f]))

        const certificates = completedResponses.map(r => {
            const form = formMap[r.form_id.toString()]
            return {
                id: r._id.toString(),
                form_id: r.form_id.toString(),
                form_name: form?.name || 'Unknown Assessment',
                issued_at: r.updated_at || r.created_at,
                certificate_url: '#' // We use the overlay component to generate/view
            }
        })

        return NextResponse.json({ data: certificates })

    } catch (error) {
        console.error('Certificates Fetch Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
