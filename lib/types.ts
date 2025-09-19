export interface Product {
  id: string
  name: string
  sku: string
  barcode?: string | null
  description: string | null
  category: {
    name: string
  }
  manufacturer: string | null
  model: string | null
  price: string | number
  minimumStock: number
  SerialNumber?: {
    id: string
    serial: string
    status: string
    inventoryDate: string
    agingStatus: string
    needsAttention: boolean
    StorageLocation?: {
      id: string
      name: string
      description?: string | null
    } | null
  }[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STAFF'
  department?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    stockRequests: number
    invitations: number
  }
}

export interface UserInvitation {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'STAFF'
  department?: string
  token: string
  expiresAt: string
  isUsed: boolean
  createdAt: string
  invitedBy: {
    id: string
    name: string
    email: string
  }
  invitedUser?: {
    id: string
    name: string
    email: string
  }
}
