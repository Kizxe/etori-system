"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Package,
  Search,
  Filter,
  Download,
  FileText
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { generateSerialNumbersPDF } from '@/lib/generate-pdf'

interface SerialNumber {
  id: string
  serial: string
  status: string
  notes?: string | null
  StorageLocation?: {
    id: string
    name: string
    description?: string | null
  } | null
}

interface Product {
  id: string
  name: string
  sku: string
  SerialNumber?: SerialNumber[]
}

interface SerialNumbersInfoDialogProps {
  products: Product[]
  trigger?: React.ReactNode
}

export function SerialNumbersInfoDialog({ 
  products, 
  trigger 
}: SerialNumbersInfoDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [productFilter, setProductFilter] = useState("all")

  // Get all serial numbers from all products
  const allSerialNumbers = products.flatMap(product => 
    (product.SerialNumber || []).map(sn => ({
      ...sn,
      productName: product.name,
      productSku: product.sku,
      productId: product.id
    }))
  )

  // Filter serial numbers
  const filteredSerialNumbers = allSerialNumbers.filter(sn => {
    const matchesSearch = 
      sn.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sn.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sn.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sn.StorageLocation?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sn.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || sn.status === statusFilter
    const matchesProduct = productFilter === "all" || sn.productId === productFilter

    return matchesSearch && matchesStatus && matchesProduct
  })

  // Get unique products for filter
  const uniqueProducts = products.filter(p => (p.SerialNumber?.length || 0) > 0)

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      'IN_STOCK': { variant: "default", className: "bg-green-100 text-green-800" },
      'OUT_OF_STOCK': { variant: "destructive" },
    }

    const config = statusMap[status] || { variant: "secondary" }
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const handleExportPDF = () => {
    // Export the filtered serial numbers with product information
    generateSerialNumbersPDF(filteredSerialNumbers, `Serial Numbers Report - ${new Date().toLocaleDateString()}`)
  }

  const getStatusCounts = () => {
    const counts = allSerialNumbers.reduce((acc, sn) => {
      acc[sn.status] = (acc[sn.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Package className="h-4 w-4" />
            Serial Numbers Info
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Serial Numbers Overview
          </DialogTitle>
          <DialogDescription>
            View and manage all serial numbers across your inventory. Total: {allSerialNumbers.length} serial numbers from {uniqueProducts.length} products.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Serial Numbers</span>
              </div>
              <div className="text-2xl font-bold mt-1">{allSerialNumbers.length}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">In Stock</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-green-600">{statusCounts.IN_STOCK || 0}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium">Out of Stock</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-red-600">{statusCounts.OUT_OF_STOCK || 0}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Products with Serial Numbers</span>
              </div>
              <div className="text-2xl font-bold mt-1">{uniqueProducts.length}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search serial numbers, products, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="IN_STOCK">In Stock</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {uniqueProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.SerialNumber?.length || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPDF}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Serial Numbers Table */}
          <div className="rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">
                Serial Numbers ({filteredSerialNumbers.length})
                {filteredSerialNumbers.length !== allSerialNumbers.length && 
                  ` of ${allSerialNumbers.length} total`
                }
              </h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSerialNumbers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        {allSerialNumbers.length === 0 
                          ? "No serial numbers found. Add serial numbers to your products to see them here."
                          : "No serial numbers match your current filters."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSerialNumbers.map((serialNumber) => (
                      <TableRow key={serialNumber.id}>
                        <TableCell className="font-medium">
                          {serialNumber.productName}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {serialNumber.productSku}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {serialNumber.serial}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(serialNumber.status)}
                        </TableCell>
                        <TableCell>
                          {serialNumber.StorageLocation?.name || 'No location'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {serialNumber.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Product Summary */}
          {uniqueProducts.length > 0 && (
            <div className="rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Products with Serial Numbers</h3>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Total Serial Numbers</TableHead>
                      <TableHead>In Stock</TableHead>
                      <TableHead>Out of Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueProducts.map((product) => {
                      const productSerialNumbers = product.SerialNumber || []
                      const inStock = productSerialNumbers.filter(sn => sn.status === 'IN_STOCK').length
                      const outOfStock = productSerialNumbers.filter(sn => sn.status === 'OUT_OF_STOCK').length
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="font-medium">{productSerialNumbers.length}</TableCell>
                          <TableCell className="text-green-600 font-medium">{inStock}</TableCell>
                          <TableCell className="text-red-600 font-medium">{outOfStock}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
