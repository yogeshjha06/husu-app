'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'HUSU_OWNER' | 'ORG_ADMIN' | 'EMPLOYEE'
  org_id: string | null
  is_active: boolean
  two_factor_enabled?: boolean
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  error: string | null
  userProfile: UserProfile | null  // Add this for compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (err) {
      console.error('Session check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // Check if user is already logged in on mount
  useEffect(() => {
    checkSession()
  }, [])

  const refreshUser = async () => {
    await checkSession()
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Sign in failed')
      }

      const data = await res.json()
      setUser(data.user)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const redirectPath = user?.role === 'HUSU_OWNER' ? '/login/husu' : '/login'
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      router.push(redirectPath)
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile: user, loading, signIn, signOut, refreshUser, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
