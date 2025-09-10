"use client"

import { useEffect, useState } from "react"
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
import { Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  price: number
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
}

interface EditProductDialogProps {
  product: Product
  onProductUpdated: () => void
}

export function EditProductDialog({ product, onProductUpdated }: EditProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    categoryName: "",
    manufacturer: "",
    model: "",
    price: "0.00",
    minimumStock: "0",
    SerialNumber: [] as { id: string; serial: string; status: string; StorageLocation?: { id: string; name: string; description?: string | null } | null }[]
  })

  useEffect(() => {
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      categoryName: product.category.name,
      manufacturer: product.manufacturer || "",
      model: product.model || "",
      price: typeof product.price === 'number' ? product.price.toFixed(2) : "0.00",
      minimumStock: product.minimumStock.toString(),
      SerialNumber: product.SerialNumber?.map(sn => ({
        id: sn.id,
        serial: sn.serial,
        status: sn.status,
        StorageLocation: sn.StorageLocation
      })) || []
    })
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          description: formData.description || null,
          categoryName: formData.categoryName,
          manufacturer: formData.manufacturer || null,
          model: formData.model || null,
          price: parseFloat(formData.price),
          minimumStock: parseInt(formData.minimumStock),
          SerialNumber: formData.SerialNumber.map(sn => ({
            id: sn.id,
            serial: sn.serial,
            status: sn.status,
            StorageLocation: sn.StorageLocation
          }))
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update product')
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      setOpen(false)
      onProductUpdated()
    } catch (error) {
      console.error('Error updating product:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSerialNumberChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      SerialNumber: prev.SerialNumber.map((sn, i) => 
        i === index ? { ...sn, [field]: value } : sn
      )
    }))
  }

  const handleStorageLocationChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      SerialNumber: prev.SerialNumber.map((sn, i) => 
        i === index ? { 
          ...sn, 
          StorageLocation: { 
            ...sn.StorageLocation, 
            [field]: value 
          } 
        } : sn
      )
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem 
          onSelect={(e) => {
            e.preventDefault()
            setOpen(true)
          }} 
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Product
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Make changes to the product information below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter product name"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  placeholder="Enter SKU"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter product description"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.categoryName}
                  onChange={(e) => handleChange("categoryName", e.target.value)}
                  placeholder="Enter category name"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="Enter price"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleChange("manufacturer", e.target.value)}
                  placeholder="Enter manufacturer name"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  placeholder="Enter model number"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Serial Numbers & Storage Locations</Label>
              {formData.SerialNumber.map((sn, index) => (
                <div key={sn.id} className="grid grid-cols-3 gap-4 p-3 border rounded-lg">
                  <div className="grid gap-1">
                    <Label className="text-xs">Serial Number</Label>
                    <Input
                      value={sn.serial}
                      onChange={(e) => handleSerialNumberChange(index, "serial", e.target.value)}
                      placeholder="Serial number"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={sn.status} onValueChange={(value) => handleSerialNumberChange(index, "status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN_STOCK">In Stock</SelectItem>
                        <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                        <SelectItem value="RESERVED">Reserved</SelectItem>
                        <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Storage Location</Label>
                    <Input
                      value={sn.StorageLocation?.name || ''}
                      onChange={(e) => handleStorageLocationChange(index, "name", e.target.value)}
                      placeholder="Location name"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 