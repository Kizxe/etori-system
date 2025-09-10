import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Get available serial numbers for the product (IN_STOCK status)
    const serialNumbers = await prisma.serialNumber.findMany({
      where: {
        productId: productId,
        status: 'IN_STOCK'
      },
      include: {
        StorageLocation: true
      },
      orderBy: {
        serial: 'asc'
      }
    })

    return NextResponse.json({ serialNumbers })
  } catch (error) {
    console.error('Error fetching serial numbers for product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch serial numbers' },
      { status: 500 }
    )
  }
}
