import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Preferences validation schema
const preferencesSchema = z.object({
  darkMode: z.boolean(),
  dateFormat: z.enum(['dmy', 'mdy', 'ymd']),
  lowStockAlert: z.boolean(),
  stockRequestNotification: z.boolean(),
})

export async function PUT(request: Request) {
  try {
    // Get authenticated user's session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = preferencesSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json({ 
        error: 'Invalid preferences data',
        details: validatedData.error.errors 
        
      }, { status: 400 })
    }

    // Update user preferences using Prisma's type-safe update
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        preferences: JSON.stringify(validatedData.data)
      },
      select: {
        id: true,
        name: true,
        email: true,
        preferences: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating preferences:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid preferences data', details: error.errors }, { status: 400 })
    }
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
} 