"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Plus, 
  Package,
  Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  sku: string
}

interface StorageLocation {
  id: string
  name: string
  description?: string | null
}

interface BulkAddSerialNumbersDialogProps {
  product: Product
  onSerialNumbersAdded: () => void
}

export function BulkAddSerialNumbersDialog({ 
  product, 
  onSerialNumbersAdded 
}: BulkAddSerialNumbersDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    quantity: "1",
    status: "IN_STOCK",
    locationId: "",
    prefix: "",
    startNumber: "1",
  })

  // Fetch storage locations when dialog opens
  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      try {
        const response = await fetch('/api/storage')
        if (response.ok) {
          const data = await response.json()
          setStorageLocations(data.storageLocations || [])
        }
      } catch (error) {
        console.error('Error fetching storage locations:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const quantity = parseInt(formData.quantity)
      const startNumber = parseInt(formData.startNumber)
      
      if (quantity <= 0 || startNumber <= 0) {
        throw new Error('Quantity and start number must be positive')
      }

      if (quantity > 100) {
        throw new Error('Cannot add more than 100 serial numbers at once')
      }

      const response = await fetch('/api/products/bulk-serial-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          status: formData.status,
          locationId: formData.locationId || null,
          prefix: formData.prefix || `SN-${product.sku}`,
          startNumber,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        // Show a more informative error message for existing serial numbers
        if (data.skippedSerials && data.skippedSerials.length > 0) {
          throw new Error(`${data.error}\n\nSkipped serial numbers: ${data.skippedSerials.slice(0, 5).join(', ')}${data.skippedSerials.length > 5 ? ` and ${data.skippedSerials.length - 5} more...` : ''}`)
        }
        throw new Error(data.error || 'Failed to add serial numbers')
      }

      const result = await response.json()
      
      toast({
        title: "Success",
        description: result.message,
      })

      setOpen(false)
      setFormData({
        quantity: "1",
        status: "IN_STOCK",
        locationId: "",
        prefix: `SN-${product.sku}`,
        startNumber: "1",
      })
      onSerialNumbersAdded()
    } catch (error) {
      console.error('Error adding serial numbers:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add serial numbers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generatePreview = () => {
    const quantity = parseInt(formData.quantity) || 0
    const startNumber = parseInt(formData.startNumber) || 1
    const prefix = formData.prefix || `SN-${product.sku}`
    
    if (quantity <= 0) return []
    
    return Array.from({ length: Math.min(quantity, 5) }, (_, i) => {
      const number = startNumber + i
      return `${prefix}-${number.toString().padStart(3, '0')}`
    })
  }

  const preview = generatePreview()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Bulk Add Serial Numbers
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Add Serial Numbers</DialogTitle>
          <DialogDescription>
            Add multiple serial numbers to {product.name} at once. This is useful for adding inventory in bulk.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startNumber">Start Number</Label>
              <Input
                id="startNumber"
                type="number"
                min="1"
                value={formData.startNumber}
                onChange={(e) => handleChange('startNumber', e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_STOCK">In Stock</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="locationId">Storage Location</Label>
              <Select 
                value={formData.locationId} 
                onValueChange={(value) => handleChange('locationId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {storageLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="prefix">Serial Number Prefix</Label>
            <Input
              id="prefix"
              value={formData.prefix}
              onChange={(e) => handleChange('prefix', e.target.value)}
              placeholder={`SN-${product.sku}`}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use default: SN-{product.sku}
            </p>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Preview (first 5):</span>
              </div>
              <div className="grid gap-1">
                {preview.map((serial, index) => (
                  <div key={index} className="text-xs font-mono text-muted-foreground">
                    {serial}
                  </div>
                ))}
                {parseInt(formData.quantity) > 5 && (
                  <div className="text-xs text-muted-foreground">
                    ... and {parseInt(formData.quantity) - 5} more
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                <strong>Note:</strong> If any serial numbers already exist, they will be skipped and only new ones will be created.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : `Add ${formData.quantity} Serial Numbers`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
