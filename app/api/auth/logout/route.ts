// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Clear any authentication cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    response.cookies.set('token', '', { expires: new Date(0), path: '/' }) // Set cookie to expire immediately
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
} 