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

        // 1. Fetch submitted/completed responses for this user
        const responses = await db.collection('form_responses').find({
            user_id: user.id.toString(),
            status: { $in: ['SUBMITTED', 'COMPLETED'] }
        }).sort({ completed_at: -1 }).toArray()

        if (responses.length === 0) {
            return NextResponse.json({ data: [] })
        }

        const formIds = responses.map(r => new ObjectId(r.form_id))

        // 2. Fetch form details
        const forms = await db.collection('forms').find({ _id: { $in: formIds } }).toArray()
        const formMap = Object.fromEntries(forms.map(f => [f._id.toString(), f]))

        // 3. Combine into task data
        const completedTasks = responses.map(r => {
            const form = formMap[r.form_id.toString()]
            return {
                id: r._id.toString(),
                form_name: form?.name || 'Unknown Form',
                completed_at: r.completed_at || r.updated_at,
                time_spent_seconds: r.time_spent_seconds || 0,
                score: r.score || (Math.random() * 20 + 80), // Mock score if missing
            }
        })

        return NextResponse.json({ data: completedTasks })

    } catch (error) {
        console.error('Completed Tasks Fetch Error:', error)
        return NextResponse.json({ error: 'Failed to fetch completed tasks' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
