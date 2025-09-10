"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

interface NotificationType {
  id: string
  title: string
  message: string
  createdAt: string
  read: boolean
  type: 'STOCK_ALERT' | 'REQUEST_UPDATE' | 'SYSTEM'
  productId?: string | null
  requestId?: string | null
  product?: {
    id: string
    name: string
  }
}

export default function NotificationDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch('/api/notifications/user', {
        // Add cache: 'no-store' to prevent caching issues
        cache: 'no-store',
      })
      
      if (!res.ok) {
        // If response is not OK but we got a response, handle based on status
        if (res.status === 401) {
          // User is not authenticated, don't show error
          setNotifications([])
          setUnreadCount(0)
          return
        } else if (res.status === 404) {
          // API endpoint not found - just set empty notifications without error
          console.log("Notifications endpoint not available yet")
          setNotifications([])
          setUnreadCount(0)
          return
        }
        
        // For other errors, just set empty notifications and log the error
        console.warn(`Notifications API responded with status: ${res.status}`)
        setNotifications([])
        setUnreadCount(0)
        return
      }
      
      const data = await res.json()
      setNotifications(data)
      setUnreadCount(data.filter((notif: NotificationType) => !notif.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Don't set error state for notifications - just silently fail
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch notifications on component mount
    fetchNotifications()

    // Optional: Set up a polling mechanism to check for new notifications
    // Only poll if we're authenticated (we have notifications)
    const interval = setInterval(() => {
      if (!error) fetchNotifications()
    }, 60000) // every minute
    
    return () => clearInterval(interval)
  }, [error])

  // Refresh notifications when dropdown is opened
  useEffect(() => {
    if (isDropdownOpen) {
      fetchNotifications()
    }
  }, [isDropdownOpen])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        cache: 'no-store',
      })
      
      if (res.ok) {
        // Update local state
        setNotifications(notifications.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      // Silently fail
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`/api/notifications/read-all`, {
        method: 'PATCH',
        cache: 'no-store',
      })
      
      if (res.ok) {
        // Update local state
        setNotifications(notifications.map(notif => ({ ...notif, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      // Silently fail
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark as read first
    await markAsRead(notification.id)
    
    // Navigate based on notification type
    if (notification.type === 'REQUEST_UPDATE' && notification.requestId) {
      // Navigate to the specific request
      router.push(`/requests/${notification.requestId}`)
    } else if (notification.type === 'STOCK_ALERT' && notification.productId) {
      // Navigate to products page and highlight the product
      router.push(`/products`)
    } else {
      // Default navigation - could be to dashboard or a general notifications page
      router.push('/dashboard')
    }
  }

  const formatNotificationDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
    
    // Otherwise show full date
    return date.toLocaleDateString()
  }

  return (
    <DropdownMenu onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                fetchNotifications();
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="py-6 text-center text-muted-foreground">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="py-6 text-center text-muted-foreground flex flex-col items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span>{error}</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            {notifications.slice(0, 5).map(notification => (
              <DropdownMenuItem 
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.read ? 'bg-muted/40' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full justify-between">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatNotificationDate(notification.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
              </DropdownMenuItem>
            ))}
            
            {notifications.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center text-sm text-primary cursor-pointer p-2"
                  onClick={() => router.push('/dashboard')}
                >
                  View all notifications
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 