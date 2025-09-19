import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

// GET /api/users → list users (admin only)
export async function GET(request: NextRequest) {
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

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(users)
  } catch (err) {
    console.error('GET /api/users error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/users → create user (admin only)
export async function POST(request: NextRequest) {
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
    const { name, email, role, department } = body as { name: string; email: string; role: 'ADMIN' | 'STAFF'; department?: string }
    if (!name || !email || !role) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (exists) return NextResponse.json({ error: 'User already exists' }, { status: 400 })

    const tempPassword = randomBytes(8).toString('hex')
    const hashed = await bcrypt.hash(tempPassword, 12)

    const created = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role,
        department,
        mustChangePassword: true,
      },
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true }
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'User',
        entityId: created.id,
        performedById: me.id,
        metadata: { email, role }
      }
    })

    // TODO: integrate email sender. For now, return temp password (for admin only).
    return NextResponse.json({ message: 'User created', user: created, tempPassword })
  } catch (err) {
    console.error('POST /api/users error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


