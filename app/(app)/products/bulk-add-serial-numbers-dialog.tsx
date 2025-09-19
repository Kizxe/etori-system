"use client"

import { useState, useRef, useEffect } from "react"
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
  Info,
  Trash2,
  Scan
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

  const [serialNumbers, setSerialNumbers] = useState<string[]>([''])
  const [status, setStatus] = useState("IN_STOCK")
  const [locationId, setLocationId] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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
    } else {
      // Reset form when dialog closes
      setSerialNumbers([''])
      setStatus("IN_STOCK")
      setLocationId("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Filter out empty serial numbers
      const validSerialNumbers = serialNumbers.filter(sn => sn.trim() !== '')
      
      if (validSerialNumbers.length === 0) {
        throw new Error('Please enter at least one serial number')
      }

      if (validSerialNumbers.length > 50) {
        throw new Error('Cannot add more than 50 serial numbers at once')
      }

      const response = await fetch('/api/products/bulk-serial-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          serialNumbers: validSerialNumbers,
          status,
          locationId: locationId || null,
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

  // Handle serial number input changes
  const handleSerialNumberChange = (index: number, value: string) => {
    const newSerialNumbers = [...serialNumbers]
    newSerialNumbers[index] = value
    setSerialNumbers(newSerialNumbers)

    // Auto-focus to next slot if current slot is filled and not the last one
    if (value.trim() !== '' && index < serialNumbers.length - 1) {
      setTimeout(() => {
        const nextInput = inputRefs.current[index + 1]
        if (nextInput) {
          nextInput.focus()
        }
      }, 50)
    }
  }

  // Add a new serial number slot
  const addSerialNumberSlot = () => {
    setSerialNumbers([...serialNumbers, ''])
    // Focus the new input after it's rendered
    setTimeout(() => {
      const lastInput = inputRefs.current[serialNumbers.length]
      if (lastInput) {
        lastInput.focus()
      }
    }, 50)
  }

  // Remove a serial number slot
  const removeSerialNumberSlot = (index: number) => {
    if (serialNumbers.length > 1) {
      const newSerialNumbers = serialNumbers.filter((_, i) => i !== index)
      setSerialNumbers(newSerialNumbers)
    }
  }

  // Handle key press for auto-advance
  const handleKeyPress = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (index < serialNumbers.length - 1) {
        const nextInput = inputRefs.current[index + 1]
        if (nextInput) {
          nextInput.focus()
        }
      } else {
        // If it's the last slot and has content, add a new slot
        if (serialNumbers[index].trim() !== '') {
          addSerialNumberSlot()
        }
      }
    }
  }

  const validSerialNumbers = serialNumbers.filter(sn => sn.trim() !== '')

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Bulk Add Serial Numbers
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Bulk Add Serial Numbers
          </DialogTitle>
          <DialogDescription>
            Add individual serial numbers to {product.name}. Perfect for barcode scanning - each slot will auto-advance to the next when filled.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          {/* Status and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={status} 
                onValueChange={setStatus}
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
                value={locationId} 
                onValueChange={setLocationId}
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

          {/* Serial Number Input Slots */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Serial Numbers *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSerialNumberSlot}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Slot
              </Button>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-4">
              {serialNumbers.map((serialNumber, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      value={serialNumber}
                      onChange={(e) => handleSerialNumberChange(index, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(index, e)}
                      placeholder={`Serial number ${index + 1}`}
                      className="font-mono"
                    />
                  </div>
                  {serialNumbers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSerialNumberSlot(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Barcode Scanner Friendly:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Fill a slot and it will automatically move to the next</li>
                    <li>• Press Enter to manually advance to the next slot</li>
                    <li>• Press Enter on the last slot to add a new slot</li>
                    <li>• Empty slots will be ignored when submitting</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Summary */}
            {validSerialNumbers.length > 0 && (
              <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Ready to add {validSerialNumbers.length} serial number{validSerialNumbers.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading || validSerialNumbers.length === 0}>
              {isLoading ? "Adding..." : `Add ${validSerialNumbers.length} Serial Number${validSerialNumbers.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
