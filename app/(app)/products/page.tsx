"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Plus, Package } from "lucide-react"
import { BarcodeReader } from "@/components/barcode-reader"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AddProductDialog } from "./add-product-dialog"
import { EditProductDialog } from "./edit-product-dialog"
import { ViewProductDialog } from "./view-product-dialog"
import { ManageSerialNumbersDialog } from "./manage-serial-numbers-dialog"
import { generateInventoryPDF } from '@/lib/generate-pdf'
import { cn, parsePrice, calculateTotalQuantity, calculateProductValue, formatCurrency } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STAFF'
}

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string | null
  description: string | null
  category: {
    name: string
  }
  manufacturer: string | null
  model: string | null
  price: string | number
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

// Authentication function with better error handling
const getCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await fetch('/api/auth/me')
    
    if (!res.ok) {
      if (res.status === 401) {
        console.log('Authentication required, redirecting to login')
        window.location.href = '/auth/login'
        return null
      }
      throw new Error('Authentication failed')
    }
    
    return await res.json()
  } catch (error) {
    console.error('Failed to get current user:', error)
    window.location.href = '/auth/login'
    return null
  }
}

export default function ProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const { toast } = useToast()

  // Fetch user and products
  useEffect(() => {
    const fetchUserAndProducts = async () => {
      setIsLoading(true)
      try {
        // Get current user
        const userData = await getCurrentUser()
        if (!userData) {
          // If getCurrentUser returns null, it means we're being redirected to login
          return
        }
        
        setUser(userData)

        // Fetch products
        const response = await fetch('/api/products')
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/auth/login'
            return
          }
          throw new Error('Failed to fetch products')
        }
        const data = await response.json()
        setProducts(data.products)
        
        // Extract unique categories with proper typing
        const uniqueCategories = Array.from(
          new Set(data.products.map((p: Product) => p.category.name))
        ) as string[]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndProducts()
  }, [])

  const getTotalStock = (product: Product) => {
    return calculateTotalQuantity(product.SerialNumber)
  }

  const getProductStatus = (product: Product) => {
    const totalStock = calculateTotalQuantity(product.SerialNumber)
    return totalStock === 0 ? "Out of Stock" : 
           totalStock <= product.minimumStock ? "Low Stock" : "In Stock"
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.category.name === categoryFilter
    const status = getProductStatus(product)
    const matchesStatus = statusFilter === "all" || status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, statusFilter])

  // Pagination handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId))
    }
  }

  const getStatusBadge = (product: Product) => {
    const status = getProductStatus(product)
    
    switch (status) {
      case "In Stock":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            In Stock
          </Badge>
        )
      case "Low Stock":
        return (
          <Badge variant="destructive" className="bg-orange-100 text-orange-800">
            Low Stock
          </Badge>
        )
      case "Out of Stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleClearProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/products/clear', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to clear products')
      }

      toast({
        title: "Success",
        description: "All products have been cleared successfully.",
      })

      // Clear local state
      setProducts([])
      setCategories([])
      setSelectedProducts([])
    } catch (error) {
      console.error('Error clearing products:', error)
      toast({
        title: "Error",
        description: "Failed to clear products. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add this function to refresh products after adding
  const handleProductAdded = () => {
    // Refetch products
    fetch('/api/products')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch products')
        return response.json()
      })
      .then(data => {
        setProducts(data.products)
        // Extract unique categories with proper typing
        const uniqueCategories = Array.from(
          new Set(data.products.map((p: Product) => p.category.name))
        ) as string[]
        setCategories(uniqueCategories)
      })
      .catch(error => {
        console.error('Error fetching products:', error)
        toast({
          title: "Error",
          description: "Failed to refresh products list",
          variant: "destructive"
        })
      })
  }

  const handleExportPDF = () => {
    generateInventoryPDF(products)
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      toast({
        title: "Success",
        description: `Product "${productName}" has been deleted successfully.`,
      })

      // Refresh the products list
      handleProductAdded()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} selected product(s)? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    try {
      // Delete products one by one
      const deletePromises = selectedProducts.map(productId => 
        fetch(`/api/products/${productId}`, { method: 'DELETE' })
      )

      const results = await Promise.allSettled(deletePromises)
      
      // Check if any deletions failed
      const failed = results.filter(result => result.status === 'rejected' || !result.value.ok)
      
      if (failed.length > 0) {
        throw new Error(`${failed.length} product(s) failed to delete`)
      }

      toast({
        title: "Success",
        description: `${selectedProducts.length} product(s) have been deleted successfully.`,
      })

      // Clear selection and refresh the products list
      setSelectedProducts([])
      handleProductAdded()
    } catch (error) {
      console.error('Error deleting products:', error)
      toast({
        title: "Error",
        description: "Failed to delete some products. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBarcodeScan = async (barcodeData: string) => {
    try {
      const response = await fetch(`/api/products/barcode/${barcodeData}`)
      if (response.ok) {
        const product = await response.json()
        
        // Highlight the found product
        setSearchTerm("")
        setCategoryFilter("all")
        setStatusFilter("all")
        
        // Find the product in the list and scroll to it
        const productElement = document.getElementById(`product-${product.id}`)
        if (productElement) {
          productElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          productElement.classList.add('bg-primary/10')
          setTimeout(() => {
            productElement.classList.remove('bg-primary/10')
          }, 2000)
        }
        
        toast({
          title: "Product Found",
          description: `Found: ${product.name} (${product.sku})`,
        })
      } else {
        toast({
          title: "Product Not Found",
          description: `No product found with barcode: ${barcodeData}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error scanning barcode:', error)
      toast({
        title: "Error",
        description: "Failed to process barcode scan",
        variant: "destructive",
      })
    }
  }

  // Show loading state while fetching user and products
  if (isLoading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Products</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Products</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              {user?.role === 'ADMIN' 
                ? "Manage your inventory and product catalog" 
                : "View your inventory and product catalog"
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BarcodeReader 
              onScan={handleBarcodeScan} 
              buttonText="Scan" 
              variant="outline"
              size="sm"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-transparent"
              onClick={handleExportPDF}
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => {
                // Show a toast with information about serial numbers
                toast({
                  title: "Serial Numbers System",
                  description: "Each product can have multiple serial numbers. Use the 'Manage Serial Numbers' button in each product's actions to add individual items.",
                })
              }}
            >
              <Package className="h-4 w-4" />
              Serial Numbers Info
            </Button>
            {/* Admin-only actions */}
            {user?.role === 'ADMIN' && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2" disabled={isLoading}>
                      <Trash2 className="h-4 w-4" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all products, categories, storage locations, and stock requests from the database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearProducts} disabled={isLoading}>
                        {isLoading ? "Clearing..." : "Yes, clear everything"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AddProductDialog onProductAdded={handleProductAdded} />
              </>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="In Stock">In Stock</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions - Admin only */}
        {selectedProducts.length > 0 && user?.role === 'ADMIN' && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
            <span className="text-sm font-medium">
              {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} selected
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm">
                Bulk Edit
              </Button>
              <Button variant="outline" size="sm">
                Export Selected
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkDelete}
                disabled={isLoading}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {user?.role === 'ADMIN' && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Serial Numbers</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow key={product.id} id={`product-${product.id}`} className="transition-colors">
                  {user?.role === 'ADMIN' && (
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell className="font-mono text-sm">{product.barcode || '-'}</TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        getTotalStock(product) === 0 ? "text-red-600" : 
                        getTotalStock(product) <= product.minimumStock ? "text-orange-600" : 
                        "text-green-600"
                      }`}
                    >
                      {getTotalStock(product)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {product.SerialNumber?.length || 0} total
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0} in stock
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(parsePrice(product.price))}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(calculateProductValue(product))}
                  </TableCell>
                  <TableCell>{getStatusBadge(product)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{product.manufacturer || '-'}</TableCell>
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
                        <ViewProductDialog
                          product={{
                            ...product,
                            SerialNumber: product.SerialNumber?.map(sn => ({
                              id: sn.id,
                              serial: sn.serial,
                              status: sn.status,
                              StorageLocation: sn.StorageLocation,
                            })) || [],
                          }}
                        />
                        {/* Admin-only actions */}
                        {user?.role === 'ADMIN' && (
                          <>
                            <EditProductDialog
                              product={{
                                ...product,
                                SerialNumber: product.SerialNumber?.map(sn => ({
                                  id: sn.id,
                                  serial: sn.serial,
                                  status: sn.status,
                                  StorageLocation: sn.StorageLocation,
                                })) || [],
                                price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
                              }}
                              onProductUpdated={handleProductAdded}
                            />
                            <ManageSerialNumbersDialog
                              product={{
                                ...product,
                                SerialNumber: product.SerialNumber?.map(sn => ({
                                  id: sn.id,
                                  serial: sn.serial,
                                  status: sn.status,
                                  StorageLocation: sn.StorageLocation,
                                })) || [],
                              }}
                              onSerialNumbersUpdated={handleProductAdded}
                            />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => {
                                toast({
                                  title: "Serial Numbers System",
                                  description: `This product has ${product.SerialNumber?.length || 0} serial numbers. Use 'Manage Serial Numbers' to add, edit, or remove individual items.`,
                                })
                              }}
                            >
                              <Package className="h-4 w-4" />
                              Serial Numbers Info
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="gap-2 text-red-600"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Product
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={user?.role === 'ADMIN' ? 11 : 10} className="h-24 text-center">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
            {filteredProducts.length !== products.length && ` (${products.length} total)`}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages || filteredProducts.length === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

