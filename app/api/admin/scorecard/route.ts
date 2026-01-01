import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

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

export async function GET(req: Request) {
    let client: MongoClient | null = null
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const orgId = searchParams.get('orgId')

        if (!orgId) {
            return NextResponse.json({ error: 'Org ID Required' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Try to find scorecard by string ID or ObjectId
        const query = ObjectId.isValid(orgId)
            ? { $or: [{ org_id: new ObjectId(orgId) }, { org_id: orgId }] }
            : { org_id: orgId };

        const scorecard = await db.collection('analytics').findOne(query)

        return NextResponse.json({
            data: scorecard || { kpis: [], benchmarks: [], milestones: [] }
        })

    } catch (error) {
        console.error('Scorecard Fetch Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}

export async function POST(req: Request) {
    let client: MongoClient | null = null
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { orgId, type, item } = body // type: 'KPI' | 'BENCHMARK' | 'MILESTONE'

        if (!orgId || !type || !item) {
            return NextResponse.json({ error: 'Missing Data' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        const query = ObjectId.isValid(orgId)
            ? { $or: [{ org_id: new ObjectId(orgId) }, { org_id: orgId }] }
            : { org_id: orgId };

        // Determine field to push to
        let updateField = '';
        if (type === 'KPI') updateField = 'kpis';
        else if (type === 'BENCHMARK') updateField = 'benchmarks';
        else if (type === 'MILESTONE') updateField = 'milestones';
        else return NextResponse.json({ error: 'Invalid Type' }, { status: 400 });

        // Add ID to item if missing
        const newItem = {
            ...item,
            id: item.id || new ObjectId().toString(),
            created_at: new Date()
        }

        // Upsert the document and push the new item
        await db.collection('analytics').updateOne(
            query,
            {
                $push: { [updateField]: newItem },
                $setOnInsert: {
                    org_id: ObjectId.isValid(orgId) ? new ObjectId(orgId) : orgId,
                    created_at: new Date()
                },
                $set: { updated_at: new Date() }
            },
            { upsert: true }
        )

        return NextResponse.json({ success: true, item: newItem })

    } catch (error) {
        console.error('Scorecard Update Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}

export async function DELETE(req: Request) {
    let client: MongoClient | null = null
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { orgId, type, itemId } = body

        if (!orgId || !type || !itemId) {
            return NextResponse.json({ error: 'Missing Data' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        const query = ObjectId.isValid(orgId)
            ? { $or: [{ org_id: new ObjectId(orgId) }, { org_id: orgId }] }
            : { org_id: orgId };

        let updateField = '';
        if (type === 'KPI') updateField = 'kpis';
        else if (type === 'BENCHMARK') updateField = 'benchmarks';
        else if (type === 'MILESTONE') updateField = 'milestones';

        await db.collection('analytics').updateOne(
            query,
            {
                $pull: { [updateField]: { id: itemId } } as any,
                $set: { updated_at: new Date() }
            }
        )

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Scorecard Delete Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
