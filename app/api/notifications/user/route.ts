import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

interface NotificationType {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: string;
  productId?: string | null;
  requestId?: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
  } | null;
  sentBy?: {
    id: string;
    name: string;
  } | null;
}

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

    // Fetch notifications for this user using a raw SQL query
    // This avoids TypeScript issues with the Prisma schema
    const notifications: NotificationType[] = [];
    
    try {
      // Use Prisma's queryRaw to get notifications
      const notificationsData = await prisma.$queryRaw`
        SELECT 
          n.id, 
          n.title, 
          n.message, 
          n.createdAt, 
          n.read, 
          n.type, 
          n.productId,
          n.requestId,
          p.id as product_id,
          p.name as product_name,
          p.sku as product_sku,
          u.id as sender_id,
          u.name as sender_name
        FROM Notification n
        JOIN _SentTo ntu ON n.id = ntu.A
        LEFT JOIN Product p ON n.productId = p.id
        JOIN User u ON n.sentById = u.id
        WHERE ntu.B = ${user.id}
        ORDER BY n.createdAt DESC
        LIMIT 20
      `;
      
      if (Array.isArray(notificationsData)) {
        // Format the raw data into our notification type
        notifications.push(...notificationsData.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
          read: Boolean(n.read),
          type: n.type,
          productId: n.productId,
          requestId: n.requestId,
          product: n.product_id ? {
            id: n.product_id,
            name: n.product_name,
            sku: n.product_sku
          } : null,
          sentBy: {
            id: n.sender_id,
            name: n.sender_name
          }
        })));
      }
    } catch (dbError) {
      console.error("Database error fetching notifications:", dbError);
      // If there's an error with the query, return an empty array
    }

    return new NextResponse(JSON.stringify(notifications), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return new NextResponse(JSON.stringify([]), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 