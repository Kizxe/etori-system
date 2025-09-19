"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Clock, Package, Search, Filter, Download, FileDown } from "lucide-react"
import { 
  getAgingStatus, 
  calculateDaysInInventory, 
  getAgingStatusBadgeVariant, 
  formatInventoryDate,
  getAgingStatusColor 
} from "@/lib/utils"
import { generateInventoryAgingPDF } from "@/lib/generate-pdf"

interface SerialNumberWithProduct {
  id: string
  serial: string
  status: string
  inventoryDate: string
  agingStatus: string
  needsAttention: boolean
  Product: {
    id: string
    name: string
    sku: string
    category: {
      name: string
    }
  }
  StorageLocation?: {
    id: string
    name: string
  } | null
}

export default function InventoryAgingPage() {
  const [serialNumbers, setSerialNumbers] = useState<SerialNumberWithProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [agingFilter, setAgingFilter] = useState("all")
  const [sortBy, setSortBy] = useState("days")
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const fetchSerialNumbers = async () => {
      try {
        const response = await fetch('/api/products/serial-numbers')
        if (!response.ok) throw new Error('Failed to fetch serial numbers')
        const data = await response.json()
        setSerialNumbers(data.serialNumbers || [])
      } catch (error) {
        console.error('Error fetching serial numbers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSerialNumbers()
  }, [])

  // Filter and sort serial numbers
  const filteredSerialNumbers = serialNumbers
    .filter(sn => {
      const matchesSearch = 
        sn.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sn.Product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sn.Product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || sn.status === statusFilter
      
      const agingStatus = getAgingStatus(sn.inventoryDate)
      const matchesAging = agingFilter === "all" || agingFilter === agingStatus.toLowerCase()
      
      return matchesSearch && matchesStatus && matchesAging
    })
    .sort((a, b) => {
      const daysA = calculateDaysInInventory(a.inventoryDate)
      const daysB = calculateDaysInInventory(b.inventoryDate)
      
      switch (sortBy) {
        case "days":
          return daysB - daysA // Oldest first
        case "serial":
          return a.serial.localeCompare(b.serial)
        case "product":
          return a.Product.name.localeCompare(b.Product.name)
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

  // Calculate statistics
  const stats = {
    total: serialNumbers.length,
    inStock: serialNumbers.filter(sn => sn.status === 'IN_STOCK').length,
    fresh: serialNumbers.filter(sn => getAgingStatus(sn.inventoryDate) === 'ACTIVE').length,
    aging: serialNumbers.filter(sn => getAgingStatus(sn.inventoryDate) === 'IDLE').length,
    stale: serialNumbers.filter(sn => getAgingStatus(sn.inventoryDate) === 'OBSOLETE').length,
    deadStock: serialNumbers.filter(sn => getAgingStatus(sn.inventoryDate) === 'SURPLUS').length,
    needsAttention: serialNumbers.filter(sn => sn.needsAttention).length
  }

  // Export helpers
  const handleExportCSV = () => {
    try {
      setIsExporting(true)
      const headers = [
        'Serial Number',
        'Product',
        'SKU',
        'Status',
        'Aging',
        'Days In Inventory',
        'Inventory Date',
        'Location',
        'Needs Attention'
      ]

      const rows = filteredSerialNumbers.map(sn => {
        const agingStatus = getAgingStatus(sn.inventoryDate)
        const days = calculateDaysInInventory(sn.inventoryDate)
        return [
          sn.serial,
          sn.Product.name,
          sn.Product.sku,
          sn.status,
          agingStatus,
          String(days),
          formatInventoryDate(sn.inventoryDate),
          sn.StorageLocation?.name || 'No location',
          sn.needsAttention ? 'Yes' : 'No'
        ]
      })

      const csvContent = [headers, ...rows]
        .map(row => row
          .map(field => {
            const value = String(field ?? '')
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}` + '"' : value
          })
          .join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const date = new Date().toISOString().slice(0,10)
      link.download = `inventory-aging-${date}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = () => {
    try {
      setIsExporting(true)
      const data = filteredSerialNumbers.map(sn => ({
        id: sn.id,
        serial: sn.serial,
        status: sn.status,
        productId: sn.Product.id,
        productName: sn.Product.name,
        productSku: sn.Product.sku,
        StorageLocation: sn.StorageLocation || null,
        notes: null,
        agingStatus: getAgingStatus(sn.inventoryDate),
        inventoryDate: sn.inventoryDate,
        daysInInventory: calculateDaysInInventory(sn.inventoryDate),
        needsAttention: sn.needsAttention,
      }))
      generateInventoryAgingPDF(data, 'Inventory Aging Report')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asset Lifecycle</h1>
        <p className="text-muted-foreground">
          Track individual items aging status and manage inventory effectively
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All serial numbers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
            <p className="text-xs text-muted-foreground">
              Available items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obsolete Items</CardTitle>
            <div className="h-4 w-4 rounded-full bg-orange-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.stale}</div>
            <p className="text-xs text-muted-foreground">
              45-89 days old
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surplus Items</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.deadStock}</div>
            <p className="text-xs text-muted-foreground">
              90+ days old
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by serial, product name, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="IN_STOCK">In Stock</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agingFilter} onValueChange={setAgingFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Aging" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Aging</SelectItem>
                <SelectItem value="fresh">Fresh (0-30 days)</SelectItem>
                <SelectItem value="aging">Aging (31-44 days)</SelectItem>
                <SelectItem value="stale">Stale (45-89 days)</SelectItem>
                <SelectItem value="dead_stock">Dead Stock (90+ days)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days in Inventory</SelectItem>
                <SelectItem value="serial">Serial Number</SelectItem>
                <SelectItem value="product">Product Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Individual Items ({filteredSerialNumbers.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExporting || filteredSerialNumbers.length === 0}>
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting || filteredSerialNumbers.length === 0}>
                <FileDown className="h-4 w-4 mr-2" /> Export PDF
              </Button>
            </div>
          </div>
          <CardDescription>
            Detailed view of each item's aging status and inventory information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aging Status</TableHead>
                  <TableHead>Days in Inventory</TableHead>
                  <TableHead>Inventory Date</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSerialNumbers.map((sn) => {
                  const agingStatus = getAgingStatus(sn.inventoryDate)
                  const days = calculateDaysInInventory(sn.inventoryDate)
                  
                  return (
                    <TableRow key={sn.id}>
                      <TableCell className="font-mono text-sm">
                        {sn.serial}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sn.Product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {sn.Product.sku} • {sn.Product.category.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getAgingStatusBadgeVariant(agingStatus)}
                            className={`${getAgingStatusColor(agingStatus)} ${
                              agingStatus === 'SURPLUS' ? 'bg-red-100 border-red-200' : 
                              agingStatus === 'OBSOLETE' ? 'bg-orange-100 border-orange-200' : 
                              agingStatus === 'ACTIVE' ? 'bg-green-100 border-green-200' :
                              agingStatus === 'IDLE' ? 'bg-yellow-100 border-yellow-200' :
                              ''
                            }`}
                          >
                            {agingStatus}
                          </Badge>
                          {sn.needsAttention && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{days}</span>
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatInventoryDate(sn.inventoryDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sn.StorageLocation?.name || 'No location'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
