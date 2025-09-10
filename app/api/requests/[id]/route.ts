import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

export async function GET(
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        id: tokenData.userId,
      }
    })

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get the request ID from the URL
    const { id: requestId } = await params
    
    // Get the request
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
    
    // Check if user has permission to view this request
    if (user.role !== "ADMIN" && stockRequest.userId !== user.id) {
      return new NextResponse(JSON.stringify({ error: "You don't have permission to view this request" }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new NextResponse(JSON.stringify(stockRequest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Error fetching request:", error)
    return new NextResponse(JSON.stringify({ error: "Error fetching request" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PATCH: Update a request (approve, reject, complete)
export async function PATCH(
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

    const { id: requestId } = await params
    const body = await req.json()
    const { status, notes } = body

    // Validate status
    if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return new NextResponse(JSON.stringify({ error: "Invalid status" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Find the request
    const stockRequest = await prisma.stockRequest.findUnique({
      where: { id: requestId },
      include: { product: true }
    })

    if (!stockRequest) {
      return new NextResponse(JSON.stringify({ error: "Request not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Update request status
    const updatedRequest = await prisma.stockRequest.update({
      where: { id: requestId },
      data: { 
        status,
        notes: notes || stockRequest.notes
      },
      include: {
        product: true,
        requestedBy: true
      }
    })

    // If status is APPROVED or COMPLETED, update product stock (optional implementation)
    if (status === 'COMPLETED') {
      // Get current locations for this product
      const locations = await prisma.storageLocation.findMany({
        where: { productId: stockRequest.productId }
      })

      // If there are locations, update the stock quantity
      if (locations.length > 0) {
        // Simple implementation: just reduce from first location
        // A more sophisticated version would have a UI for admin to choose which location
        const location = locations[0]
        const newQuantity = Math.max(0, location.quantity - stockRequest.quantity)
        
        await prisma.storageLocation.update({
          where: { id: location.id },
          data: { quantity: newQuantity }
        })
      }
    }

    return new NextResponse(JSON.stringify(updatedRequest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Error updating request:", error)
    return new NextResponse(JSON.stringify({ error: "Error updating request" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// DELETE: Delete a request
export async function DELETE(
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        id: tokenData.userId,
      }
    })

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Only admin or request owner can delete
    const { id: requestId } = await params
    
    // Get the request with owner info
    const stockRequest = await prisma.stockRequest.findUnique({
      where: { id: requestId },
      include: { requestedBy: true }
    })

    if (!stockRequest) {
      return new NextResponse(JSON.stringify({ error: "Request not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check permissions
    if (user.role !== "ADMIN" && stockRequest.userId !== user.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized to delete this request" }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Delete the request
    await prisma.stockRequest.delete({
      where: { id: requestId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting request:", error)
    return new NextResponse(JSON.stringify({ error: "Error deleting request" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 