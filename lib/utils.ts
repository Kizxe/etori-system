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
