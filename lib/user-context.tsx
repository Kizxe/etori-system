"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  department?: string
  role: 'ADMIN' | 'STAFF'
  preferences?: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  refreshUser: () => Promise<void>
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/user')
      
      if (response.status === 401) {
        // Redirect to login page if unauthorized
        window.location.href = '/auth/login'
        return
      }
      
      if (!response.ok) throw new Error('Failed to fetch user data')
      
      const data = await response.json()
      setUser(data)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, isLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
