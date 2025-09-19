import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { generateInvitationToken, generateInvitationLink, getInvitationExpirationTime } from '@/lib/invitation-utils'

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            stockRequests: true,
            invitations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/users - Create new user or send invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, department, sendInvitation = true } = body

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    if (sendInvitation) {
      // Create invitation
      const token = generateInvitationToken()
      const expiresAt = getInvitationExpirationTime(48) // 48 hours from now

      const invitation = await prisma.userInvitation.create({
        data: {
          email,
          name,
          role,
          department,
          token,
          expiresAt,
          invitedById: session.user.id
        }
      })

      // Generate invitation link
      const invitationLink = generateInvitationLink(token)

      // TODO: Send email with invitation link
      // For now, we'll return the invitation link
      return NextResponse.json({
        message: 'Invitation created successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          token: invitation.token,
          expiresAt: invitation.expiresAt,
          invitationLink
        }
      })
    } else {
      // Create user directly with temporary password
      const tempPassword = randomBytes(8).toString('hex')
      const hashedPassword = await bcrypt.hash(tempPassword, 12)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          department
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          createdAt: true
        }
      })

      return NextResponse.json({
        message: 'User created successfully',
        user,
        tempPassword // In production, this should be sent via email
      })
    }
  } catch (error) {
    console.error('Error creating user/invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
