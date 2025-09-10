// app/api/products/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
const { generateSKU } = require('@/lib/sku-generator')

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        SerialNumber: {
          include: {
            StorageLocation: true
          }
        },
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Create or find the category
    const category = await prisma.category.upsert({
      where: { name: body.categoryName },
      update: {},
      create: { name: body.categoryName },
    })

    // Generate SKU if not provided
    let sku = body.sku;
    if (!sku || sku.trim() === '') {
      sku = await generateSKU();
    }

    // Create the product
    const productData: any = {
      name: body.name,
      sku: sku,
      description: body.description,
      categoryId: category.id,
      manufacturer: body.manufacturer,
      model: body.model,
      price: body.price,
      minimumStock: body.minimumStock,
    }

    // Only add barcode if provided
    if (body.barcode) {
      productData.barcode = body.barcode
    }

    const product = await prisma.product.create({
      data: productData,
    })

    // If initial stock is provided, create a storage location and serial numbers
    if (body.initialStock > 0) {
      // Create or find the main storage location
      const storageLocation = await prisma.storageLocation.upsert({
        where: { name: "Main Storage" },
        update: {},
        create: {
          name: "Main Storage",
          description: "Primary storage location"
        },
      })

      // Create serial numbers for the initial stock
      for (let i = 0; i < body.initialStock; i++) {
        const serialNumber = `SN-${product.sku}-${Date.now()}-${i + 1}`
        await prisma.serialNumber.create({
          data: {
            id: serialNumber,
            serial: serialNumber,
            productId: product.id,
            locationId: storageLocation.id,
            status: 'IN_STOCK',
            updatedAt: new Date(),
          },
        })
      }
    }

    // Return the created product with its relations
    const createdProduct = await prisma.product.findUnique({
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

    return NextResponse.json(createdProduct)
  } catch (error) {
    console.error('Error creating product:', error)
    
    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('sku')) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 400 }
        )
      }
      if (error.message.includes('barcode')) {
        return NextResponse.json(
          { error: 'A product with this barcode already exists' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}