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

export async function POST(request: NextRequest) {
    let client: MongoClient | null = null

    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { form_id, answers, progress_percentage, status } = body

        if (!form_id) {
            return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // 1. Map answers from object to array as required by MongoDB validator
        // The validator expects an array
        const answersArray = Object.entries(answers || {}).map(([qId, val]) => ({
            question_id: ObjectId.isValid(qId) ? new ObjectId(qId) : qId,
            answer: val
        }))

        // 2. Prepare update object matching the collection's JSON schema validator
        const filter = {
            user_id: new ObjectId(user.id),
            form_id: new ObjectId(form_id)
        }

        // Fix status to match enum: PENDING, IN_PROGRESS, SUBMITTED
        // Map "COMPLETED" (from UI) to "SUBMITTED" (database required)
        let dbStatus = status || 'IN_PROGRESS'
        if (dbStatus === 'COMPLETED') dbStatus = 'SUBMITTED'

        const update = {
            $set: {
                user_id: new ObjectId(user.id),
                form_id: new ObjectId(form_id),
                answers: answersArray,
                progress_percentage: Math.floor(progress_percentage || 0),
                status: dbStatus,
                updated_at: new Date()
            },
            $setOnInsert: {
                created_at: new Date()
            }
        }

        const result = await db.collection('form_responses').updateOne(filter, update, { upsert: true })

        return NextResponse.json({
            success: true,
            message: 'Response saved successfully',
            id: result.upsertedId ? result.upsertedId.toString() : null
        })

    } catch (error) {
        console.error('Submit Response Error:', error)
        return NextResponse.json({
            error: 'Document validation failed or internal error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
