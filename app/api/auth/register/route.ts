// app/api/auth/register/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Log the received data (for debugging)
    console.log('Received registration data:', body)

    const hashedPassword = await bcrypt.hash(body.password, 10)
    
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role || 'STAFF',
        department: body.department,
      },
    })

    // Log successful creation (for debugging)
    console.log('User created:', { id: user.id, email: user.email })

    const { password, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    // Log the error (for debugging)
    console.error('Registration error:', error)
    
    // Check if it's a unique constraint error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}