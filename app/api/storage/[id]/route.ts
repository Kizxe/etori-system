import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      )
    }

    // Check if location exists
    const existingLocation = await prisma.storageLocation.findUnique({
      where: { id }
    })

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Storage location not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with existing location
    if (name !== existingLocation.name) {
      const nameConflict = await prisma.storageLocation.findUnique({
        where: { name }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A storage location with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update the storage location
    const updatedLocation = await prisma.storageLocation.update({
      where: { id },
      data: {
        name,
        description: description || null,
      }
    })

    return NextResponse.json(updatedLocation)
  } catch (error) {
    console.error('Error updating storage location:', error)
    return NextResponse.json(
      { error: 'Failed to update storage location' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Check if location exists
    const existingLocation = await prisma.storageLocation.findUnique({
      where: { id },
      include: {
        SerialNumber: true
      }
    })

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Storage location not found' },
        { status: 404 }
      )
    }

    // Check if location has serial numbers
    if (existingLocation.SerialNumber.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete storage location that contains serial numbers. Please move or delete the serial numbers first.' },
        { status: 400 }
      )
    }

    // Delete the storage location
    await prisma.storageLocation.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Storage location deleted successfully' })
  } catch (error) {
    console.error('Error deleting storage location:', error)
    return NextResponse.json(
      { error: 'Failed to delete storage location' },
      { status: 500 }
    )
  }
}
