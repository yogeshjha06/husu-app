import { MongoClient } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

export async function POST(request: NextRequest) {
    let client: MongoClient | null = null

    try {
        const body = await request.json()
        const {
            name,
            industry,
            size,
            adminName,
            adminEmail,
            adminPhone,
            countryOfOperation,
            website,
            logoUrl,
            privacyAccepted,
            termsAccepted
        } = body

        if (!name || !adminEmail || !privacyAccepted || !termsAccepted) {
            return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Check if organization or email already exists
        const existingOrg = await db.collection('organizations').findOne({
            $or: [{ name }, { admin_email: adminEmail }]
        })

        if (existingOrg) {
            return NextResponse.json({ error: 'Organization or Admin Email already registered' }, { status: 400 })
        }

        const newOrg = {
            name,
            industry,
            size,
            admin_name: adminName,
            admin_email: adminEmail,
            admin_phone: adminPhone,
            country_of_operation: countryOfOperation,
            website,
            logo_url: logoUrl,
            privacy_accepted: privacyAccepted,
            terms_accepted: termsAccepted,
            status: 'PENDING',
            created_at: new Date(),
            updated_at: new Date(),
        }

        const result = await db.collection('organizations').insertOne(newOrg)

        return NextResponse.json({
            message: 'Registration successful!',
            id: result.insertedId
        }, { status: 201 })

    } catch (error: any) {
        console.error('Registration Error:', error)
        return NextResponse.json({ error: 'Failed to register organization' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
