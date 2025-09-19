import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
const { updateSKUPrefix, getCurrentCounterValue } = require("@/lib/sku-generator")

// GET: Get current SKU prefix
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const token = request.cookies.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let tokenData: { userId?: string | number; email?: string } = {}
    try {
      tokenData = JSON.parse(token.value)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const where = tokenData.userId
      ? { id: String(tokenData.userId) }
      : tokenData.email
      ? { email: tokenData.email }
      : null

    if (!where) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where })
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const counterInfo = await getCurrentCounterValue()
    
    return NextResponse.json({
      prefix: counterInfo.prefix,
      currentValue: counterInfo.value,
      nextSKU: `${counterInfo.prefix}-${(counterInfo.value + 1).toString().padStart(5, '0')}`
    })
  } catch (error) {
    console.error("Error getting SKU prefix:", error)
    return NextResponse.json(
      { error: "Failed to get SKU prefix" },
      { status: 500 }
    )
  }
}

// POST: Update SKU prefix
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const token = request.cookies.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let tokenData: { userId?: string | number; email?: string } = {}
    try {
      tokenData = JSON.parse(token.value)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const where = tokenData.userId
      ? { id: String(tokenData.userId) }
      : tokenData.email
      ? { email: tokenData.email }
      : null

    if (!where) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where })
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { prefix } = body
    
    if (!prefix || typeof prefix !== 'string' || prefix.trim() === '') {
      return NextResponse.json(
        { error: "Invalid prefix" },
        { status: 400 }
      )
    }
    
    // Validate prefix (alphanumeric only, no spaces)
    if (!/^[A-Za-z0-9]+$/.test(prefix)) {
      return NextResponse.json(
        { error: "Prefix must contain only letters and numbers" },
        { status: 400 }
      )
    }
    
    await updateSKUPrefix(prefix.toUpperCase())
    
    const counterInfo = await getCurrentCounterValue()
    
    return NextResponse.json({
      prefix: counterInfo.prefix,
      currentValue: counterInfo.value,
      nextSKU: `${counterInfo.prefix}-${(counterInfo.value + 1).toString().padStart(5, '0')}`
    })
  } catch (error) {
    console.error("Error updating SKU prefix:", error)
    return NextResponse.json(
      { error: "Failed to update SKU prefix" },
      { status: 500 }
    )
  }
} 