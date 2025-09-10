import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// GET: Get all requests (admin only)
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

    // Get all requests
    const requests = await prisma.stockRequest.findMany({
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