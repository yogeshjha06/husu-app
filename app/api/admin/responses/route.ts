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

export async function GET(req: NextRequest) {
    let client: MongoClient | null = null
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type') || 'ROOT'
    const id = searchParams.get('id')
    const org_id = searchParams.get('org_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit

    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        if (type === 'ROOT') {
            const orgs = await db.collection('organizations').find({}).toArray()
            return NextResponse.json({
                data: {
                    organizations: orgs.map(o => ({ ...o, id: o._id.toString(), name: o.name }))
                }
            })
        }

        if (type === 'ORG' && id) {
            const idObj = ObjectId.isValid(id) ? new ObjectId(id) : null

            const assignments = await db.collection('form_assignments').find({
                $or: [
                    { org_id: id }, { assigned_to: id }, { organization_id: id },
                    ...(idObj ? [{ org_id: idObj }, { assigned_to: idObj }, { organization_id: idObj }] : [])
                ]
            }).toArray()

            const formIds = assignments.map(a => a.form_id || a.template_id).filter(Boolean)
            const lookupIds = []
            for (const fId of formIds) {
                lookupIds.push(fId)
                if (typeof fId === 'string' && ObjectId.isValid(fId)) lookupIds.push(new ObjectId(fId))
                else if (fId instanceof ObjectId) lookupIds.push(fId.toString())
            }

            const forms = await db.collection('forms').find({ _id: { $in: lookupIds } }).toArray()
            const uniqueForms = Array.from(new Map(forms.map(f => [f._id.toString(), f])).values())

            return NextResponse.json({
                data: {
                    forms: uniqueForms.map(f => ({
                        ...f,
                        id: f._id.toString(),
                        title: f.title || f.name || 'Untitled Form'
                    }))
                }
            })
        }

        if (type === 'FORM' && id && org_id) {
            const idObj = ObjectId.isValid(id) ? new ObjectId(id) : null
            const orgIdObj = ObjectId.isValid(org_id) ? new ObjectId(org_id) : null

            // First, find all users belonging to this organization
            const orgUsers = await db.collection('users').find({
                $or: [
                    { organization_id: org_id }, { org_id: org_id },
                    { organization_id: orgIdObj as any }, { org_id: orgIdObj as any }
                ]
            }).toArray()

            const orgUserIds = orgUsers.map(u => u._id)
            const orgUserIdsStr = orgUsers.map(u => u._id.toString())

            // Query responses that match the form AND (match Org fields OR match an Org User)
            const query = {
                $and: [
                    { $or: [{ form_id: id }, ...(idObj ? [{ form_id: idObj }] : [])] },
                    {
                        $or: [
                            { org_id: org_id }, { organization_id: org_id },
                            ...(orgIdObj ? [{ org_id: orgIdObj }, { organization_id: orgIdObj }] : []),
                            { user_id: { $in: orgUserIds } },
                            { user_id: { $in: orgUserIdsStr } }
                        ]
                    }
                ]
            }

            const [responses, total] = await Promise.all([
                db.collection('form_responses')
                    .find(query)
                    .sort({ submitted_at: -1, created_at: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                db.collection('form_responses').countDocuments(query)
            ])

            const formLookupId = idObj || id
            const form = await db.collection('forms').findOne({ _id: formLookupId as any })
            const formQuestions = await db.collection('form_questions').find({
                $or: [{ form_id: id }, ...(idObj ? [{ form_id: idObj }] : [])]
            }).toArray()

            const orderedQuestions: any[] = []
            const addedQIds = new Set()

            if (form) {
                const embedded = [...(form.slides || []), ...(form.steps || []), ...(form.questions || [])]
                embedded.forEach((s: any) => {
                    if (!s || ['welcome', 'conclusion', 'video', 'start', 'intro', 'intro_video'].includes(s.type)) return
                    const qId = String(s.id || s._id || s.question_id)
                    if (addedQIds.has(qId)) return

                    let qText = s.title || s.question_text || s.question || 'Untitled Question'
                    let qType = s.type || 'SUBJECTIVE'
                    let qOptions = s.options || s.image_options || s.imageOptions || []

                    if (s.question && typeof s.question === 'object') {
                        qText = s.question.question || s.question.title || qText
                        qType = s.question.type || qType
                        qOptions = s.question.options || s.question.image_options || s.question.imageOptions || qOptions
                    }

                    orderedQuestions.push({ id: qId, question_text: qText, type: qType, options: qOptions })
                    addedQIds.add(qId)
                })

                formQuestions.forEach(q => {
                    const qId = q._id.toString()
                    if (!addedQIds.has(qId)) {
                        orderedQuestions.push({
                            id: qId, question_text: q.title || q.question_text || 'Untitled Question',
                            type: q.type || 'SUBJECTIVE', options: q.options || q.imageOptions || []
                        })
                        addedQIds.add(qId)
                    }
                })
            }

            // Map users to responses for email display
            const allResponseUserIds = responses.map(r => r.user_id).filter(Boolean)
            const uniqueRespUserIds = Array.from(new Set(allResponseUserIds))
            const lookupUserParams = uniqueRespUserIds.map(uid => ObjectId.isValid(uid) ? new ObjectId(uid) : uid)

            const users = await db.collection('users').find({
                _id: { $in: lookupUserParams as any }
            }).toArray()
            const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]))

            const enrichedResponses = responses.map(r => ({
                ...r, _id: r._id.toString(),
                user_email: userMap[r.user_id?.toString()]?.email || 'anonymous',
                questions: orderedQuestions
            }))

            return NextResponse.json({
                data: {
                    responses: enrichedResponses,
                    pagination: { total, page, limit, hasMore: skip + responses.length < total }
                }
            })
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    } catch (error) {
        console.error('Fetch Explorer Data Error:', error)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
