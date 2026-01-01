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

        const users = await db
            .collection('users')
            .find({})
            .sort({ created_at: -1 })
            .toArray()

        // Fetch organization names for the users
        const orgs = await db.collection('organizations').find({}).toArray()
        const orgMap: Record<string, string> = {}
        orgs.forEach(org => {
            orgMap[org._id.toString()] = org.name
        })

        const formattedUsers = users.map(u => ({
            id: u._id.toString(),
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            role: u.role,
            organization_id: u.organization_id,
            organization_name: u.organization_id ? orgMap[u.organization_id] : 'HUSU INTERNAL',
            created_at: u.created_at
        }))

        return NextResponse.json({ data: formattedUsers })

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
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
        const { email, password, firstName, lastName, role, organizationId } = body

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Check if user exists
        const existing = await db.collection('users').findOne({ email })
        if (existing) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        const newUser = {
            email,
            password, // In real app, hash this!
            first_name: firstName,
            last_name: lastName,
            role,
            organization_id: organizationId || null,
            created_at: new Date(),
            updated_at: new Date()
        }

        const result = await db.collection('users').insertOne(newUser)

        // If ORG_ADMIN, update the organization's primary admin info
        if (role === 'ORG_ADMIN' && organizationId) {
            await db.collection('organizations').updateOne(
                { _id: new ObjectId(organizationId) },
                {
                    $set: {
                        admin_name: `${firstName} ${lastName}`,
                        admin_email: email,
                        updated_at: new Date()
                    }
                }
            )
        }

        return NextResponse.json({
            message: 'User created successfully',
            user: { ...newUser, id: result.insertedId.toString() }
        }, { status: 201 })

    } catch (error) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
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

        await db.collection('users').deleteOne({ _id: new ObjectId(id) })

        return NextResponse.json({ message: 'User deleted' })

    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
