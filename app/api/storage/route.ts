// app/api/storage/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const storageLocations = await prisma.storageLocation.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ storageLocations })
  } catch (error) {
    console.error('Error fetching storage locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch storage locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const token = request.cookies.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let tokenData: { userId?: string | number; email?: string } = {}
    try {
      tokenData = JSON.parse(token.value)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const where = tokenData.userId
      ? { id: String(tokenData.userId) }
      : tokenData.email
      ? { email: tokenData.email }
      : null

    if (!where) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where })
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      )
    }

    // Check if location already exists
    const existingLocation = await prisma.storageLocation.findUnique({
      where: { name }
    })

    if (existingLocation) {
      return NextResponse.json(
        { error: 'A storage location with this name already exists' },
        { status: 400 }
      )
    }

    // Create the storage location
    const storageLocation = await prisma.storageLocation.create({
      data: {
        name,
        description: description || null,
      }
    })

    return NextResponse.json(storageLocation)
  } catch (error) {
    console.error('Error creating storage location:', error)
    return NextResponse.json(
      { error: 'Failed to create storage location' },
      { status: 500 }
    )
  }
}