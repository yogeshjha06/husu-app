import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { email, password, firstName, lastName, role, organizationId } = await request.json()

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      password_hash: password,
      first_name: firstName,
      last_name: lastName,
      role,
      organization_id: organizationId || null,
    })

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({ user: authData.user }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
