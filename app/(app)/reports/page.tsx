"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, TrendingDown, AlertTriangle, Package } from "lucide-react"
import { generateInventoryPDF } from "@/lib/generate-pdf"
import { ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { CustomTooltip } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
import { cn, parsePrice, calculateTotalQuantity, calculateProductValue, formatCurrency } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import React from "react"
import { DateRange } from "react-day-picker"

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

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [reportType, setReportType] = useState("inventory")
  const [allProducts, setAllProducts] = useState<Product[]>([])

  // Fetch products when component mounts
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/products')
        if (!response.ok) throw new Error('Failed to fetch products')
        const data = await response.json()
        setAllProducts(data.products)
        setProducts(data.products)
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    fetchData()
  }, [])

  // Filter products when date range changes
  React.useEffect(() => {
    if (!dateRange?.from) {
      setProducts(allProducts)
      return
    }

    const from = dateRange.from
    const to = dateRange.to

    const filteredProducts = allProducts.filter(product => {
      const createdAt = new Date(product.createdAt)
      if (from && to) {
        return createdAt >= from && createdAt <= to
      }
      return createdAt >= from
    })

    setProducts(filteredProducts)
  }, [dateRange, allProducts])

  // Calculate metrics
  const totalProducts = products.length
  const totalValue = products.reduce((sum, product) => sum + calculateProductValue(product), 0)
  const lowStockItems = products.filter(product => {
    const totalQuantity = calculateTotalQuantity(product.SerialNumber)
    return totalQuantity <= product.minimumStock && totalQuantity > 0
  }).length
  const outOfStockItems = products.filter(product => 
    calculateTotalQuantity(product.SerialNumber) === 0
  ).length

  // Prepare chart data
  const stockValueByCategory = Object.entries(
    products.reduce((acc, product) => {
      const category = product.category.name
      const value = calculateProductValue(product)
      acc[category] = (acc[category] || 0) + value
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const stockLevels = products
    .sort((a, b) => {
      const aTotal = calculateTotalQuantity(a.SerialNumber)
      const bTotal = calculateTotalQuantity(b.SerialNumber)
      return bTotal - aTotal
    })
    .slice(0, 10)
    .map(product => ({
      name: product.name,
      current: calculateTotalQuantity(product.SerialNumber),
      minimum: product.minimumStock
    }))

  // Prepare table data
  const topProducts = products
    .map(product => ({
      ...product,
      totalQuantity: calculateTotalQuantity(product.SerialNumber),
      totalValue: calculateProductValue(product)
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10)

  const categoryColors = [
    "#2563EB", "#DC2626", "#059669", "#7C3AED", "#DB2777",
    "#9333EA", "#D97706", "#2563EB", "#DC2626", "#059669"
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <div className="flex items-center space-x-2">
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
          />
          <Button onClick={() => generateInventoryPDF(products)}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalValue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockItems}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{outOfStockItems}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Top Products by Value</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category.name}</TableCell>
                        <TableCell className="text-right">{product.totalQuantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(parsePrice(product.price))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(product.totalValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockValueByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {stockValueByCategory.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={categoryColors[index % categoryColors.length]} 
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockLevels} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="current" fill="#2563EB" name="Current Stock" />
                      <Bar dataKey="minimum" fill="#DC2626" name="Minimum Stock" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Minimum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products
                      .filter(product => {
                        const totalQuantity = calculateTotalQuantity(product.SerialNumber)
                        return totalQuantity <= product.minimumStock
                      })
                      .map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-right">
                            {calculateTotalQuantity(product.SerialNumber)}
                          </TableCell>
                          <TableCell className="text-right">{product.minimumStock}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
