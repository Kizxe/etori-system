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
import { Eye } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  name: string
  sku: string
  description: string | null
  category: {
    name: string
  }
  manufacturer: string | null
  model: string | null
  minimumStock: number
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
  createdAt: string
  updatedAt: string
}

interface ViewProductDialogProps {
  product: Product
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ViewProductDialog({ product, trigger, open: controlledOpen, onOpenChange }: ViewProductDialogProps) {
  const [open, setOpen] = useState(controlledOpen ?? false)

  // sync controlled state
  useEffect(() => {
    if (typeof controlledOpen === 'boolean') setOpen(controlledOpen)
  }, [controlledOpen])

  const getTotalStock = () => {
    return product.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0
  }

  const getStockStatus = () => {
    const totalStock = getTotalStock()
    return totalStock === 0 ? "Out of Stock" : 
           totalStock <= product.minimumStock ? "Low Stock" : "In Stock"
  }

  const getStatusBadge = () => {
    const status = getStockStatus()
    switch (status) {
      case "In Stock":
        return <Badge className="bg-green-100 text-green-800">In Stock</Badge>
      case "Low Stock":
        return <Badge className="bg-orange-100 text-orange-800">Low Stock</Badge>
      case "Out of Stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); onOpenChange?.(o) }}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
          <DialogDescription>
            Detailed information about {product.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <div className="font-semibold mb-1">Product Name</div>
              <div>{product.name}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">SKU</div>
              <div className="font-mono">{product.sku}</div>
            </div>
            <div className="col-span-2">
              <div className="font-semibold mb-1">Description</div>
              <div>{product.description || "No description provided"}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Category</div>
              <div>{product.category.name}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Status</div>
              <div>{getStatusBadge()}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Total Stock</div>
              <div>{getTotalStock()} units</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Minimum Stock Level</div>
              <div>{product.minimumStock} units</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Manufacturer</div>
              <div>{product.manufacturer || "Not specified"}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Model</div>
              <div>{product.model || "Not specified"}</div>
            </div>
            <div className="col-span-2">
              <div className="font-semibold mb-2">Serial Numbers & Locations</div>
              <div className="grid gap-2">
                {product.SerialNumber && product.SerialNumber.length > 0 ? (
                  <>
                    <div className="text-sm text-muted-foreground mb-2">
                      Showing {product.SerialNumber.length} serial number(s)
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {product.SerialNumber.map((sn) => (
                        <div
                          key={sn.id}
                          className="flex items-center justify-between rounded-lg border p-2 bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{sn.serial}</span>
                            <Badge 
                              variant={sn.status === 'IN_STOCK' ? 'default' : 
                                     sn.status === 'OUT_OF_STOCK' ? 'destructive' : 
                                     sn.status === 'RESERVED' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {sn.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {sn.StorageLocation?.name || 'No location'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No serial numbers</div>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">Created At</div>
              <div>{format(new Date(product.createdAt), "PPP")}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Last Updated</div>
              <div>{format(new Date(product.updatedAt), "PPP")}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 