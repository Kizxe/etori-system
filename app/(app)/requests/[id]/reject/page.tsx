"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { X, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RejectRequestPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [request, setRequest] = useState<any>(null)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchRequest = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const res = await fetch(`/api/requests/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })
        
        if (!res.ok) {
          // Handle different error statuses
          if (res.status === 401) {
            // Unauthorized - redirect to login
            toast({
              title: "Session Expired",
              description: "Please log in again to continue.",
              variant: "destructive",
            })
            router.push('/auth/login')
            return
          } else if (res.status === 404) {
            // Request not found - show not found UI without throwing error
            setRequest(null)
            return
          } else {
            throw new Error(`Server error: ${res.status}`)
          }
        }
        
        const data = await res.json()
        setRequest(data)
        setError(null)
      } catch (error) {
        console.error('Error fetching request:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch request')
        
        // Show toast only on final retry
        if (retryCount >= 2) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load request details. Please try again.",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchRequest()
    
    // Retry logic - retry up to 3 times with increasing delays
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
      }, 1000 * (retryCount + 1)) // 1s, 2s, 3s delays
      
      return () => clearTimeout(timer)
    }
  }, [id, retryCount, router, error])

  const handleReject = async () => {
    if (!notes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
        cache: 'no-store',
      })

      if (!res.ok) {
        // Handle different error statuses
        if (res.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          })
          router.push('/auth/login')
          return
        } else if (res.status === 404) {
          toast({
            title: "Error",
            description: "The request could not be found. It may have been deleted or processed already.",
            variant: "destructive",
          })
          router.push('/requests')
          return
        }
        
        throw new Error('Failed to reject request')
      }

      toast({
        title: "Success",
        description: "Request has been rejected.",
      })

      router.push('/requests')
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(0) // Reset retry count to trigger a new fetch
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Reject Request</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Reject Request</h1>
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="text-center py-6">
              <h3 className="mt-2 text-lg font-medium">Failed to load request</h3>
              <p className="mt-1 text-sm text-gray-500">
                There was a problem loading the request details.
              </p>
              <div className="mt-6 flex gap-2 justify-center">
                <Button onClick={handleRetry}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push('/requests')}>
                  Back to Requests
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Reject Request</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h3 className="mt-2 text-lg font-medium">Request not found</h3>
              <p className="mt-1 text-sm text-gray-500">
                The request you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <div className="mt-6">
                <Button onClick={() => router.push('/requests')}>
                  Back to Requests
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
        <h1 className="text-2xl font-bold">Reject Request</h1>
        <p className="text-muted-foreground">Reject the stock request from {request.requestedBy?.name || 'Unknown'}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Review the request before rejecting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Product</h3>
              <p className="text-base">{request.product?.name || 'Unknown'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
              <p className="text-base">{request.quantity}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Requested By</h3>
              <p className="text-base">{request.requestedBy?.name || 'Unknown'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Date Requested</h3>
              <p className="text-base">{new Date(request.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {request.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Request Notes</h3>
              <p className="text-base">{request.notes}</p>
            </div>
          )}

          <div className="pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Reason for Rejection (Required)</h3>
            <Textarea
              placeholder="Provide a reason for rejecting this request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[100px]"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push('/requests')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReject}
            disabled={isSubmitting || !notes.trim()}
            variant="destructive"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Reject Request
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 