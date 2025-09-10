import { NextRequest, NextResponse } from "next/server"

import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the token from cookies
    const token = req.cookies.get('token')
    
    // Check authentication
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Parse the token to get user information
    let tokenData
    try {
      tokenData = JSON.parse(token.value)
    } catch (e) {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get user from database and verify admin
    const user = await prisma.user.findUnique({
      where: {
        id: tokenData.userId,
      }
    })

    if (!user || user.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ error: "Unauthorized - Admin access required" }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get the request ID from the URL
    const { id: requestId } = await params
    
    // Get the request body
    const body = await req.json()
    const { notes } = body
    
    // Validate notes
    if (!notes || typeof notes !== 'string' || notes.trim() === '') {
      return new NextResponse(JSON.stringify({ error: "Rejection reason is required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Check if the request exists and is in PENDING status
    const stockRequest = await prisma.stockRequest.findUnique({
      where: { id: requestId },
      include: {
        product: true,
        requestedBy: true,
      }
    })
    
    if (!stockRequest) {
      return new NextResponse(JSON.stringify({ error: "Request not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (stockRequest.status !== "PENDING") {
      return new NextResponse(JSON.stringify({ error: "Request is not in PENDING status" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Update the request status to REJECTED
    const updatedRequest = await prisma.stockRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        notes: stockRequest.notes ? `${stockRequest.notes}\n\nRejection reason: ${notes}` : `Rejection reason: ${notes}`,
        updatedAt: new Date(),
      },
      include: {
        product: true,
        requestedBy: true,
      }
    })

    // Create a notification for the user who made the request
    await prisma.notification.create({
      data: {
        title: "Request Rejected",
        message: `Your request for ${updatedRequest.product.name} (${updatedRequest.quantity} units) has been rejected. Reason: ${notes}`,
        type: "REQUEST_UPDATE",
        productId: updatedRequest.productId,
        requestId: requestId,
        sentById: user.id,
        sentTo: {
          connect: { id: updatedRequest.requestedBy.id }
        }
      }
    })
    
    return new NextResponse(JSON.stringify(updatedRequest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Error rejecting request:", error)
    return new NextResponse(JSON.stringify({ error: "Error rejecting request" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 