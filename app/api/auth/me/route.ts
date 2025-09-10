import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse the token to get user information
    let tokenData
    try {
      tokenData = JSON.parse(token.value)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        id: tokenData.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // Don't include the password
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error getting current user:', error)
    return NextResponse.json(
      { error: 'An error occurred while getting user information' },
      { status: 500 }
    )
  }
} 