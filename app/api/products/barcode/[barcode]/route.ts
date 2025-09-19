import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await context.params

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode parameter is required" },
        { status: 400 }
      )
    }

    // Search for product by barcode or SKU
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: barcode },
          { barcode: barcode },
        ]
      },
      include: {
        category: true,
        SerialNumber: {
          include: {
            StorageLocation: true
          }
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found with this barcode" },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error searching product by barcode:", error)
    return NextResponse.json(
      { error: "Failed to search for product" },
      { status: 500 }
    )
  }
} 