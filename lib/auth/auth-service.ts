import { createClient } from '@/lib/db/supabase-client'
import { Session, User } from '@supabase/supabase-js'

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: 'HUSU_OWNER' | 'ORG_ADMIN' | 'EMPLOYEE',
  organizationId?: string
) {
  const supabase = createClient()
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (authError) throw authError
  
  // Create user record
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user?.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      organization_id: organizationId || null,
    })
  
  if (userError) throw userError
  
  return authData
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  // Update last login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('email', email)
  
  return data
}

export async function signOut() {
  const supabase = createClient()
  return await supabase.auth.signOut()
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  return await supabase.auth.resetPasswordForEmail(email)
}

export async function updatePassword(password: string) {
  const supabase = createClient()
  return await supabase.auth.updateUser({ password })
}
