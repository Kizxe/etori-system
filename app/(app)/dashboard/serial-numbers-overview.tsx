"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Package, TrendingUp, TrendingDown } from "lucide-react"
import { useRouter } from "next/navigation"

interface SerialNumber {
  id: string
  serial: string
  status: string
  notes?: string | null
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

interface SerialNumbersOverviewProps {
  limit?: number
}

export function SerialNumbersOverview({ limit = 10 }: SerialNumbersOverviewProps) {
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [filteredSerialNumbers, setFilteredSerialNumbers] = useState<SerialNumber[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchSerialNumbers = async () => {
      try {
        const response = await fetch('/api/products/serial-numbers')
        if (response.ok) {
          const data = await response.json()
          setSerialNumbers(data.serialNumbers || [])
        }
      } catch (error) {
        console.error('Error fetching serial numbers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSerialNumbers()
  }, [])

  useEffect(() => {
    let filtered = serialNumbers

    if (statusFilter !== "all") {
      filtered = serialNumbers.filter(sn => sn.status === statusFilter)
    }

    setFilteredSerialNumbers(filtered.slice(0, limit))
  }, [serialNumbers, statusFilter, limit])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string, icon?: any }> = {
      'IN_STOCK': { 
        variant: "default", 
        className: "bg-green-100 text-green-800",
        icon: TrendingUp
      },
      'OUT_OF_STOCK': { 
        variant: "destructive",
        icon: TrendingDown
      },
    }

    const config = statusMap[status] || { variant: "secondary" }
    const IconComponent = config.icon

    return (
      <div className="flex items-center gap-2">
        {IconComponent && <IconComponent className="h-3 w-3" />}
        <Badge variant={config.variant} className={config.className}>
          {status.replace('_', ' ')}
        </Badge>
      </div>
    )
  }

  const getStatusCounts = () => {
    const counts = {
      total: serialNumbers.length,
      inStock: serialNumbers.filter(sn => sn.status === 'IN_STOCK').length,
      outOfStock: serialNumbers.filter(sn => sn.status === 'OUT_OF_STOCK').length,
    }

    return counts
  }

  const statusCounts = getStatusCounts()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Serial Numbers Overview
          </CardTitle>
          <CardDescription>
            Loading serial numbers...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Serial Numbers Overview
        </CardTitle>
        <CardDescription>
          Track individual items with unique serial numbers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.inStock}</div>
            <div className="text-xs text-muted-foreground">In Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts.outOfStock}</div>
            <div className="text-xs text-muted-foreground">Out of Stock</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter by status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({statusCounts.total})</SelectItem>
              <SelectItem value="IN_STOCK">In Stock ({statusCounts.inStock})</SelectItem>
              <SelectItem value="OUT_OF_STOCK">Out of Stock ({statusCounts.outOfStock})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Serial Numbers Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSerialNumbers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {statusFilter === "all" 
                      ? "No serial numbers found" 
                      : `No serial numbers with status "${statusFilter.replace('_', ' ')}"`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSerialNumbers.map((serialNumber) => (
                  <TableRow key={serialNumber.id}>
                    <TableCell className="font-mono text-sm">
                      {serialNumber.serial}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{serialNumber.Product.name}</div>
                        <div className="text-xs text-muted-foreground">{serialNumber.Product.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell>{serialNumber.Product.category.name}</TableCell>
                    <TableCell>
                      {serialNumber.StorageLocation?.name || 'No location'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(serialNumber.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {serialNumbers.length > limit && (
          <div className="text-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/products')}
            >
              View All Serial Numbers ({serialNumbers.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
