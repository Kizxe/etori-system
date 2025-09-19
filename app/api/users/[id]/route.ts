import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/users/:id → update user (admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rawCookie = request.headers.get('cookie') || ''
    const tokenCookie = rawCookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1]
    if (!tokenCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    let tokenData: { userId?: string; email?: string } = {}
    try { tokenData = JSON.parse(decodeURIComponent(tokenCookie)) } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    const where = tokenData.userId ? { id: String(tokenData.userId) } : tokenData.email ? { email: tokenData.email } : null
    if (!where) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const me = await prisma.user.findUnique({ where, select: { id: true, role: true, isActive: true } })
    if (!me || me.role !== 'ADMIN' || !me.isActive) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { name, email, role, department, isActive } = body as Partial<{ name: string; email: string; role: 'ADMIN' | 'STAFF'; department?: string; isActive: boolean }>

    if (email) {
      const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      if (exists && exists.id !== params.id) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email: email.toLowerCase() } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(department !== undefined ? { department } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true, updatedAt: true }
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'User',
        entityId: updated.id,
        performedById: me.id,
        metadata: body
      }
    })

    return NextResponse.json({ message: 'User updated', user: updated })
  } catch (err) {
    console.error('PUT /api/users/:id error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/:id → deactivate user (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rawCookie = request.headers.get('cookie') || ''
    const tokenCookie = rawCookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1]
    if (!tokenCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    let tokenData: { userId?: string; email?: string } = {}
    try { tokenData = JSON.parse(decodeURIComponent(tokenCookie)) } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    const where = tokenData.userId ? { id: String(tokenData.userId) } : tokenData.email ? { email: tokenData.email } : null
    if (!where) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const me = await prisma.user.findUnique({ where, select: { id: true, role: true, isActive: true } })
    if (!me || me.role !== 'ADMIN' || !me.isActive) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (params.id === me.id) return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 })

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
      select: { id: true, isActive: true }
    })

    await prisma.auditLog.create({
      data: {
        action: 'DEACTIVATE',
        entity: 'User',
        entityId: updated.id,
        performedById: me.id,
        metadata: null
      }
    })

    return NextResponse.json({ message: 'User deactivated' })
  } catch (err) {
    console.error('DELETE /api/users/:id error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


