"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { 
  ClipboardList, 
  Check, 
  X, 
  AlertTriangle, 
  Clock,
  Plus
} from "lucide-react"

// Define TypeScript interfaces for our data structures
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
  description?: string
}

interface StockRequest {
  id: string
  product: Product
  productId: string
  requestedBy: User
  userId: string
  quantity: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' 
  notes?: string
  createdAt: string
  updatedAt: string
}

// Updated authentication function with better error handling
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

const RequestsPage = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<StockRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserAndRequests = async () => {
      setIsLoading(true)
      try {
        // Get current user
        const userData = await getCurrentUser()
        if (!userData) {
          // If getCurrentUser returns null, it means we're being redirected to login
          // So we don't need to do anything else here
          return
        }
        
        setUser(userData)

        // Fetch appropriate requests based on role
        let endpoint = '/api/requests'
        const userRole = userData?.role?.toString().trim().toUpperCase()
        if (userRole === 'ADMIN') {
          endpoint = '/api/requests/admin'
        }
        
        const res = await fetch(endpoint)
        if (!res.ok) {
          // Check for unauthorized response
          if (res.status === 401) {
            window.location.href = '/auth/login'
            return
          }
          throw new Error('Failed to fetch requests')
        }
        
        const data = await res.json()
        setRequests(data.requests || [])
      } catch (error) {
        console.error('Error:', error)
        toast({
          title: "Error",
          description: `Failed to load requests. ${error instanceof Error ? error.message : 'Please try again.'}`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndRequests()
  }, [])

  const getStatusBadge = (status: 'PENDING' | 'APPROVED' | 'REJECTED' ) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          <Check className="mr-1 h-3 w-3" /> Approved
        </Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <X className="mr-1 h-3 w-3" /> Rejected
        </Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Requests</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  // Debug: Show current user role (remove this after fixing)
  if (user) {
    const userRole = user?.role?.toString().trim().toUpperCase()
    console.log('Current user role:', user.role, 'Type:', typeof user.role)
    console.log('Processed role:', userRole)
    console.log('Is ADMIN?', userRole === 'ADMIN')
    console.log('Is STAFF?', userRole === 'STAFF')
  }

  // Staff view - simpler list of their requests with ability to create new ones
  const userRole = user?.role?.toString().trim().toUpperCase()
  if (userRole === 'STAFF') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Stock Requests</h1>
            <p className="text-sm text-muted-foreground">Role: {user.role}</p>
          </div>
          
          <Button onClick={() => router.push('/requests/new')}>
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        </div>
        
        {requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">No requests yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create a new stock request to get started.
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push('/requests/new')}>
                    <Plus className="mr-2 h-4 w-4" /> New Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} onClick={() => router.push(`/requests/${request.id}`)} className="cursor-pointer hover:bg-muted">
                      <TableCell className="font-medium">{request.product.name}</TableCell>
                      <TableCell>{request.quantity}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{request.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Admin view - tabs for different request statuses and options to approve/reject
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Stock Requests Management</h1>
        <p className="text-sm text-muted-foreground">Role: {user?.role || 'Unknown'}</p>
      </div>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        {['pending', 'approved', 'rejected'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="pt-6">
                {requests.filter(r => tab === 'all' || r.status.toLowerCase() === tab).length === 0 ? (
                  <div className="text-center py-10">
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">No {tab} requests</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {tab === 'pending' 
                        ? "When staff members create requests, they'll appear here."
                        : `No ${tab} requests found.`
                      }
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requested By</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests
                        .filter(r => tab === 'all' || r.status.toLowerCase() === tab)
                        .map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.requestedBy.name}</TableCell>
                          <TableCell className="font-medium">{request.product.name}</TableCell>
                          <TableCell>{request.quantity}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="truncate max-w-[200px]">{request.notes || '-'}</TableCell>
                          <TableCell>
                            {request.status === 'PENDING' && (
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => router.push(`/requests/${request.id}/approve`)}
                                >
                                  <Check className="mr-1 h-4 w-4" /> Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => router.push(`/requests/${request.id}/reject`)}
                                >
                                  <X className="mr-1 h-4 w-4" /> Reject
                                </Button>
                              </div>
                            )}
                            {request.status === 'APPROVED' && (
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => router.push(`/requests/${request.id}/complete`)}
                              >
                                <Check className="mr-1 h-4 w-4" /> Mark Complete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default RequestsPage 