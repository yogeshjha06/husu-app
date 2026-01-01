import { cookies } from 'next/headers'
import { MongoClient } from 'mongodb'
import { NextResponse } from 'next/server'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

export async function GET() {
    let client: MongoClient | null = null

    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('user_session')

        if (!sessionCookie?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = JSON.parse(sessionCookie.value)
        if (user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Detailed access required' }, { status: 403 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Fetch all organizations
        const orgs = await db.collection('organizations').find({}).toArray()

        // Fetch all subscriptions
        const subs = await db.collection('subscriptions').find({}).toArray()

        // Merge data
        const mergedData = orgs.map(org => {
            // Find subscription where org_id matches either the ObjectId or String version of Org ID
            const sub = subs.find(s =>
                s.org_id?.toString() === org._id.toString() ||
                s.organization_id?.toString() === org._id.toString() ||
                s.orgId?.toString() === org._id.toString()
            )

            let status = 'PENDING_ACTIVATION'

            if (sub) {
                // If end date is in the past, mark suspended
                if (sub.end_date && new Date(sub.end_date) < new Date()) {
                    status = 'SUSPENDED'
                } else {
                    status = sub.status || 'ACTIVE'
                }
            } else if (org.status === 'VERIFIED' || org.status === 'ACTIVE') {
                // Fallback: If org is verified in Client Desk but has no subscription record yet, show as Active
                status = 'ACTIVE'
            }

            return {
                _id: org._id,
                name: org.name,
                industry: org.industry,
                admin_email: org.admin_email,
                subscription: sub ? {
                    plan_id: sub.plan_id || 'custom_plan',
                    start_date: sub.start_date,
                    end_date: sub.end_date,
                    status: status
                } : null,
                calculated_status: status
            }
        })

        return NextResponse.json({ data: mergedData })

    } catch (error) {
        console.error('Admin Subscriptions Fetch Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
