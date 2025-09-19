import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/admin/users/[id]/reset-password - Reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Read auth token from cookie (issued by /api/auth/login)
    const token = request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let tokenData: { userId?: string | number; email?: string } = {}
    try {
      tokenData = JSON.parse(decodeURIComponent(token))
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: tokenData.userId ? { id: String(tokenData.userId) } : tokenData.email ? { email: tokenData.email } : { id: '' },
      select: { role: true }
    })

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use standard default password from env
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD
    if (!defaultPassword) {
      return NextResponse.json({ error: 'DEFAULT_USER_PASSWORD is not configured' }, { status: 500 })
    }
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    // Update user password
    await prisma.user.update({
      where: { id: params.id },
      // @ts-ignore - Prisma client types may be stale; schema includes mustChangePassword
      data: { password: hashedPassword, mustChangePassword: true }
    })

    // Do not return the password; admin knows the standard default
    return NextResponse.json({
      message: 'Password reset successfully. User must change password at next login.'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
