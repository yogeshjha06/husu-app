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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let client: MongoClient | null = null
    const { id } = await params

    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Find the form
        const form = await db.collection('forms').findOne({ _id: new ObjectId(id) })

        if (!form) {
            return NextResponse.json({ error: 'Form not found' }, { status: 404 })
        }

        // Check for existing response to prevent re-opening if SUBMITTED
        const existingResponse = await db.collection('form_responses').findOne({
            user_id: new ObjectId(user.id),
            form_id: new ObjectId(id)
        })

        // If it's a standard form, handle the detailed question objects
        let questions: any[] = []
        if (form.type === 'SINGLE_PAGE' && form.questions) {
            // Some forms might have IDs (strings), others might have full objects
            const questionArray = Array.isArray(form.questions) ? form.questions : []

            const idsToFetch: ObjectId[] = []
            const embeddedQuestions: any[] = []

            questionArray.forEach((q: any) => {
                if (typeof q === 'string' && ObjectId.isValid(q)) {
                    idsToFetch.push(new ObjectId(q))
                } else if (q && typeof q === 'object') {
                    const idStr = q.id || q._id
                    if (idStr && ObjectId.isValid(idStr.toString())) {
                        idsToFetch.push(new ObjectId(idStr.toString()))
                    } else {
                        // If it's a full object without a valid lookup ID or already has fields, treat as embedded
                        embeddedQuestions.push({ ...q, id: (q.id || q._id || '').toString() })
                    }
                }
            })

            // Fetch any external questions
            let fetchedQuestions: any[] = []
            if (idsToFetch.length > 0) {
                fetchedQuestions = await db.collection('questions').find({ _id: { $in: idsToFetch } }).toArray()
            }

            // Map back to maintain order and combine with embedded ones
            questions = questionArray.map((q: any) => {
                const idStr = (typeof q === 'string' ? q : (q.id || q._id || '')).toString()
                const fetched = fetchedQuestions.find(fq => fq._id.toString() === idStr)
                if (fetched) return { ...fetched, id: fetched._id.toString() }

                // If not in DB, check if it was already a complete embedded object
                if (typeof q === 'object' && (q.title || q.question_text)) {
                    return { ...q, id: idStr }
                }
                return null
            }).filter(Boolean)
        }

        return NextResponse.json({
            data: {
                ...form,
                id: form._id.toString(),
                questions: questions,
                response_status: existingResponse?.status || 'PENDING'
            }
        })

    } catch (error) {
        console.error('Fetch Survey Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
