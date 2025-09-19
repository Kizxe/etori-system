import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Read auth token from cookie (set by /api/auth/login)
    const token = request.cookies.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse cookie value
    let tokenData: { userId?: string | number; email?: string } = {}
    try {
      tokenData = JSON.parse(token.value)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Prefer lookup by id, fallback to email
    const where = tokenData.userId
      ? { id: String(tokenData.userId) }
      : tokenData.email
      ? { email: tokenData.email }
      : null

    if (!where) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Don't send the password
    const { password, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Read auth token from cookie (set by /api/auth/login)
    const cookieToken = request.cookies.get('token')

    if (!cookieToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let tokenData: { userId?: string | number; email?: string } = {}
    try {
      tokenData = JSON.parse(cookieToken.value)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Find the current user using token data
    const where = tokenData.userId
      ? { id: String(tokenData.userId) }
      : tokenData.email
      ? { email: tokenData.email }
      : null

    if (!where) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        email: body.email,
        department: body.department,
      },
    })

    // Don't send the password
    const { password, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
} 