// app/api/stock-requests/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const requests = await prisma.stockRequest.findMany({
      include: {
        product: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        SerialNumber: true,
      },
    })
    return NextResponse.json(requests)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stock requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const stockRequest = await prisma.stockRequest.create({
      data: {
        productId: body.productId,
        userId: body.userId,
        quantity: body.quantity,
        notes: body.notes,
      },
    })
    return NextResponse.json(stockRequest)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create stock request' },
      { status: 500 }
    )
  }
}