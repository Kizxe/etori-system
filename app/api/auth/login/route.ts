// app/api/auth/login/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: body.email.toLowerCase(),
      },
    })

    // If user not found or password doesn't match
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Don't send the password in the response
    const { password, ...userWithoutPassword } = user

    // Create response
    const response = NextResponse.json({
      user: userWithoutPassword,
    })

    // Set cookie expiration based on remember me
    const rememberMe = body.rememberMe || false
    const expirationDate = rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days if remember me is checked
      : new Date(Date.now() + 24 * 60 * 60 * 1000);     // 24 hours if not checked

    // Set authentication cookie
    response.cookies.set('token', JSON.stringify({ 
      userId: user.id,
      email: user.email
    }), {
      expires: expirationDate,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
