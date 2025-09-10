import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, locationId, notes } = body

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Check if serial number exists
    const existingSerial = await prisma.serialNumber.findUnique({
      where: { id }
    })

    if (!existingSerial) {
      return NextResponse.json(
        { error: 'Serial number not found' },
        { status: 404 }
      )
    }

    // Update the serial number
    const updatedSerialNumber = await prisma.serialNumber.update({
      where: { id },
      data: {
        status: status as any,
        locationId: locationId || null,
        notes: notes || null,
        updatedAt: new Date(),
      },
      include: {
        StorageLocation: true,
        Product: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(updatedSerialNumber)
  } catch (error) {
    console.error('Error updating serial number:', error)
    return NextResponse.json(
      { error: 'Failed to update serial number' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if serial number exists
    const existingSerial = await prisma.serialNumber.findUnique({
      where: { id }
    })

    if (!existingSerial) {
      return NextResponse.json(
        { error: 'Serial number not found' },
        { status: 404 }
      )
    }

    // Delete the serial number
    await prisma.serialNumber.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Serial number deleted successfully' })
  } catch (error) {
    console.error('Error deleting serial number:', error)
    return NextResponse.json(
      { error: 'Failed to delete serial number' },
      { status: 500 }
    )
  }
}
