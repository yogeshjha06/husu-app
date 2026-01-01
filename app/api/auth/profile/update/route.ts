import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

export async function POST(request: Request) {
    let client: MongoClient | null = null

    try {
        const { first_name, last_name, email } = await request.json()
        const cookieStore = await cookies()
        const session = cookieStore.get('user_session')

        if (!session) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userData = JSON.parse(session.value)
        const userId = userData.id

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Check if email is already taken by another user
        if (email && email !== userData.email) {
            const existingUser = await db.collection('users').findOne({ email })
            if (existingUser) {
                return Response.json({ error: 'Email already in use' }, { status: 400 })
            }
        }

        const updateData: any = {}
        if (first_name) updateData.first_name = first_name
        if (last_name) updateData.last_name = last_name
        if (email) updateData.email = email
        updateData.updated_at = new Date()

        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        )

        // Update session cookie with new data
        const newUserData = {
            ...userData,
            ...updateData
        }

        cookieStore.set('user_session', JSON.stringify(newUserData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        })

        return Response.json({ message: 'Profile updated successfully', user: newUserData }, { status: 200 })

    } catch (error) {
        console.error('Profile Update Error:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
