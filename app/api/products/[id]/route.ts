import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Find or create the category
    const category = await prisma.category.upsert({
      where: { name: body.categoryName },
      update: {},
      create: { name: body.categoryName },
    })

    // Update the product
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: body.name,
        sku: body.sku,
        description: body.description,
        categoryId: category.id,
        manufacturer: body.manufacturer,
        model: body.model,
        minimumStock: body.minimumStock,
      },
    })

    // Update serial numbers and storage locations
    if (body.SerialNumber && Array.isArray(body.SerialNumber)) {
      for (const sn of body.SerialNumber) {
        if (sn.id && sn.StorageLocation) {
          await prisma.serialNumber.update({
            where: { id: sn.id },
            data: {
              status: sn.status,
              StorageLocation: {
                update: {
                  name: sn.StorageLocation.name,
                  description: sn.StorageLocation.description,
                }
              }
            },
          })
        }
      }
    }

    // Return the updated product with its relations
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        SerialNumber: {
          include: {
            StorageLocation: true
          }
        },
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    
    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('sku')) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Delete the product (this will cascade delete related SerialNumbers due to foreign key constraints)
    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ 
      message: 'Product deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
} 