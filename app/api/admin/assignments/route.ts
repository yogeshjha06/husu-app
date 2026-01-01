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
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // 1. Fetch all required data
        const [users, orgs, forms, assignments, responses] = await Promise.all([
            db.collection('users').find({ role: { $ne: 'HUSU_OWNER' } }).toArray(),
            db.collection('organizations').find({}).toArray(),
            db.collection('forms').find({}).toArray(),
            db.collection('form_assignments').find({}).toArray(),
            db.collection('form_responses').find({}).toArray()
        ])

        const orgMap = Object.fromEntries(orgs.map(o => [o._id.toString(), o.name]))
        const formMap = Object.fromEntries(forms.map(f => [f._id.toString(), f.name]))

        // 2. Map assignments by organization
        const orgAssignments: Record<string, string[]> = {}
        assignments.forEach(a => {
            const orgId = a.org_id?.toString() || a.organization_id // Fallback for transition
            if (!orgId) return
            if (!orgAssignments[orgId]) orgAssignments[orgId] = []
            orgAssignments[orgId].push(a.form_id.toString())
        })

        // 3. Correlate data for each user
        const userData = users.map(u => {
            const userOrgId = u.organization_id
            const assignedFormIds = orgAssignments[userOrgId] || []

            // Current active forms for their org
            const formsWithStatus = assignedFormIds.map(fId => {
                const response = responses.find(r => r.user_id === u._id.toString() && r.form_id === fId)
                return {
                    form_id: fId,
                    form_name: formMap[fId] || 'Unknown Form',
                    status: response?.status || 'NOT_STARTED',
                    progress: response?.progress_percentage || 0
                }
            })

            // Lifetime stats
            const userResponses = responses.filter(r => r.user_id === u._id.toString())
            const completedCount = userResponses.filter(r => r.status === 'COMPLETED' || r.status === 'SUBMITTED').length
            const activeCount = userResponses.filter(r => r.status === 'IN_PROGRESS').length

            return {
                id: u._id.toString(),
                name: `${u.first_name} ${u.last_name}`,
                email: u.email,
                organization_name: orgMap[userOrgId] || 'HUSU INTERNAL',
                assigned_forms: formsWithStatus,
                stats: {
                    assigned_lifetime: assignedFormIds.length,
                    completed: completedCount,
                    active: activeCount,
                    pending: assignedFormIds.length - completedCount
                }
            }
        })

        return NextResponse.json({ data: userData })

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}

export async function POST(request: NextRequest) {
    let client: MongoClient | null = null

    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { organizationId, formIds, deadline } = body

        if (!organizationId || !formIds || !Array.isArray(formIds)) {
            return NextResponse.json({ error: 'Organization and forms are required' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        const assignments = formIds.map(formId => ({
            form_id: new ObjectId(formId),
            assigned_to: new ObjectId(organizationId),
            org_id: new ObjectId(organizationId),
            status: 'PENDING',
            assigned_date: new Date(),
            due_date: deadline ? new Date(deadline) : null,
            message: body.message || '',
            thumbnail_url: body.thumbnailUrl || '',
            created_at: new Date(),
            updated_at: new Date(),
            created_by: new ObjectId(user.id)
        }))

        // Validation: Check Subscription Status
        const sub = await db.collection('subscriptions').findOne({
            $or: [
                { org_id: new ObjectId(organizationId) },
                { org_id: organizationId }
            ]
        })

        if (!sub || sub.status !== 'ACTIVE' || (sub.end_date && new Date(sub.end_date) < new Date())) {
            return NextResponse.json({
                error: 'Assignment Blocked: Organization subscription is inactive or expired.'
            }, { status: 403 })
        }

        await db.collection('form_assignments').insertMany(assignments)

        return NextResponse.json({ message: 'Forms assigned successfully' }, { status: 201 })

    } catch (error) {
        console.error('Assignment Error:', error)
        return NextResponse.json({ error: 'Failed to create assignments' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}

export async function DELETE(request: NextRequest) {
    let client: MongoClient | null = null

    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        await db.collection('form_assignments').deleteOne({ _id: new ObjectId(id) })

        return NextResponse.json({ message: 'Assignment removed' })

    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
