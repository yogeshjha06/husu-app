import { MongoClient } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null

  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    const questions = await db.collection('questions').find().limit(10).toArray()

    if (questions.length === 0) {
      return NextResponse.json({
        message: 'No questions found in database',
        count: 0
      })
    }

    // Show the actual structure of existing questions
    const analysis = questions.map((q, idx) => ({
      index: idx,
      _id: q._id?.toString(),
      keys: Object.keys(q).sort(),
      sampleValues: {
        title: q.title,
        type: q.type,
        created_by: q.created_by?.toString?.() || q.created_by,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        is_active: q.is_active,
        options: Array.isArray(q.options) ? `[${q.options.length} items]` : q.options,
        image_options: Array.isArray(q.image_options) ? `[${q.image_options.length} items]` : q.image_options,
      }
    }))

    return NextResponse.json({
      totalQuestions: await db.collection('questions').countDocuments(),
      sampleQuestions: analysis
    })
  } catch (error: any) {
    console.error('Inspection error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
