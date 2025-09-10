"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// Removed Select component imports to avoid infinite loops
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Loader2, ClipboardList, Package, RefreshCw } from "lucide-react"

// Define TypeScript interfaces
interface Product {
  id: string
  name: string
  sku: string
}

interface SerialNumber {
  id: string
  serial: string
  status: string
  StorageLocation?: {
    id: string
    name: string
  }
}

// Simple SerialNumberItem component
const SerialNumberItem = ({ 
  serial, 
  isSelected, 
  onToggle 
}: { 
  serial: SerialNumber
  isSelected: boolean
  onToggle: (id: string) => void
}) => (
  <div className="flex items-center space-x-2 p-2 border-b">
    <input
      type="checkbox"
      id={serial.id}
      checked={isSelected}
      onChange={() => onToggle(serial.id)}
      className="h-4 w-4"
    />
    <label htmlFor={serial.id} className="flex-1 cursor-pointer">
      <div className="text-sm font-medium">{serial.serial}</div>
      {serial.StorageLocation && (
        <div className="text-xs text-gray-500">
          Location: {serial.StorageLocation.name}
        </div>
      )}
    </label>
  </div>
)

export default function NewRequestPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [availableSerialNumbers, setAvailableSerialNumbers] = useState<SerialNumber[]>([])
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSerials, setIsLoadingSerials] = useState(false)
  
  // Form state - using simple state instead of react-hook-form
  const [selectedProductId, setSelectedProductId] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/products')
        if (!res.ok) throw new Error('Failed to fetch products')
        const data = await res.json()
        setProducts(data.products)
      } catch (error) {
        console.error('Error:', error)
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Fetch serial numbers when product is selected
  useEffect(() => {
    if (selectedProductId) {
      fetchSerialNumbers(selectedProductId)
    } else {
      // Clear serial numbers when no product is selected
      setAvailableSerialNumbers([])
      setSelectedSerialNumbers([])
    }
  }, [selectedProductId])

  const fetchSerialNumbers = async (productId: string) => {
    setIsLoadingSerials(true)
    try {
      const res = await fetch(`/api/products/${productId}/serial-numbers`)
      if (!res.ok) throw new Error('Failed to fetch serial numbers')
      const data = await res.json()
      setAvailableSerialNumbers(data.serialNumbers)
    } catch (error) {
      console.error('Error fetching serial numbers:', error)
      toast({
        title: "Error",
        description: "Failed to load serial numbers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSerials(false)
    }
  }

  const handleSerialNumberToggle = (serialId: string) => {
    setSelectedSerialNumbers(prev => {
      if (prev.includes(serialId)) {
        return prev.filter(id => id !== serialId)
      } else {
        return [...prev, serialId]
      }
    })
  }

  const handleRefreshSerialNumbers = () => {
    if (selectedProductId) {
      fetchSerialNumbers(selectedProductId)
      // Clear selections when refreshing
      setSelectedSerialNumbers([])
    }
  }

  const validateForm = () => {
    // Validation
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "Please select a product.",
        variant: "destructive",
      })
      return false
    }

    if (selectedSerialNumbers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one serial number.",
        variant: "destructive",
      })
      return false
    }

    // Validate that all selected serial numbers are still available
    const availableSerialIds = availableSerialNumbers.map(sn => sn.id)
    const invalidSerialNumbers = selectedSerialNumbers.filter(id => !availableSerialIds.includes(id))
    
    if (invalidSerialNumbers.length > 0) {
      toast({
        title: "Error",
        description: "Some selected serial numbers are no longer available. Please refresh and try again.",
        variant: "destructive",
      })
      // Clear invalid selections
      setSelectedSerialNumbers(prev => prev.filter(id => availableSerialIds.includes(id)))
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProductId,
          notes: notes,
          serialNumberIds: selectedSerialNumbers,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create request')
      }

      toast({
        title: "Success",
        description: "Your stock request has been submitted.",
      })

      router.push('/requests')
    } catch (error) {
      console.error('Error submitting request:', error)
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('serial numbers are not available')) {
          toast({
            title: "Serial Numbers Unavailable",
            description: "Some selected serial numbers are no longer available. Please refresh the list and try again.",
            variant: "destructive",
          })
          // Refresh serial numbers and clear selections
          handleRefreshSerialNumbers()
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to submit your request. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">New Stock Request</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/requests')}
          className="mb-4"
        >
          Back to Requests
        </Button>
        <h1 className="text-2xl font-bold">New Stock Request</h1>
        <p className="text-muted-foreground">Request to mark an item as out of stock.</p>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no products available to request.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Fill in the details for your stock out request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* Product Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  disabled={isSubmitting}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Serial Number Selection */}
              {selectedProductId && availableSerialNumbers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">Select Serial Numbers</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose which specific serial numbers to mark as out of stock
                        <span className="text-blue-600 font-medium">
                          {" "}(Available: {availableSerialNumbers.length})
                        </span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshSerialNumbers}
                      disabled={isLoadingSerials}
                      className="ml-4"
                    >
                      {isLoadingSerials ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-2">Refresh</span>
                    </Button>
                  </div>

                  {isLoadingSerials ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading serial numbers...</span>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      {availableSerialNumbers.map((serial) => (
                        <SerialNumberItem
                          key={serial.id}
                          serial={serial}
                          isSelected={selectedSerialNumbers.includes(serial.id)}
                          onToggle={handleSerialNumberToggle}
                        />
                      ))}
                    </div>
                  )}

                  {selectedSerialNumbers.length > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Selected Serial Numbers ({selectedSerialNumbers.length}):
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSerialNumbers.map((serialId) => {
                          const serial = availableSerialNumbers.find(s => s.id === serialId)
                          return (
                            <span
                              key={serialId}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {serial?.serial}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        Please select at least one serial number to continue.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedProductId && availableSerialNumbers.length === 0 && !isLoadingSerials && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">
                        No Available Stock
                      </h4>
                      <p className="text-sm text-yellow-700">
                        This product has no items currently in stock.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add any additional information here..."
                  className="resize-y min-h-[100px]"
                  disabled={isSubmitting}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Add any details about why this product should be marked out of stock
                </p>
              </div>

              <ConfirmationDialog
                trigger={
                  <Button 
                    type="button" 
                    disabled={isSubmitting || (selectedProductId && availableSerialNumbers.length === 0) || selectedSerialNumbers.length === 0}
                  >
                    Submit Request
                  </Button>
                }
                title="Confirm Stock Request Submission"
                description={`Are you sure you want to submit this request? This will request ${selectedSerialNumbers.length} unit(s) of ${products.find(p => p.id === selectedProductId)?.name || 'the selected product'} to be marked as out of stock. This action cannot be undone.`}
                confirmText="Yes, Submit Request"
                cancelText="Cancel"
                onConfirm={handleSubmit}
                isLoading={isSubmitting}
              />
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}