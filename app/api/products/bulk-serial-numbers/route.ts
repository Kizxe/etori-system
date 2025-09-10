import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, quantity, status, locationId, prefix, startNumber } = body

    // Validate required fields
    if (!productId || !quantity || !status) {
      return NextResponse.json(
        { error: 'Product ID, quantity, and status are required' },
        { status: 400 }
      )
    }

    if (quantity <= 0 || quantity > 100) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 100' },
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

    // Generate serial numbers
    const serialNumbers = []
    const skippedSerials = []
    const basePrefix = prefix || `SN-${product.sku}`
    
    for (let i = 0; i < quantity; i++) {
      const number = startNumber + i
      const serial = `${basePrefix}-${number.toString().padStart(3, '0')}`
      
      // Check if serial number already exists
      const existingSerial = await prisma.serialNumber.findUnique({
        where: { serial }
      })

      if (existingSerial) {
        skippedSerials.push(serial)
        continue // Skip this serial number and continue with the next one
      }

      serialNumbers.push({
        serial,
        productId,
        status: status as any,
        locationId: locationId || null,
        notes: null,
      })
    }

    // If no new serial numbers can be created, return an error
    if (serialNumbers.length === 0) {
      return NextResponse.json(
        { 
          error: `All serial numbers in the range already exist. Skipped: ${skippedSerials.join(', ')}`,
          skippedSerials 
        },
        { status: 400 }
      )
    }

    // Create all serial numbers in a transaction
    const createdSerialNumbers = await prisma.$transaction(
      serialNumbers.map(sn => 
        prisma.serialNumber.create({
          data: sn,
          include: {
            StorageLocation: true,
            Product: {
              include: {
                category: true
              }
            }
          }
        })
      )
    )

    return NextResponse.json({
      message: `Successfully created ${serialNumbers.length} serial numbers${skippedSerials.length > 0 ? ` (${skippedSerials.length} skipped as they already exist)` : ''}`,
      serialNumbers: createdSerialNumbers,
      skippedSerials: skippedSerials,
      created: serialNumbers.length,
      skipped: skippedSerials.length
    })
  } catch (error) {
    console.error('Error creating bulk serial numbers:', error)
    return NextResponse.json(
      { error: 'Failed to create serial numbers' },
      { status: 500 }
    )
  }
}
