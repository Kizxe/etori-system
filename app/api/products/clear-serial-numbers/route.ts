import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
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

    // Count existing serial numbers
    const existingCount = await prisma.serialNumber.count({
      where: { productId }
    })

    if (existingCount === 0) {
      return NextResponse.json(
        { error: 'No serial numbers found for this product' },
        { status: 400 }
      )
    }

    // Delete all serial numbers for this product
    await prisma.serialNumber.deleteMany({
      where: { productId }
    })

    return NextResponse.json({
      message: `Successfully deleted ${existingCount} serial numbers`,
      deletedCount: existingCount
    })
  } catch (error) {
    console.error('Error clearing serial numbers:', error)
    return NextResponse.json(
      { error: 'Failed to clear serial numbers' },
      { status: 500 }
    )
  }
}
