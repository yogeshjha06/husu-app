import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

// Test to find the exact minimum fields needed
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null

  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    const tests: any[] = [
      {
        name: 'title only',
        data: { title: 'Test' }
      },
      {
        name: 'title + created_by (ObjectId)',
        data: { title: 'Test', created_by: new ObjectId() }
      },
      {
        name: 'title + created_by + is_active',
        data: { title: 'Test', created_by: new ObjectId(), is_active: true }
      },
      {
        name: 'title + created_by + created_at + updated_at',
        data: { title: 'Test', created_by: new ObjectId(), created_at: new Date(), updated_at: new Date() }
      },
      {
        name: 'title + created_by WITHOUT type',
        data: { title: 'Test', created_by: new ObjectId(), created_at: new Date(), updated_at: new Date(), is_active: true }
      },
      {
        name: 'title + created_by + description WITHOUT type',
        data: { title: 'Test', description: 'Desc', created_by: new ObjectId(), created_at: new Date(), updated_at: new Date(), is_active: true }
      },
    ]

    const results: any[] = []

    for (const test of tests) {
      try {
        const testDoc = { ...test.data, testId: `test-${Date.now()}`, testName: test.name }
        const result = await db.collection('questions').insertOne(testDoc)
        // Delete it right after
        await db.collection('questions').deleteOne({ _id: result.insertedId })
        results.push({
          test: test.name,
          status: '✅ PASS',
          fieldsUsed: Object.keys(test.data),
        })
      } catch (error: any) {
        const schemaRules = error.errInfo?.details?.schemaRulesNotSatisfied || []
        let missingProps: string[] = []
        let disallowedProps: string[] = []
        
        for (const rule of schemaRules) {
          if (rule.operatorName === 'required' && rule.missingProperties) {
            missingProps = rule.missingProperties
          }
          if (rule.operatorName === 'properties' && rule.propertiesNotSatisfied) {
            for (const prop of rule.propertiesNotSatisfied) {
              disallowedProps.push(prop.propertyName)
            }
          }
        }
        
        results.push({
          test: test.name,
          status: '❌ FAIL',
          fieldsUsed: Object.keys(test.data),
          error: {
            message: error.message,
            missingRequired: missingProps,
            disallowed: disallowedProps,
          }
        })
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      testResults: results,
      summary: {
        passed: results.filter(r => r.status === '✅ PASS').length,
        failed: results.filter(r => r.status === '❌ FAIL').length,
        total: results.length,
      },
      recommendation: results.find(r => r.status === '✅ PASS')
        ? `✅ Use structure: ${results.filter(r => r.status === '✅ PASS').map(r => r.test).join(' OR ')}`
        : '❌ No valid structure found'
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}


