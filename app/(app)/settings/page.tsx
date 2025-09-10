"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { StorageLocationsDialog } from "./storage-locations-dialog"
 
// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  department: z.string().optional(),
})

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Preferences schema
const preferencesSchema = z.object({
  darkMode: z.boolean(),
  dateFormat: z.enum(["dmy", "mdy", "ymd"]),
  lowStockAlert: z.boolean(),
  stockRequestNotification: z.boolean(),
})

// SKU Settings schema
const skuSettingsSchema = z.object({
  prefix: z.string()
    .min(1, { message: "Prefix is required" })
    .max(5, { message: "Prefix should be 5 characters or less" })
    .refine(value => /^[A-Za-z0-9]+$/.test(value), {
      message: "Prefix must contain only letters and numbers",
    }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type PasswordFormValues = z.infer<typeof passwordFormSchema>
type PreferencesValues = z.infer<typeof preferencesSchema>
type SKUSettingsValues = z.infer<typeof skuSettingsSchema>

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [skuInfo, setSkuInfo] = useState({ prefix: "", currentValue: 0, nextSKU: "" })
  const [isLoadingSKU, setIsLoadingSKU] = useState(false)

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
    }
  })

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  })

  // Preferences form
  const preferencesForm = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      darkMode: false,
      dateFormat: "dmy",
      lowStockAlert: true,
      stockRequestNotification: true,
    }
  })

  // SKU settings form
  const skuSettingsForm = useForm<SKUSettingsValues>({
    resolver: zodResolver(skuSettingsSchema),
    defaultValues: {
      prefix: "",
    }
  })

  // Load user data and preferences
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user')
        
        if (response.status === 401) {
          // Redirect to login page if unauthorized
          window.location.href = '/auth/login'
          return
        }
        
        if (!response.ok) throw new Error('Failed to fetch user data')
        
        const data = await response.json()
        
        profileForm.reset({
          name: data.name,
          email: data.email,
          department: data.department,
        })

        if (data.preferences) {
          const preferences = JSON.parse(data.preferences)
          preferencesForm.reset({
            darkMode: preferences.darkMode,
            dateFormat: preferences.dateFormat,
            lowStockAlert: preferences.lowStockAlert ?? true,
            stockRequestNotification: preferences.stockRequestNotification ?? true,
          })
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive"
        })
      }
    }
    fetchUserData()
  }, [])
  
  // Load SKU settings
  useEffect(() => {
    const fetchSKUSettings = async () => {
      try {
        const response = await fetch('/api/settings/sku-prefix')
        if (response.ok) {
          const data = await response.json()
          setSkuInfo(data)
          skuSettingsForm.setValue('prefix', data.prefix)
        }
      } catch (error) {
        console.error('Error fetching SKU settings:', error)
      }
    }

    fetchSKUSettings()
  }, [])

    // Handle profile update
    async function onProfileSubmit(data: ProfileFormValues) {
      setIsLoading(true)
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update profile')

      toast({
        title: "Success",
        description: "Your profile has been updated.",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password update
  async function onPasswordSubmit(data: PasswordFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update password')

      toast({
        title: "Success",
        description: "Your password has been updated.",
      })
      passwordForm.reset()
    } catch (error) {
      console.error('Error updating password:', error)
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle preferences update
  async function onPreferencesSubmit(data: PreferencesValues) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update preferences')

      toast({
        title: "Success",
        description: "Your preferences have been updated.",
      })

      // Apply dark mode change immediately
      document.documentElement.classList.toggle('dark', data.darkMode)
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onSKUSettingsSubmit(data: SKUSettingsValues) {
    setIsLoadingSKU(true)
    try {
      const response = await fetch('/api/settings/sku-prefix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefix: data.prefix }),
      })

      if (!response.ok) {
        throw new Error('Failed to update SKU prefix')
      }

      const result = await response.json()
      setSkuInfo(result)

      toast({
        title: "Success",
        description: "SKU prefix updated successfully",
      })
    } catch (error) {
      console.error('Error updating SKU prefix:', error)
      toast({
        title: "Error",
        description: "Failed to update SKU prefix",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSKU(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your account settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your department" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...preferencesForm}>
                <form className="space-y-4">
                  <FormField
                    control={preferencesForm.control}
                    name="lowStockAlert"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Low Stock Alerts</FormLabel>
                          <FormDescription>
                            Receive notifications when products are running low.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Separator />
                  <FormField
                    control={preferencesForm.control}
                    name="stockRequestNotification"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Stock Requests</FormLabel>
                          <FormDescription>
                            Get notified about new stock requests.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="button" 
                    disabled={isLoading}
                    onClick={preferencesForm.handleSubmit(onPreferencesSubmit)}
                  >
                    {isLoading ? "Saving..." : "Save notification preferences"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...preferencesForm}>
                <form className="space-y-4">
                  <FormField
                    control={preferencesForm.control}
                    name="darkMode"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Dark Mode</FormLabel>
                          <FormDescription>
                            Switch between light and dark themes.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Separator />
                  <FormField
                    control={preferencesForm.control}
                    name="dateFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Format</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                            <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                            <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="button" 
                    disabled={isLoading}
                    onClick={preferencesForm.handleSubmit(onPreferencesSubmit)}
                  >
                    {isLoading ? "Saving..." : "Save appearance settings"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SKU Settings</CardTitle>
              <CardDescription>
                Configure how SKUs are generated for new products.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Current SKU Information</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Current Prefix</div>
                    <div className="font-mono">{skuInfo.prefix}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Current Counter</div>
                    <div className="font-mono">{skuInfo.currentValue}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Next SKU</div>
                    <div className="font-mono">{skuInfo.nextSKU}</div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <Form {...skuSettingsForm}>
                <form onSubmit={skuSettingsForm.handleSubmit(onSKUSettingsSubmit)} className="space-y-4">
                  <FormField
                    control={skuSettingsForm.control}
                    name="prefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU Prefix</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={5} className="uppercase" />
                        </FormControl>
                        <FormDescription>
                          Set a prefix for automatically generated SKUs (e.g., "SKU" for SKU-00001)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isLoadingSKU}>
                    {isLoadingSKU && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Prefix
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage Locations</CardTitle>
              <CardDescription>
                Manage storage locations for your inventory items. Each location can contain multiple serial numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Storage Management</div>
                  <div className="text-sm text-muted-foreground">
                    Add, edit, and manage storage locations for better inventory organization.
                  </div>
                </div>
                <StorageLocationsDialog onLocationsUpdated={() => {}} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}