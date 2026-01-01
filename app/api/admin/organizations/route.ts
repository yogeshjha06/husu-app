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

        const organizations = await db
            .collection('organizations')
            .find({})
            .sort({ created_at: -1 })
            .toArray()

        const formattedOrgs = organizations.map(org => ({
            id: org._id.toString(),
            name: org.name,
            industry: org.industry,
            size: org.size,
            admin_name: org.admin_name,
            admin_email: org.admin_email,
            admin_phone: org.admin_phone,
            country_of_operation: org.country_of_operation,
            logo_url: org.logo_url,
            status: org.status,
            created_at: org.created_at
        }))

        return NextResponse.json({ data: formattedOrgs })

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}

export async function PUT(request: NextRequest) {
    let client: MongoClient | null = null

    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'HUSU_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, status, name, industry, size, adminName, adminEmail, adminPhone, countryOfOperation, website, logoUrl } = body

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        const dbFilter = (ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }) as any;

        const updateData: any = { updated_at: new Date() }
        if (status) updateData.status = status
        if (name) updateData.name = name
        if (industry) updateData.industry = industry
        if (size) updateData.size = size
        if (adminName) updateData.admin_name = adminName
        if (adminEmail) updateData.admin_email = adminEmail
        if (adminPhone !== undefined) updateData.admin_phone = adminPhone
        if (countryOfOperation) updateData.country_of_operation = countryOfOperation
        if (website !== undefined) updateData.website = website
        if (logoUrl !== undefined) updateData.logo_url = logoUrl

        await db.collection('organizations').updateOne(
            dbFilter,
            { $set: updateData }
        )

        // SYNC: If status was updated, also update the Subscription status
        if (status) {
            let subStatus = 'ACTIVE'
            if (status === 'SUSPENDED' || status === 'PENDING') {
                subStatus = 'INACTIVE'
            }

            const subFilter = (ObjectId.isValid(id)
                ? { $or: [{ org_id: new ObjectId(id) }, { org_id: id }] }
                : { org_id: id }) as any;

            try {
                await db.collection('subscriptions').updateOne(
                    subFilter,
                    { $set: { status: subStatus, updated_at: new Date() } }
                )
            } catch (syncError) {
                console.error('Subscription Sync Error:', syncError);
            }
        }

        return NextResponse.json({ message: 'Organization updated' })

    } catch (error) {
        return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
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

        const dbFilter = (ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }) as any;

        // Delete Organization
        await db.collection('organizations').deleteOne(dbFilter)

        // Delete associated Subscriptions
        const subFilter = (ObjectId.isValid(id)
            ? { $or: [{ org_id: new ObjectId(id) }, { org_id: id }] }
            : { org_id: id }) as any;

        await db.collection('subscriptions').deleteMany(subFilter)

        return NextResponse.json({ message: 'Organization deleted successfully' })

    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
