"use client"

import { useEffect, useState } from "react"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Package, TrendingUp, TrendingDown, AlertTriangle, Plus } from "lucide-react"
import { BarcodeReader } from "@/components/barcode-reader"
import { ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { CustomTooltip } from "@/components/ui/chart"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { SerialNumbersOverview } from "./serial-numbers-overview"

interface Product {
  id: string
  name: string
  category: {
    name: string
  }
  minimumStock: number
  SerialNumber?: {
    status: string
  }[]
  createdAt: string
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [scanningProduct, setScanningProduct] = useState<Product | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        if (!response.ok) throw new Error('Failed to fetch products')
        const data = await response.json()
        setProducts(data.products)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Calculate dashboard metrics
  const totalProducts = products.length
  const totalStock = products.reduce((sum, product) => 
    sum + (product.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0), 0
  )
  const lowStockItems = products.filter(product => {
    const stock = product.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0
    return stock <= product.minimumStock && stock > 0
  }).length
  const outOfStockItems = products.filter(product => {
    const inStockCount = product.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0
    const outOfStockCount = product.SerialNumber?.filter(sn => sn.status === 'OUT_OF_STOCK').length || 0
    // Consider out of stock if no IN_STOCK items OR if there are OUT_OF_STOCK items
    return inStockCount === 0 || outOfStockCount > 0
  }).length

  // Prepare chart data
  const categoryData = products.reduce((acc: { name: string; value: number }[], product) => {
    const existingCategory = acc.find(cat => cat.name === product.category.name)
    if (existingCategory) {
      existingCategory.value++
    } else {
      acc.push({ name: product.category.name, value: 1 })
    }
    return acc
  }, [])

  const categoryColors = [
    "#2563EB", // Blue
    "#7C3AED", // Purple
    "#059669", // Green
    "#DC2626", // Red
    "#EA580C", // Orange
    "#0891B2", // Cyan
    "#4F46E5", // Indigo
    "#D97706", // Amber
  ]

  // Get recent activity
  const recentActivity = products
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  const handleScanProduct = (barcode: string) => {
    const product = products.find(p => p.id === barcode)
    if (product) {
      setScanningProduct(product)
      toast({
        title: "Product Found!",
        description: `${product.name} - Stock: ${product.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0}`,
      })
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode",
        variant: "destructive",
      })
    }
  }

  const handleQuickAdd = () => {
    router.push('/products/add')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your inventory.
          </p>
        </div>
        <Button onClick={handleQuickAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Products in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">
              Total units available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items below minimum
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items with zero stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>Distribution of products by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
            <CardDescription>Current stock levels overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">In Stock</span>
                <span className="text-sm text-muted-foreground">
                  {products.filter(p => (p.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0) > 0).length} products
                </span>
              </div>
              <Progress 
                value={((products.filter(p => (p.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0) > 0).length) / totalProducts) * 100} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Low Stock</span>
                <span className="text-sm text-muted-foreground">{lowStockItems} products</span>
              </div>
              <Progress 
                value={(lowStockItems / totalProducts) * 100} 
                className="h-2 bg-yellow-100"
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Out of Stock</span>
                <span className="text-sm text-muted-foreground">{outOfStockItems} products</span>
              </div>
              <Progress 
                value={(outOfStockItems / totalProducts) * 100} 
                className="h-2 bg-red-100"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest products added to inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((product) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category.name}</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {new Date(product.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Barcode Scanner */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Scan</CardTitle>
          <CardDescription>Scan a product barcode to get instant information</CardDescription>
        </CardHeader>
        <CardContent>
          <BarcodeReader onScan={handleScanProduct} />
          {scanningProduct && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium">{scanningProduct.name}</h4>
              <p className="text-sm text-muted-foreground">
                Stock: {scanningProduct.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0} units
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Serial Numbers Overview */}
      <SerialNumbersOverview limit={8} />
    </div>
  )
}
