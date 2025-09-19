import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Call the inventory aging alerts endpoint
    const response = await fetch(`${req.nextUrl.origin}/api/alerts/inventory-aging`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to check inventory aging alerts')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Inventory aging alerts checked successfully',
      ...result
    })

  } catch (error) {
    console.error('Error checking alerts:', error)
    return NextResponse.json(
      { error: 'Failed to check alerts' },
      { status: 500 }
    )
  }
}
