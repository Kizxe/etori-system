import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/cleanup-expired-invitations - Clean up expired invitations
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

    // Delete expired invitations that are not used
    const result = await prisma.userInvitation.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        isUsed: false
      }
    })

    return NextResponse.json({
      message: `Cleaned up ${result.count} expired invitations`,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Error cleaning up expired invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
