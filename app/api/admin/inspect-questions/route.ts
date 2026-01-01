import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export const dynamic = 'force-dynamic'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

// Inspect existing questions to understand the actual schema
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null

  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    // Get a sample of existing questions
    const questions = await db.collection('questions').find().limit(5).toArray()

    if (questions.length === 0) {
      return NextResponse.json({
        message: 'No questions found in database',
        count: 0
      })
    }

    // Analyze the structure
    const analysis = questions.map((q, idx) => ({
      index: idx,
      keys: Object.keys(q),
      sampleData: {
        _id: q._id?.toString(),
        title: q.title,
        created_by: q.created_by,
        created_at: q.created_at,
        // Add any other fields that exist
        ...Object.entries(q).reduce((acc, [key, value]) => {
          if (!['_id', 'title', 'created_by', 'created_at'].includes(key)) {
            acc[key] = typeof value === 'string' ? value.substring(0, 50) : typeof value
          }
          return acc
        }, {} as Record<string, any>)
      }
    }))

    return NextResponse.json({
      totalQuestions: (await db.collection('questions').countDocuments()),
      sampleQuestions: analysis
    })
  } catch (error: any) {
    console.error('Inspection error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
