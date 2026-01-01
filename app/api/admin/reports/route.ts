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
            const reports = await db.collection('reports').find({
                $or: [{ org_id: id }, { organization_id: id }, { org_id: new ObjectId(id) }]
            }).toArray()

            return NextResponse.json({
                data: {
                    reports: reports.map(r => ({ ...r, id: r._id.toString() }))
                }
            })
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    } catch (error) {
        console.error('Fetch Reports Error:', error)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}

export async function POST(req: NextRequest) {
    let client: MongoClient | null = null
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { id, ...updateData } = body

        // Data Sanitization for MongoDB Schema Validation
        const sanitizedData: any = { ...updateData }

        // Remove identifiers from payload
        delete sanitizedData._id
        delete sanitizedData.id

        // Convert IDs to ObjectIds
        if (sanitizedData.org_id && typeof sanitizedData.org_id === 'string') {
            try { sanitizedData.org_id = new ObjectId(sanitizedData.org_id) } catch (e) { }
        }
        if (sanitizedData.organization_id && typeof sanitizedData.organization_id === 'string') {
            try { sanitizedData.organization_id = new ObjectId(sanitizedData.organization_id) } catch (e) { }
        }

        // Convert Dates back to Date objects
        if (sanitizedData.created_at) sanitizedData.created_at = new Date(sanitizedData.created_at)
        if (sanitizedData.updated_at) sanitizedData.updated_at = new Date(sanitizedData.updated_at)

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        if (id) {
            // Update
            await db.collection('reports').updateOne(
                { _id: new ObjectId(id) },
                { $set: { ...sanitizedData, updated_at: new Date() } }
            )
            return NextResponse.json({ success: true })
        } else {
            // Create
            const result = await db.collection('reports').insertOne({
                ...sanitizedData,
                created_at: new Date(),
                updated_at: new Date()
            })
            return NextResponse.json({ success: true, id: result.insertedId })
        }
    } catch (error) {
        console.error('Save Report Error:', error)
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}

export async function DELETE(req: NextRequest) {
    let client: MongoClient | null = null
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        await db.collection('reports').deleteOne({ _id: new ObjectId(id) })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete Report Error:', error)
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
