"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Settings,
  Package,
  Trash
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BulkAddSerialNumbersDialog } from "./bulk-add-serial-numbers-dialog"

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

interface StorageLocation {
  id: string
  name: string
  description?: string | null
}

interface Product {
  id: string
  name: string
  sku: string
  SerialNumber?: SerialNumber[]
}

interface ManageSerialNumbersDialogProps {
  product: Product
  onSerialNumbersUpdated: () => void
}

export function ManageSerialNumbersDialog({ 
  product, 
  onSerialNumbersUpdated 
}: ManageSerialNumbersDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>(product.SerialNumber || [])
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSerial, setEditingSerial] = useState<SerialNumber | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    serial: "",
    status: "IN_STOCK",
    locationId: "",
    notes: "",
  })

  // Fetch storage locations
  useEffect(() => {
    const fetchStorageLocations = async () => {
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

    if (open) {
      fetchStorageLocations()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/products/serial-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          serial: formData.serial,
          status: formData.status,
          locationId: formData.locationId || null,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add serial number')
      }

      const newSerialNumber = await response.json()
      setSerialNumbers([...serialNumbers, newSerialNumber])
      
      toast({
        title: "Success",
        description: "Serial number added successfully",
      })

      setFormData({
        serial: "",
        status: "IN_STOCK",
        locationId: "",
        notes: "",
      })
      setShowAddForm(false)
      onSerialNumbersUpdated()
    } catch (error) {
      console.error('Error adding serial number:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add serial number",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (serialNumber: SerialNumber) => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/products/serial-numbers/${serialNumber.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: formData.status,
          locationId: formData.locationId || null,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update serial number')
      }

      const updatedSerialNumber = await response.json()
      setSerialNumbers(serialNumbers.map(sn => 
        sn.id === serialNumber.id ? updatedSerialNumber : sn
      ))
      
      toast({
        title: "Success",
        description: "Serial number updated successfully",
      })

      setEditingSerial(null)
      setFormData({
        serial: "",
        status: "IN_STOCK",
        locationId: "",
        notes: "",
      })
      onSerialNumbersUpdated()
    } catch (error) {
      console.error('Error updating serial number:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update serial number",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (serialNumberId: string) => {
    if (!confirm('Are you sure you want to delete this serial number? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/products/serial-numbers/${serialNumberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete serial number')
      }

      setSerialNumbers(serialNumbers.filter(sn => sn.id !== serialNumberId))
      
      toast({
        title: "Success",
        description: "Serial number deleted successfully",
      })

      onSerialNumbersUpdated()
    } catch (error) {
      console.error('Error deleting serial number:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete serial number",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${serialNumbers.length} serial numbers for this product? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/products/clear-serial-numbers?productId=${product.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to clear serial numbers')
      }

      const result = await response.json()
      setSerialNumbers([])
      
      toast({
        title: "Success",
        description: result.message,
      })

      onSerialNumbersUpdated()
    } catch (error) {
      console.error('Error clearing serial numbers:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear serial numbers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (serialNumber: SerialNumber) => {
    setEditingSerial(serialNumber)
    setFormData({
      serial: serialNumber.serial,
      status: serialNumber.status,
      locationId: serialNumber.StorageLocation?.id || "",
      notes: serialNumber.notes || "",
    })
  }

  const handleCancelEdit = () => {
    setEditingSerial(null)
    setFormData({
      serial: "",
      status: "IN_STOCK",
      locationId: "",
      notes: "",
    })
  }

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

  const generateSerialNumber = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    const serial = `SN-${product.sku}-${timestamp}-${random}`
    setFormData(prev => ({ ...prev, serial }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          Manage Serial Numbers
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Serial Numbers - {product.name}</DialogTitle>
          <DialogDescription>
            Add, edit, and manage serial numbers for this product. Each serial number represents a unique item.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Add New Serial Number Form */}
          {showAddForm && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Add New Serial Number</h3>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="serial">Serial Number *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="serial"
                        value={formData.serial}
                        onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
                        placeholder="Enter or generate serial number"
                        required
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={generateSerialNumber}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="locationId">Storage Location</Label>
                    <Select 
                      value={formData.locationId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}
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
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Serial Number"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Serial Number Form */}
          {editingSerial && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Edit Serial Number: {editingSerial.serial}</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editingSerial); }} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status *</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
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
                    <Label htmlFor="edit-locationId">Storage Location</Label>
                    <Select 
                      value={formData.locationId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}
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
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Serial Number"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Serial Numbers Table */}
          <div className="rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Serial Numbers ({serialNumbers.length})</h3>
              <div className="flex gap-2">
                {!showAddForm && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => setShowAddForm(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Serial Number
                    </Button>
                    <BulkAddSerialNumbersDialog
                      product={product}
                      onSerialNumbersAdded={() => {
                        // Refresh the serial numbers list
                        onSerialNumbersUpdated()
                      }}
                    />
                    {serialNumbers.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={handleClearAll}
                        className="gap-2"
                        disabled={isLoading}
                      >
                        <Trash className="h-4 w-4" />
                        Clear All
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serialNumbers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No serial numbers found. Add your first serial number to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  serialNumbers.map((serialNumber) => (
                    <TableRow key={serialNumber.id}>
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => handleEdit(serialNumber)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(serialNumber.id)}
                              className="gap-2 text-red-600"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
