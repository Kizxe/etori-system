"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Barcode } from "lucide-react"

interface BarcodeInputProps {
  onSubmit: (barcodeData: string) => void
  onClose: () => void
  isOpen: boolean
}

export function BarcodeInput({ onSubmit, onClose, isOpen }: BarcodeInputProps) {
  const [barcodeValue, setBarcodeValue] = useState("")
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (barcodeValue.trim()) {
      onSubmit(barcodeValue.trim())
      setBarcodeValue("")
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Barcode</DialogTitle>
          <DialogDescription>
            Enter the barcode manually or use a handheld scanner.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Barcode className="h-10 w-10 text-muted-foreground" />
              <div className="grid flex-1 gap-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  placeholder="Scan or type barcode..."
                  className="font-mono"
                  autoFocus
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!barcodeValue.trim()}>
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 