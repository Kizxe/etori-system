import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// GET: Get all requests for the current user
export async function GET(req: NextRequest) {
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

    // Get all requests for this user
    const requests = await prisma.stockRequest.findMany({
      where: {
        userId: user.id
      },
      include: {
        product: true,
        requestedBy: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return new NextResponse(JSON.stringify({ requests }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Error fetching requests:", error)
    return new NextResponse(JSON.stringify({ error: "Error fetching requests" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST: Create a new stock request
export async function POST(req: NextRequest) {
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

    // Parse request body
    const body = await req.json()
    const { productId, notes, serialNumberIds } = body

    // Validate request
    if (!productId || !serialNumberIds || serialNumberIds.length === 0) {
      return new NextResponse(JSON.stringify({ error: "Product ID and serial numbers are required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return new NextResponse(JSON.stringify({ error: "Product not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify all selected serial numbers are available and belong to the product
    const selectedSerials = await prisma.serialNumber.findMany({
      where: {
        id: { in: serialNumberIds },
        productId: productId,
        status: 'IN_STOCK'
      }
    })

    if (selectedSerials.length !== serialNumberIds.length) {
      return new NextResponse(JSON.stringify({ 
        error: "One or more selected serial numbers are not available or do not belong to this product" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create individual requests for each selected serial number
    let stockRequests = []
    for (const serialNumberId of serialNumberIds) {
      const stockRequest = await prisma.stockRequest.create({
        data: {
          quantity: 1,
          notes,
          productId: productId,
          userId: user.id,
          serialNumberId: serialNumberId,
          status: "PENDING"
        },
        include: {
          product: true,
          requestedBy: true,
          SerialNumber: true
        }
      })
      stockRequests.push(stockRequest)
    }

    // Find all admin users to notify them about the new request
    const adminUsers = await prisma.user.findMany({
      where: {
        role: "ADMIN"
      }
    })

    // Create notifications for all admin users
    if (adminUsers.length > 0) {
      try {
        // Create notification message
        const notificationMessage = `${user.name} has requested ${serialNumberIds.length} unit(s) of ${product.name} with specific serial numbers${notes ? ` with note: ${notes}` : ''}`;
        
        // Create notification using proper Prisma methods
        const notification = await prisma.notification.create({
          data: {
            title: 'New Stock Request',
            message: notificationMessage,
            type: 'REQUEST_UPDATE',
            productId: productId,
            sentById: user.id,
            sentTo: {
              connect: adminUsers.map(admin => ({ id: admin.id }))
            }
          }
        })
        
        console.log(`Created notification for ${adminUsers.length} admin users`);
      } catch (notifError) {
        console.error("Error creating notifications:", notifError);
        // We don't want to fail the request if notifications fail
      }
    }

    return new NextResponse(JSON.stringify({ 
      requests: stockRequests,
      message: `Successfully created ${stockRequests.length} request(s)`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Error creating request:", error)
    
    // Provide more specific error information
    let errorMessage = "Error creating request"
    if (error instanceof Error) {
      errorMessage = error.message
      console.error("Error details:", error.stack)
    }
    
    return new NextResponse(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error"
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 