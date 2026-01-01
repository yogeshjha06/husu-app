import { cookies } from 'next/headers'
import { MongoClient, ObjectId } from 'mongodb'
import speakeasy from 'speakeasy'

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://angelhandngo_db_user:hZQZniIf4pUmZLyc@husu-db.sbwjxzi.mongodb.net/?appName=HUSU-db'
const DB_NAME = 'husu-db'

export async function POST(request: Request) {
    let client: MongoClient | null = null

    try {
        const { token, secret, userId, action } = await request.json()

        client = new MongoClient(MONGO_URI)
        await client.connect()
        const db = client.db(DB_NAME)

        // Case 1: Enabling 2FA (requires active session)
        if (action === 'ENABLE') {
            const cookieStore = await cookies()
            const session = cookieStore.get('user_session')
            if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

            const userData = JSON.parse(session.value)

            const verified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: token
            })

            if (verified) {
                await db.collection('users').updateOne(
                    { _id: new ObjectId(userData.id) },
                    {
                        $set: {
                            two_factor_enabled: true,
                            two_factor_secret: secret,
                            updated_at: new Date()
                        }
                    }
                )

                // Update session cookie
                const newUserData = {
                    ...userData,
                    two_factor_enabled: true
                }
                cookieStore.set('user_session', JSON.stringify(newUserData), {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7,
                })

                return Response.json({ success: true, message: '2FA Enabled Successfully' })
            } else {
                return Response.json({ error: 'Invalid verification code' }, { status: 400 })
            }
        }

        // Case 2: Disabling 2FA
        if (action === 'DISABLE') {
            const cookieStore = await cookies()
            const session = cookieStore.get('user_session')
            if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

            const userData = JSON.parse(session.value)
            const user = await db.collection('users').findOne({ _id: new ObjectId(userData.id) })

            const verified = speakeasy.totp.verify({
                secret: user?.two_factor_secret,
                encoding: 'base32',
                token: token
            })

            if (verified) {
                await db.collection('users').updateOne(
                    { _id: new ObjectId(userData.id) },
                    {
                        $set: {
                            two_factor_enabled: false,
                            updated_at: new Date()
                        },
                        $unset: { two_factor_secret: "" }
                    }
                )

                // Update session cookie
                const newUserData = {
                    ...userData,
                    two_factor_enabled: false
                }
                cookieStore.set('user_session', JSON.stringify(newUserData), {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7,
                })

                return Response.json({ success: true, message: '2FA Disabled Successfully' })
            } else {
                return Response.json({ error: 'Invalid verification code' }, { status: 400 })
            }
        }

        // Case 3: Verify During Login (No active session yet)
        if (action === 'LOGIN_VERIFY') {
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
            if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

            const verified = speakeasy.totp.verify({
                secret: user.two_factor_secret,
                encoding: 'base32',
                token: token
            })

            if (verified) {
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

                return Response.json({ success: true, user: userData })
            } else {
                return Response.json({ error: 'Invalid 2FA Code' }, { status: 400 })
            }
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('2FA Verify Error:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    } finally {
        if (client) await client.close()
    }
}
