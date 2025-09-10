import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
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

    // Get all unread notification IDs for this user
    const unreadNotifications = await prisma.$queryRaw`
      SELECT n.id 
      FROM Notification n 
      JOIN _SentTo ntu ON n.id = ntu.A 
      WHERE ntu.B = ${user.id} AND n.read = 0
    `;
    
    if (!Array.isArray(unreadNotifications) || unreadNotifications.length === 0) {
      return new NextResponse(JSON.stringify({ message: "No unread notifications" }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Extract the notification IDs
    const notificationIds = unreadNotifications.map((n: any) => n.id);
    
    // Mark all notifications as read
    // We need to mark them one by one because MySQL doesn't support array parameters in IN clauses
    for (const id of notificationIds) {
      await prisma.$executeRaw`
        UPDATE Notification 
        SET \`read\` = 1 
        WHERE id = ${id}
      `;
    }
    
    return new NextResponse(JSON.stringify({ 
      success: true,
      count: notificationIds.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return new NextResponse(JSON.stringify({ error: "Error marking all notifications as read" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 