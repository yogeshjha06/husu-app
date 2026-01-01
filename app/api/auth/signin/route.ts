import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

interface User {
  _id: ObjectId
  email: string
  password?: string
  first_name: string
  last_name: string
  role: string
  organization_id: string | ObjectId | null
  org_id?: string | ObjectId | null
  is_active: boolean
  first_time_setup?: boolean
  two_factor_enabled?: boolean
  two_factor_secret?: string
}

export async function POST(request: Request) {
  let client: MongoClient | null = null

  try {
    const { email, password, newPassword, isFirstTimeSetup, checkEnrollment } = await request.json()

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    // 1. Find the user
    const user = await db.collection('users').findOne<User>({ email })

    if (!user) {
      return Response.json(
        { error: 'Sorry, you are not yet enrolled. Please contact your admin for this access.' },
        { status: 403 }
      )
    }

    // 2. Handle First Time Setup (Setting new password)
    if (isFirstTimeSetup && newPassword) {
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            password: newPassword,
            first_time_setup: false,
            updated_at: new Date()
          }
        }
      )

      return Response.json({ message: 'Password set successfully. Please login.' }, { status: 200 })
    }

    // 3. Check if it's the user's first time or they are verifying enrollment
    // If checkEnrollment is true, we always return firstTime to allow password creation
    if (checkEnrollment || !user.password || user.first_time_setup === true) {
      return Response.json({
        firstTime: true,
        message: 'Welcome to HUSU! Please set your new password to continue.'
      }, { status: 200 })
    }

    // 4. Standard Login Validation
    if (!password) {
      return Response.json({ error: 'Password is required' }, { status: 400 })
    }

    // Master Admin Override for Demo
    const isMasterAdmin = email === 'admin@husu.com' && password === 'HusuAdmin@2024'
    const isDbValid = user.password === password

    if (!isMasterAdmin && !isDbValid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // 4.5 Check for 2FA
    if (user.two_factor_enabled) {
      console.log(`[AUTH] MFA Required for ${email}`)
      return Response.json({
        mfaRequired: true,
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      }, { status: 200 })
    }

    console.log(`[AUTH] MFA Skipped for ${email}. Proceeding to session creation.`)
    // 5. Success - Set Session
    const userData = {
      id: user._id.toString(),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      org_id: (user.org_id || user.organization_id)?.toString() || null,
      is_active: user.is_active,
      two_factor_enabled: !!user.two_factor_enabled,
    }

    const cookieStore = await cookies()
    cookieStore.set('user_session', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return Response.json({ user: userData }, { status: 200 })

  } catch (error) {
    console.error('Auth Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
