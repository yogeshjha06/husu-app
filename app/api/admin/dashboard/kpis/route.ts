import { cookies } from 'next/headers'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

export async function GET(request: Request) {
  let client: MongoClient | null = null

  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session')

    if (!sessionCookie?.value) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = JSON.parse(sessionCookie.value)

    // Only HUSU_OWNER can access
    if (user.role !== 'HUSU_OWNER') {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    // Fetch KPI data from database
    const [
      totalQuestions,
      totalForms,
      activeForms,
      formResponses,
      activeUsers,
      totalOrganizations,
    ] = await Promise.all([
      db.collection('questions').countDocuments(),
      db.collection('forms').countDocuments(),
      db.collection('forms').countDocuments({ is_active: true, is_published: true }),
      db.collection('form_responses').countDocuments(),
      db.collection('users').countDocuments({ role: 'EMPLOYEE' }),
      db.collection('organizations').countDocuments(),
    ])

    return Response.json({
      totalQuestions,
      totalForms,
      activeForms,
      formResponses,
      activeUsers,
      totalOrganizations,
    })
  } catch (error) {
    console.error('KPI fetch error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}
