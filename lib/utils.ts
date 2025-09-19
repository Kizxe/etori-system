import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ProductBase {
  price: string | number
  SerialNumber?: {
    id: string
    serial: string
    status: string
    StorageLocation?: {
      id: string
      name: string
      description?: string | null
    } | null
  }[]
}

export function parsePrice(price: string | number): number {
  return typeof price === 'string' ? parseFloat(price) : price
}

export function calculateTotalQuantity(serialNumbers?: { status: string }[]): number {
  if (!serialNumbers) return 0
  return serialNumbers.filter(sn => sn.status === 'IN_STOCK').length
}

export function calculateProductValue(product: ProductBase): number {
  const price = parsePrice(product.price)
  const totalQuantity = calculateTotalQuantity(product.SerialNumber)
  return price * totalQuantity
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Inventory Aging Utilities
export function calculateDaysInInventory(inventoryDate: string | Date): number {
  const inventory = new Date(inventoryDate)
  const now = new Date()
  const diffTime = now.getTime() - inventory.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Align with Prisma enum AgingStatus: ACTIVE, IDLE, OBSOLETE, SURPLUS
export function getAgingStatus(
  inventoryDate: string | Date
): 'ACTIVE' | 'IDLE' | 'OBSOLETE' | 'SURPLUS' {
  const days = calculateDaysInInventory(inventoryDate)
  
  if (days <= 30) return 'ACTIVE'
  if (days <= 44) return 'IDLE'
  if (days <= 89) return 'OBSOLETE'
  return 'SURPLUS'
}

export function getAgingStatusColor(status: 'ACTIVE' | 'IDLE' | 'OBSOLETE' | 'SURPLUS'): string {
  switch (status) {
    case 'ACTIVE': return 'text-green-600'
    case 'IDLE': return 'text-yellow-600'
    case 'OBSOLETE': return 'text-orange-600'
    case 'SURPLUS': return 'text-red-600'
    default: return 'text-gray-500'
  }
}

export function getAgingStatusBadgeVariant(status: 'ACTIVE' | 'IDLE' | 'OBSOLETE' | 'SURPLUS'): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE': return 'default'
    case 'IDLE': return 'secondary'
    case 'OBSOLETE': return 'secondary'
    case 'SURPLUS': return 'secondary'  // Changed from destructive to secondary (gray background)
    default: return 'outline'
  }
}

export function getAgingStatusLabel(status: 'ACTIVE' | 'IDLE' | 'OBSOLETE' | 'SURPLUS'): string {
  switch (status) {
    case 'ACTIVE': return 'Active (0-30 days)'
    case 'IDLE': return 'Idle (31-44 days)'
    case 'OBSOLETE': return 'Obsolete (45-89 days)'
    case 'SURPLUS': return 'Surplus (90+ days)'
    default: return 'Unknown'
  }
}

export function formatInventoryDate(inventoryDate: string | Date): string {
  const date = new Date(inventoryDate)
  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function shouldSendAlert(inventoryDate: string | Date, lastAlertSent?: string | Date | null): boolean {
  const days = calculateDaysInInventory(inventoryDate)
  const status = getAgingStatus(inventoryDate)
  
  // Send alert 7 days before becoming stale (day 38) and 1 day before (day 44)
  const shouldAlert = (days === 38 || days === 44) && status === 'IDLE'
  
  if (!shouldAlert) return false
  
  // Don't send duplicate alerts
  if (lastAlertSent) {
    const lastAlert = new Date(lastAlertSent)
    const now = new Date()
    const hoursSinceLastAlert = (now.getTime() - lastAlert.getTime()) / (1000 * 60 * 60)
    return hoursSinceLastAlert >= 24 // Only send once per day
  }
  
  return true
}

export function getAlertMessage(inventoryDate: string | Date, days: number): string {
  if (days === 38) {
    return `Item will become obsolete in 7 days (${days} days in inventory)`
  }
  if (days === 44) {
    return `Item will become obsolete in 1 day (${days} days in inventory)`
  }
  return `Item has been in inventory for ${days} days`
}

// Interface for serial numbers with aging data
interface SerialNumberWithAging {
  id: string
  serial: string
  inventoryDate: string | Date
  agingStatus?: string
  needsAttention?: boolean
  lastAlertSent?: string | Date | null
}

export function getInventoryAgingStats(serialNumbers: SerialNumberWithAging[]): {
  total: number
  active: number
  idle: number
  obsolete: number
  surplus: number
  needsAttention: number
} {
  return serialNumbers.reduce((acc, sn) => {
    const status = getAgingStatus(sn.inventoryDate)
    
    acc.total++
    
    switch (status) {
      case 'ACTIVE':
        acc.active++
        break
      case 'IDLE':
        acc.idle++
        break
      case 'OBSOLETE':
        acc.obsolete++
        break
      case 'SURPLUS':
        acc.surplus++
        break
    }
    
    if (sn.needsAttention) {
      acc.needsAttention++
    }
    
    return acc
  }, { total: 0, active: 0, idle: 0, obsolete: 0, surplus: 0, needsAttention: 0 })
}

