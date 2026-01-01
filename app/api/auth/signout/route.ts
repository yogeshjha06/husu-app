import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('user_session')

    return Response.json(
      { message: 'Signed out successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Sign out error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
