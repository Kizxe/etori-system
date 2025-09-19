import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { shouldSendAlert, getAlertMessage, calculateDaysInInventory, getAgingStatus } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    // Get all serial numbers that are in stock
    const serialNumbers = await prisma.serialNumber.findMany({
      where: {
        status: 'IN_STOCK',
        inventoryDate: {
          not: null
        }
      },
      include: {
        Product: {
          include: {
            category: true
          }
        }
      }
    })

    const alerts = []
    const now = new Date()

    for (const serialNumber of serialNumbers) {
      if (!serialNumber.inventoryDate) continue

      const days = calculateDaysInInventory(serialNumber.inventoryDate)
      const shouldSend = shouldSendAlert(serialNumber.inventoryDate, serialNumber.lastAlertSent)
      
      if (shouldSend) {
        // Create notification
        const notification = await prisma.notification.create({
          data: {
            title: `Inventory Aging Alert: ${serialNumber.Product.name} - ${serialNumber.serial}`,
            message: getAlertMessage(serialNumber.inventoryDate, days),
            productId: serialNumber.productId,
            sentById: 'system', // System-generated alert
            type: 'STOCK_ALERT',
            sentTo: {
              connect: await prisma.user.findMany().then(users => 
                users.map(user => ({ id: user.id }))
              )
            }
          }
        })

        // Update serial number alert status
        await prisma.serialNumber.update({
          where: { id: serialNumber.id },
          data: {
            lastAlertSent: now,
            agingStatus: getAgingStatus(serialNumber.inventoryDate),
            needsAttention: days >= 45 // Mark as needing attention when stale
          }
        })

        alerts.push({
          serialNumberId: serialNumber.id,
          serialNumber: serialNumber.serial,
          productId: serialNumber.productId,
          productName: serialNumber.Product.name,
          days,
          alertType: days === 38 ? '7_DAY_WARNING' : '1_DAY_WARNING',
          notificationId: notification.id
        })
      }
    }

    return NextResponse.json({
      success: true,
      alertsSent: alerts.length,
      alerts
    })

  } catch (error) {
    console.error('Error processing inventory aging alerts:', error)
    return NextResponse.json(
      { error: 'Failed to process inventory aging alerts' },
      { status: 500 }
    )
  }
}
