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

    // Get collection info
    const collections = await db.listCollections().toArray()
    const questionsCollection = collections.find(c => c.name === 'questions')

    if (!questionsCollection) {
      return NextResponse.json({ error: 'Questions collection not found' }, { status: 404 })
    }

    // Get validation rules using command
    const collectionOptions = questionsCollection.options || {}
    const validator = collectionOptions.validator
    
    // Try multiple ways to get validator info
    let validatorInfo = validator
    try {
      const collStats = await db.command({
        collStats: 'questions',
        indexDetails: true,
        verbose: true
      })
      validatorInfo = collStats.validationLevel || validator
    } catch (e) {
      // Some MongoDB versions don't support this
    }
    
    // Get sample documents to understand schema
    const sampleDocs = await db.collection('questions').find().limit(3).toArray()
    
    // Analyze documents
    const docAnalysis = sampleDocs.map(doc => ({
      keys: Object.keys(doc),
      types: Object.entries(doc).reduce((acc, [key, value]: [string, any]) => {
        if (Array.isArray(value)) {
          acc[key] = `array[${typeof value[0]}]`
        } else if (value && typeof value === 'object') {
          acc[key] = value.constructor?.name || 'object'
        } else {
          acc[key] = typeof value
        }
        return acc
      }, {} as Record<string, string>),
      fieldCount: Object.keys(doc).length,
      approxSize: JSON.stringify(doc).length,
    }))

    // Try to get an actual validation error by inserting bad data
    let validationErrorExample = null
    try {
      await db.collection('questions').insertOne({ invalid: true })
    } catch (e: any) {
      validationErrorExample = {
        code: e.code,
        message: e.message,
        details: e.errInfo?.details,
        schemaRulesNotSatisfied: e.errInfo?.details?.schemaRulesNotSatisfied
      }
    }

    return NextResponse.json({
      collectionName: questionsCollection.name,
      hasValidator: !!validator,
      validator: validator ? JSON.stringify(validator, null, 2) : 'No validator found in options',
      collectionOptions: JSON.stringify(collectionOptions, null, 2),
      sampleDocuments: docAnalysis,
      validationErrorForInvalidData: validationErrorExample,
      dbInfo: {
        name: DB_NAME,
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error: any) {
    console.error('Schema debug error:', error)
    return NextResponse.json({ 
      error: String(error),
      details: error.errInfo
    }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
