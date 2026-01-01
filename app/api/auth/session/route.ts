import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session')

    if (!sessionCookie?.value) {
      return Response.json(
        { user: null },
        { status: 200 }
      )
    }

    const user = JSON.parse(sessionCookie.value)

    return Response.json(
      { user },
      { status: 200 }
    )
  } catch (error) {
    console.error('Session check error:', error)
    return Response.json(
      { user: null },
      { status: 200 }
    )
  }
}
