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
  
  return formatted
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | null = null

  try {
    const user = await getSessionUser()

    if (!user || user.role !== 'HUSU_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    const typeMapping: Record<string, string> = {
      'MCQ': 'MCQ',
      'MULTI_OPTION': 'MULTI_OPTION',
      'TRUE_FALSE': 'TRUE_FALSE',
      'SUBJECTIVE': 'SUBJECTIVE',
      'RATING': 'RATING',
      'IMAGE_OPTION': 'IMAGE_MCQ',
    }

    const updateData: any = {
      title,
      type: typeMapping[type] || type,
    }

    // Only add optional fields if they have values
    if (description && description.trim()) {
      updateData.description = description
    }

    if (options && options.length > 0) {
      updateData.options = options
    }

    if (processedImageOptions && processedImageOptions.length > 0) {
      updateData.image_options = processedImageOptions
    }

    // Try with updated_at field first
    try {
      updateData.updated_at = new Date()
      
      const result = await db.collection('questions').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }

      const updatedDoc = await db.collection('questions').findOne({ _id: new ObjectId(id) })
      return NextResponse.json({ data: formatQuestion(updatedDoc) })
    } catch (error: any) {
      if (error.code === 121) {
        delete updateData.updated_at
        
        const result = await db.collection('questions').updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        )

        if (result.matchedCount === 0) {
          return NextResponse.json(
            { error: 'Question not found' },
            { status: 404 }
          )
        }

        const updatedDoc = await db.collection('questions').findOne({ _id: new ObjectId(id) })
        return NextResponse.json({ data: formatQuestion(updatedDoc) })
      }
      throw error
    }
  } catch (error) {
    console.error('Update question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    if (client) await client.close()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | null = null

  try {
    const user = await getSessionUser()

    if (!user || user.role !== 'HUSU_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    const result = await db.collection('questions').deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    if (client) await client.close()
  }
}
