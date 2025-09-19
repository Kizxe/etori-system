import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return session
}

export async function requireAdmin(request: NextRequest) {
  const session = await requireAuth(request)
  
  if (session instanceof NextResponse) {
    return session
  }

  const { prisma } = await import('./prisma')
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true }
  })

  if (!user || user.role !== 'ADMIN' || !user.isActive) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return session
}

export async function requireStaff(request: NextRequest) {
  const session = await requireAuth(request)
  
  if (session instanceof NextResponse) {
    return session
  }

  const { prisma } = await import('./prisma')
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true }
  })

  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return session
}
