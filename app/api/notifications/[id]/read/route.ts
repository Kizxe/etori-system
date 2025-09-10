import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

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

    // Get the notification ID from the URL
    const { id: notificationId } = await params
    
    // Check if the notification exists and belongs to this user
    // Use a raw query to check this relationship
    const notificationCheck = await prisma.$queryRaw`
      SELECT n.id 
      FROM Notification n 
      JOIN _SentTo ntu ON n.id = ntu.A 
      WHERE n.id = ${notificationId} AND ntu.B = ${user.id}
      LIMIT 1
    `;
    
    if (!Array.isArray(notificationCheck) || notificationCheck.length === 0) {
      return new NextResponse(JSON.stringify({ error: "Notification not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Mark the notification as read
    await prisma.$executeRaw`
      UPDATE Notification 
      SET \`read\` = 1 
      WHERE id = ${notificationId}
    `;
    
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return new NextResponse(JSON.stringify({ error: "Error marking notification as read" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 