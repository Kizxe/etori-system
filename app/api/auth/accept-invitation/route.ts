import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/auth/accept-invitation - Accept invitation and set password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    // Find invitation by token
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 })
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // Check if invitation is already used
    if (invitation.isUsed) {
      return NextResponse.json({ error: 'Invitation has already been used' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: invitation.name,
        email: invitation.email,
        password: hashedPassword,
        role: invitation.role,
        department: invitation.department
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true
      }
    })

    // Mark invitation as used and link to user
    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: {
        isUsed: true,
        invitedUserId: user.id
      }
    })

    return NextResponse.json({
      message: 'Account created successfully',
      user
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/auth/accept-invitation?token=xxx - Get invitation details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find invitation by token
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 })
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // Check if invitation is already used
    if (invitation.isUsed) {
      return NextResponse.json({ error: 'Invitation has already been used' }, { status: 400 })
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        department: invitation.department,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy
      }
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
