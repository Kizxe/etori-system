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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  MapPin
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StorageLocation {
  id: string
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

interface StorageLocationsDialogProps {
  onLocationsUpdated: () => void
}

export function StorageLocationsDialog({ onLocationsUpdated }: StorageLocationsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Fetch storage locations
  useEffect(() => {
    const fetchStorageLocations = async () => {
      try {
        const response = await fetch('/api/storage')
        if (response.ok) {
          const data = await response.json()
          setStorageLocations(data.storageLocations || [])
        }
      } catch (error) {
        console.error('Error fetching storage locations:', error)
      }
    }

    if (open) {
      fetchStorageLocations()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add storage location')
      }

      const newLocation = await response.json()
      setStorageLocations([...storageLocations, newLocation])
      
      toast({
        title: "Success",
        description: "Storage location added successfully",
      })

      setFormData({
        name: "",
        description: "",
      })
      setShowAddForm(false)
      onLocationsUpdated()
    } catch (error) {
      console.error('Error adding storage location:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add storage location",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (location: StorageLocation) => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/storage/${location.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update storage location')
      }

      const updatedLocation = await response.json()
      setStorageLocations(storageLocations.map(loc => 
        loc.id === location.id ? updatedLocation : loc
      ))
      
      toast({
        title: "Success",
        description: "Storage location updated successfully",
      })

      setEditingLocation(null)
      setFormData({
        name: "",
        description: "",
      })
      onLocationsUpdated()
    } catch (error) {
      console.error('Error updating storage location:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update storage location",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this storage location? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/storage/${locationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete storage location')
      }

      setStorageLocations(storageLocations.filter(loc => loc.id !== locationId))
      
      toast({
        title: "Success",
        description: "Storage location deleted successfully",
      })

      onLocationsUpdated()
    } catch (error) {
      console.error('Error deleting storage location:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete storage location",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (location: StorageLocation) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      description: location.description || "",
    })
  }

  const handleCancelEdit = () => {
    setEditingLocation(null)
    setFormData({
      name: "",
      description: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MapPin className="h-4 w-4" />
          Storage Locations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Storage Locations</DialogTitle>
          <DialogDescription>
            Manage storage locations for your inventory items. Each location can contain multiple serial numbers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Add New Storage Location Form */}
          {showAddForm && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Add New Storage Location</h3>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter location name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter location description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Location"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Storage Location Form */}
          {editingLocation && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Edit Storage Location: {editingLocation.name}</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editingLocation); }} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Location Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter location name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter location description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Location"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Storage Locations Table */}
          <div className="rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Storage Locations ({storageLocations.length})</h3>
              <div className="flex gap-2">
                {!showAddForm && (
                  <Button 
                    size="sm" 
                    onClick={() => setShowAddForm(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Location
                  </Button>
                )}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storageLocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No storage locations found. Add your first location to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  storageLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {location.description || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(location.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(location.updatedAt).toLocaleDateString()}
                      </TableCell>
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
                            <DropdownMenuItem 
                              onClick={() => handleEdit(location)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(location.id)}
                              className="gap-2 text-red-600"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
