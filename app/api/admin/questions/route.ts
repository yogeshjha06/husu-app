import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

// Helper function to compress base64 images further if needed
function compressBase64Image(base64String: string, maxSize: number = 150000): string {
  // If already small enough, return as is
  if (base64String.length <= maxSize) {
    return base64String
  }

  // Extract the base64 part only (remove the data:image/... prefix)
  const base64Part = base64String.split(',')[1] || base64String
  
  // For very large images, we can only trim them
  // This is a lossy approach - we truncate the base64 string
  // In production, you'd want proper image re-encoding
  if (base64Part.length > maxSize) {
    // Keep the prefix and truncate to fit
    const prefix = base64String.split(',')[0] + ','
    const maxBase64Length = maxSize - prefix.length
    return prefix + base64Part.substring(0, maxBase64Length)
  }

  return base64String
}

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  org_id: string | null
}

// Helper function to infer question type from document structure
function inferQuestionType(doc: any): string {
  if (!doc) return 'UNKNOWN'
  
  // Check what fields exist to infer type
  if (doc.image_options && Array.isArray(doc.image_options) && doc.image_options.length > 0) {
    return 'IMAGE_OPTION'
  }
  
  if (doc.options && Array.isArray(doc.options)) {
    // Could be MCQ or MULTI_OPTION - default to MCQ if we can't tell
    return 'MCQ'
  }
  
  // If it has description but no options, likely SUBJECTIVE
  if (doc.description && !doc.options && !doc.image_options) {
    return 'SUBJECTIVE'
  }
  
  // Default to MCQ as fallback
  return 'MCQ'
}

// Helper function to convert MongoDB _id to id and snake_case to camelCase
function formatQuestion(doc: any) {
  if (!doc) return null
  const { _id, ...rest } = doc
  
  // Convert snake_case fields to camelCase for frontend
  const formatted: any = {
    id: _id.toString(),
  }
  
  for (const [key, value] of Object.entries(rest)) {
    // Map database fields to frontend fields
    if (key === 'image_options') {
      formatted.imageOptions = value
    } else if (key === 'created_by') {
      formatted.createdBy = value
    } else if (key === 'created_at') {
      formatted.createdAt = value
    } else if (key === 'updated_at') {
      formatted.updatedAt = value
    } else if (key === 'is_active') {
      formatted.isActive = value
    } else {
      formatted[key] = value  // Keep 'type' as-is
    }
  }
  
  // Since type is not stored in DB, infer it from document structure
  if (!formatted.type) {
    formatted.type = inferQuestionType(doc)
  }
  
  return formatted
}

// Helper function to convert camelCase to snake_case for database storage
function prepareQuestionForDB(data: any) {
  const prepared: any = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (key === 'type') {
      prepared.question_type = value
    } else if (key === 'imageOptions') {
      prepared.image_options = value
    } else if (key === 'createdBy') {
      prepared.created_by = value
    } else if (key === 'createdAt') {
      prepared.created_at = value
    } else if (key === 'updatedAt') {
      prepared.updated_at = value
    } else if (key === 'isActive') {
      prepared.is_active = value
    } else if (key !== 'id') {  // Don't include 'id' in DB storage
      prepared[key] = value
    }
  }
  
  return prepared
}

