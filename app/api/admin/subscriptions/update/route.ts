import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

export async function POST(req: Request) {
    let client: MongoClient | null = null

    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('user_session')
        if (!sessionCookie?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const user = JSON.parse(sessionCookie.value)
        if (user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const { org_id, plan_id, start_date, end_date, status } = body

        if (!org_id) {
            return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Upsert subscription
        const filter = ObjectId.isValid(org_id)
            ? { org_id: new ObjectId(org_id) }
            : { org_id: org_id };

        // Prepare ID for storage - prefer ObjectId if possible, else string
        const storageOrgId = ObjectId.isValid(org_id) ? new ObjectId(org_id) : org_id;

        const updateDoc = {
            $set: {
                org_id: storageOrgId, // Enforce ObjectId or safe string
                plan_id,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                status,
                updated_at: new Date()
            },
            $setOnInsert: {
                created_at: new Date()
            }
        }

        await db.collection('subscriptions').updateOne(filter, updateDoc, { upsert: true })

        // Also update Organization status field if it exists to keep sync
        let orgStatus = 'PENDING';
        if (status === 'ACTIVE') orgStatus = 'ACTIVE';
        if (status === 'INACTIVE' || status === 'SUSPENDED') orgStatus = 'SUSPENDED';

        const orgIdFilter = ObjectId.isValid(org_id) ? { _id: new ObjectId(org_id) } : { _id: org_id };

        await db.collection('organizations').updateOne(
            orgIdFilter,
            { $set: { status: orgStatus, updated_at: new Date() } }
        )

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Subscription Update Error:', error)
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
