import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

export async function POST() {
    let client: MongoClient | null = null

    try {
        const cookieStore = await cookies()
        const session = cookieStore.get('user_session')

        if (!session) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userData = JSON.parse(session.value)

        // Generate Secret
        const secret = speakeasy.generateSecret({
            name: `HUSU (${userData.email})`
        })

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!)

        return Response.json({
            secret: secret.base32,
            qrCode: qrCodeUrl
        }, { status: 200 })

    } catch (error) {
        console.error('2FA Generate Error:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