async function getSessionUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('user_session')

  if (!sessionCookie?.value) {
    return null
  }

  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null

  try {
    const user = await getSessionUser()

    if (!user || user.role !== 'HUSU_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    client = new MongoClient(MONGO_URI, { maxPoolSize: 10 })
    await client.connect()
    const db = client.db(DB_NAME)

    const questions = await db
      .collection('questions')
      .find({}, { projection: { title: 1, type: 1, description: 1, options: 1, image_options: 1, created_by: 1, created_at: 1, updated_at: 1, is_active: 1 } })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray()

    const formattedQuestions = questions.map(formatQuestion)

    return NextResponse.json({ data: formattedQuestions })
  } catch (error) {
    console.error('Get questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}

export async function POST(request: NextRequest) {
  let client: MongoClient | null = null

  try {
    const user = await getSessionUser()

    if (!user || user.role !== 'HUSU_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, type, description, options, imageOptions } = body

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    // Validate options based on question type
    const requiresOptions = ['MCQ', 'MULTI_OPTION']
    const requiresImageOptions = ['IMAGE_OPTION']

    if (requiresOptions.includes(type) && (!options || options.length === 0)) {
      return NextResponse.json(
        { error: 'Options are required for this question type' },
        { status: 400 }
      )
    }

    if (requiresImageOptions.includes(type) && (!imageOptions || imageOptions.length === 0)) {
      return NextResponse.json(
        { error: 'Image options are required for Image-Based question type' },
        { status: 400 }
      )
    }

    // Validate and compress images if needed
    let processedImageOptions = imageOptions
    if (imageOptions && imageOptions.length > 0) {
      const maxImageSize = 150000 // 150KB per image (strict limit)
      processedImageOptions = []
      
      for (const img of imageOptions) {
        if (img.url && img.url.trim()) {
          // Check size and compress if needed
          let compressedUrl = img.url
          const originalSize = img.url.length
          
          if (originalSize > maxImageSize) {
            console.log(`Image size ${Math.round(originalSize / 1024)}KB exceeds limit, attempting server-side compression`)
            compressedUrl = compressBase64Image(img.url, maxImageSize)
            
            // If still too large after compression, reject it
            if (compressedUrl.length > maxImageSize) {
              return NextResponse.json(
                { 
                  error: `Image too large even after compression (${Math.round(compressedUrl.length / 1024)}KB). Maximum allowed: 150KB per image. Please use simpler images.` 
                },
                { status: 400 }
              )
            }
            
            console.log(`Compressed from ${Math.round(originalSize / 1024)}KB to ${Math.round(compressedUrl.length / 1024)}KB`)
          }
          
          processedImageOptions.push({
            label: img.label || '',
            url: compressedUrl,
          })
        }
      }
      
      if (processedImageOptions.length === 0) {
        return NextResponse.json(
          { error: 'At least one valid image is required' },
          { status: 400 }
        )
      }
    }

    client = new MongoClient(MONGO_URI, { maxPoolSize: 10 })
    await client.connect()
    const db = client.db(DB_NAME)

    // Map frontend type to database enum values
    const typeMapping: Record<string, string> = {
      'MCQ': 'MCQ',
      'MULTI_OPTION': 'MULTI_OPTION',
      'TRUE_FALSE': 'TRUE_FALSE',
      'SUBJECTIVE': 'SUBJECTIVE',
      'RATING': 'RATING',
      'IMAGE_OPTION': 'IMAGE_MCQ',  // Frontend uses IMAGE_OPTION, DB expects IMAGE_MCQ
    }

    const dbType = typeMapping[type] || 'MCQ'

    const questionData: any = {
      title,
      type: dbType,
      created_by: new ObjectId(user.id),
    }

    // Add optional fields only if they have values
    if (description && description.trim()) {
      questionData.description = description
    }

    if (options && options.length > 0) {
      questionData.options = options
    }

    if (processedImageOptions && processedImageOptions.length > 0) {
      questionData.image_options = processedImageOptions
    }

    // Add metadata fields
    questionData.created_at = new Date()
    questionData.updated_at = new Date()
    questionData.is_active = true

    try {
      const result = await db.collection('questions').insertOne(questionData)
      const insertedDoc = await db.collection('questions').findOne({ _id: result.insertedId })
      const formatted = formatQuestion(insertedDoc)
      return NextResponse.json({ data: formatted }, { status: 201 })
    } catch (error: any) {
      console.error('Create question error:', {
        message: error.message,
        code: error.code,
        schemaRulesNotSatisfied: error.errInfo?.details?.schemaRulesNotSatisfied,
      })
      
      // Extract detailed property violation info
      const schemaErrors = error.errInfo?.details?.schemaRulesNotSatisfied || []
      let disallowedProps: string[] = []
      let missingProps: string[] = []
      
      for (const rule of schemaErrors) {
        if (rule.operatorName === 'properties' && rule.propertiesNotSatisfied) {
          for (const prop of rule.propertiesNotSatisfied) {
            disallowedProps.push(prop.propertyName)
          }
        }
        if (rule.operatorName === 'required' && rule.missingProperties) {
          missingProps = rule.missingProperties
        }
      }
      
      console.error('Schema validation details:', {
        disallowedProperties: disallowedProps,
        missingProperties: missingProps,
        documentFields: Object.keys(questionData),
      })
      
      return NextResponse.json(
        { 
          error: 'Failed to create question - Schema validation error',
          details: {
            message: error.message,
            code: error.code,
            disallowedProperties: disallowedProps,
            missingProperties: missingProps,
            documentFields: Object.keys(questionData),
          }
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Create question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
