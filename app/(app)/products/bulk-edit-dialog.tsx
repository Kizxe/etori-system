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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Edit, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Product } from "@/lib/types"

interface BulkEditDialogProps {
  selectedProducts: Product[]
  onBulkEditComplete: () => void
}

export function BulkEditDialog({ selectedProducts, onBulkEditComplete }: BulkEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  const [editFields, setEditFields] = useState({
    category: false,
    manufacturer: false,
    model: false,
    price: false,
    minimumStock: false,
    description: false,
  })

  const [formData, setFormData] = useState({
    categoryName: "",
    manufacturer: "",
    model: "",
    price: "",
    minimumStock: "",
    description: "",
  })

  const handleFieldToggle = (field: keyof typeof editFields) => {
    setEditFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare the update data based on selected fields
      const updateData: any = {}
      
      if (editFields.category && formData.categoryName) {
        updateData.categoryName = formData.categoryName
      }
      if (editFields.manufacturer) {
        updateData.manufacturer = formData.manufacturer || null
      }
      if (editFields.model) {
        updateData.model = formData.model || null
      }
      if (editFields.price && formData.price) {
        updateData.price = parseFloat(formData.price)
      }
      if (editFields.minimumStock && formData.minimumStock) {
        updateData.minimumStock = parseInt(formData.minimumStock)
      }
      if (editFields.description) {
        updateData.description = formData.description || null
      }

      // Update each selected product
      const updatePromises = selectedProducts.map(product => 
        fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })
      )

      const results = await Promise.allSettled(updatePromises)
      
      // Check if any updates failed
      const failed = results.filter(result => result.status === 'rejected' || !result.value?.ok)
      
      if (failed.length > 0) {
        throw new Error(`${failed.length} product(s) failed to update`)
      }

      toast({
        title: "Success",
        description: `${selectedProducts.length} product(s) have been updated successfully.`,
      })

      setOpen(false)
      onBulkEditComplete()
    } catch (error) {
      console.error('Error updating products:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update products",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getUniqueValues = (field: keyof Product) => {
    const values = selectedProducts.map(p => {
      if (field === 'category') return p.category.name
      return p[field] as string | null
    }).filter(Boolean)
    
    return Array.from(new Set(values))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Bulk Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Edit Products</DialogTitle>
          <DialogDescription>
            Edit multiple products at once. Select which fields to update and provide the new values.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Selected Products Info */}
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4" />
                <span className="font-medium">Selected Products ({selectedProducts.length})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedProducts.map((product) => (
                  <Badge key={product.id} variant="secondary" className="text-xs">
                    {product.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Field Selection */}
            <div className="space-y-4">
              <h4 className="font-medium">Select Fields to Update</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="category"
                    checked={editFields.category}
                    onCheckedChange={() => handleFieldToggle('category')}
                  />
                  <Label htmlFor="category" className="text-sm">
                    Category
                    {editFields.category && (
                      <span className="text-muted-foreground ml-1">
                        (Current: {getUniqueValues('category').join(', ') || 'N/A'})
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="manufacturer"
                    checked={editFields.manufacturer}
                    onCheckedChange={() => handleFieldToggle('manufacturer')}
                  />
                  <Label htmlFor="manufacturer" className="text-sm">
                    Manufacturer
                    {editFields.manufacturer && (
                      <span className="text-muted-foreground ml-1">
                        (Current: {getUniqueValues('manufacturer').join(', ') || 'N/A'})
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="model"
                    checked={editFields.model}
                    onCheckedChange={() => handleFieldToggle('model')}
                  />
                  <Label htmlFor="model" className="text-sm">
                    Model
                    {editFields.model && (
                      <span className="text-muted-foreground ml-1">
                        (Current: {getUniqueValues('model').join(', ') || 'N/A'})
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="price"
                    checked={editFields.price}
                    onCheckedChange={() => handleFieldToggle('price')}
                  />
                  <Label htmlFor="price" className="text-sm">
                    Price
                    {editFields.price && (
                      <span className="text-muted-foreground ml-1">
                        (Current: {getUniqueValues('price').join(', ') || 'N/A'})
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="minimumStock"
                    checked={editFields.minimumStock}
                    onCheckedChange={() => handleFieldToggle('minimumStock')}
                  />
                  <Label htmlFor="minimumStock" className="text-sm">
                    Minimum Stock
                    {editFields.minimumStock && (
                      <span className="text-muted-foreground ml-1">
                        (Current: {getUniqueValues('minimumStock').join(', ') || 'N/A'})
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="description"
                    checked={editFields.description}
                    onCheckedChange={() => handleFieldToggle('description')}
                  />
                  <Label htmlFor="description" className="text-sm">
                    Description
                    {editFields.description && (
                      <span className="text-muted-foreground ml-1">
                        (Current: {getUniqueValues('description').join(', ') || 'N/A'})
                      </span>
                    )}
                  </Label>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <h4 className="font-medium">New Values</h4>
              
              {editFields.category && (
                <div className="grid gap-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={formData.categoryName}
                    onChange={(e) => handleChange("categoryName", e.target.value)}
                    placeholder="Enter new category name"
                    disabled={isLoading}
                    required
                  />
                </div>
              )}

              {editFields.manufacturer && (
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
              )}

              {editFields.model && (
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
              )}

              {editFields.price && (
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="Enter new price"
                    disabled={isLoading}
                    required
                  />
                </div>
              )}

              {editFields.minimumStock && (
                <div className="grid gap-2">
                  <Label htmlFor="minimumStock">Minimum Stock</Label>
                  <Input
                    id="minimumStock"
                    type="number"
                    min="0"
                    value={formData.minimumStock}
                    onChange={(e) => handleChange("minimumStock", e.target.value)}
                    placeholder="Enter minimum stock level"
                    disabled={isLoading}
                    required
                  />
                </div>
              )}

              {editFields.description && (
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter new description"
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !Object.values(editFields).some(Boolean)}>
              {isLoading ? "Updating..." : "Update Products"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
