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
        if (!user || user.role !== 'EMPLOYEE' || !user.org_id) {
            return NextResponse.json({ error: 'Unauthorized or no organization' }, { status: 401 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // 1. Fetch all form assignments for the employee's organization
        const assignments = await db
            .collection('form_assignments')
            .find({
                $or: [
                    { org_id: new ObjectId(user.org_id) },
                    { organization_id: user.org_id } // Fallback
                ],
                status: 'PENDING'
            })
            .toArray()

        if (assignments.length === 0) {
            return NextResponse.json({ data: [] })
        }

        const formIds = assignments.map(a => new ObjectId(a.form_id))

        // 2. Fetch form details
        const forms = await db.collection('forms').find({ _id: { $in: formIds } }).toArray()
        const formMap = Object.fromEntries(forms.map(f => [f._id.toString(), f]))

        // 3. Fetch existing responses for this user to check progress
        const responses = await db.collection('form_responses').find({
            user_id: new ObjectId(user.id),
            form_id: { $in: assignments.map(a => new ObjectId(a.form_id)) }
        }).toArray()
        const responseMap = Object.fromEntries(responses.map(r => [r.form_id.toString(), r]))

        // 4. Combine into tasks
        const tasks = assignments.map(a => {
            const fId = a.form_id.toString()
            const form = formMap[fId]
            const response = responseMap[fId]

            return {
                id: a._id.toString(),
                form_id: a.form_id,
                form_name: form?.name || 'Unknown Form',
                form_type: form?.type || 'SINGLE_PAGE',
                status: response?.status || 'PENDING',
                due_date: a.due_date,
                message: a.message || '',
                thumbnail_url: a.thumbnail_url || '',
                progress_percentage: response?.progress_percentage || 0,
                response_id: response?._id.toString() || null,
                assigned_at: a.assigned_at
            }
        })

        return NextResponse.json({ data: tasks })

    } catch (error) {
        console.error('Employee Tasks Fetch Error:', error)
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
