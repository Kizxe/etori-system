import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Delete all stock requests first due to foreign key constraints
    await prisma.stockRequest.deleteMany()
    
    // Delete all serial numbers (these reference products and storage locations)
    await prisma.serialNumber.deleteMany()
    
    // Delete all storage locations
    await prisma.storageLocation.deleteMany()
    
    // Delete all products
    await prisma.product.deleteMany()
    
    // Delete all categories
    await prisma.category.deleteMany()

    return NextResponse.json({ 
      message: 'All products and related data have been cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing products:', error)
    return NextResponse.json(
      { error: 'Failed to clear products' },
      { status: 500 }
    )
  }
} 