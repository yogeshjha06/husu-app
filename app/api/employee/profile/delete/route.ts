import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

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

export async function DELETE() {
    let client: MongoClient | null = null

    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        const userId = new ObjectId(user.id)

        // 1. Delete all form responses
        await db.collection('form_responses').deleteMany({ user_id: userId })

        // 2. Delete certificates (which are derived from form_responses, but just in case they are stored)
        // Currently, certificates are dynamic, but we'll clear any relevant caches if they existed.

        // 3. Delete user profile/account
        await db.collection('users').deleteOne({ _id: userId })

        // 4. Clear the session cookie
        const cookieStore = await cookies()
        cookieStore.delete('user_session')

        return NextResponse.json({ message: 'All data deleted successfully' })

    } catch (error) {
        console.error('Data Deletion Error:', error)
        return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
