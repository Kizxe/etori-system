import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, serialNumbers, status, locationId } = body

    // Validate required fields
    if (!productId || !serialNumbers || !Array.isArray(serialNumbers) || !status) {
      return NextResponse.json(
        { error: 'Product ID, serial numbers array, and status are required' },
        { status: 400 }
      )
    }

    if (serialNumbers.length === 0) {
      return NextResponse.json(
        { error: 'At least one serial number is required' },
        { status: 400 }
      )
    }

    if (serialNumbers.length > 100) {
      return NextResponse.json(
        { error: 'Cannot add more than 100 serial numbers at once' },
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

    // Process serial numbers
    const serialNumbersToCreate = []
    const skippedSerials = []
    
    for (const serial of serialNumbers) {
      const trimmedSerial = serial.trim()
      
      if (!trimmedSerial) {
        continue // Skip empty serial numbers
      }
      
      // Check if serial number already exists
      const existingSerial = await prisma.serialNumber.findUnique({
        where: { serial: trimmedSerial }
      })

      if (existingSerial) {
        skippedSerials.push(trimmedSerial)
        continue // Skip this serial number and continue with the next one
      }

      serialNumbersToCreate.push({
        serial: trimmedSerial,
        productId,
        status: status as any,
        locationId: locationId || null,
        notes: null,
        inventoryDate: new Date(), // Set inventory date when item is created
        agingStatus: 'FRESH', // Start as fresh
        needsAttention: false,
      })
    }

    // If no new serial numbers can be created, return an error
    if (serialNumbersToCreate.length === 0) {
      return NextResponse.json(
        { 
          error: `All provided serial numbers already exist. Skipped: ${skippedSerials.join(', ')}`,
          skippedSerials 
        },
        { status: 400 }
      )
    }

    // Create all serial numbers in a transaction
    const createdSerialNumbers = await prisma.$transaction(
      serialNumbersToCreate.map(sn => 
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
      message: `Successfully created ${serialNumbersToCreate.length} serial numbers${skippedSerials.length > 0 ? ` (${skippedSerials.length} skipped as they already exist)` : ''}`,
      serialNumbers: createdSerialNumbers,
      skippedSerials: skippedSerials,
      created: serialNumbersToCreate.length,
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
