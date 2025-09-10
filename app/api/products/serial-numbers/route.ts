import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const serialNumbers = await prisma.serialNumber.findMany({
      include: {
        Product: {
          include: {
            category: true
          }
        },
        StorageLocation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ serialNumbers })
  } catch (error) {
    console.error('Error fetching serial numbers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch serial numbers' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, serial, status, locationId, notes } = body

    // Validate required fields
    if (!productId || !serial || !status) {
      return NextResponse.json(
        { error: 'Product ID, serial number, and status are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if serial number already exists
    const existingSerial = await prisma.serialNumber.findUnique({
      where: { serial }
    })

    if (existingSerial) {
      return NextResponse.json(
        { error: 'Serial number already exists' },
        { status: 400 }
      )
    }

    // Create the serial number
    const serialNumber = await prisma.serialNumber.create({
      data: {
        serial,
        productId,
        status: status as any,
        locationId: locationId || null,
        notes: notes || null,
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

    return NextResponse.json(serialNumber)
  } catch (error) {
    console.error('Error creating serial number:', error)
    return NextResponse.json(
      { error: 'Failed to create serial number' },
      { status: 500 }
    )
  }
}
