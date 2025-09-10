import { NextRequest, NextResponse } from "next/server"
const { updateSKUPrefix, getCurrentCounterValue } = require("@/lib/sku-generator")

// GET: Get current SKU prefix
export async function GET() {
  try {
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