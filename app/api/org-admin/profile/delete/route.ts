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

export async function DELETE() {
    let client: MongoClient | null = null

    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'ORG_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        const userId = new ObjectId(user.id || user._id)

        // Delete the user
        const result = await db.collection('users').deleteOne({ _id: userId })

        if (result.deletedCount === 1) {
            // Clear session cookie
            const response = NextResponse.json({ success: true })
            response.cookies.delete('user_session')
            return response
        } else {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

    } catch (error) {
        console.error('Delete Org Admin Account Error:', error)
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
