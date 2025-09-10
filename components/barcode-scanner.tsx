"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BarcodeScannerProps {
  onScan: (barcodeData: string) => void
  onClose: () => void
  isOpen: boolean
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    let stream: MediaStream | null = null
    let animationFrameId: number | null = null
    let barcodeDetector: any = null
    
    const startScanner = async () => {
      if (!isOpen) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Check if BarcodeDetector is available
        if ('BarcodeDetector' in window) {
          // @ts-ignore - BarcodeDetector is not in TypeScript's lib.dom.d.ts yet
          barcodeDetector = new window.BarcodeDetector({ 
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
          })
        } else {
          throw new Error("Barcode detection is not supported in this browser")
        }
        
        // Access camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        
        setIsLoading(false)
        
        // Start scanning
        const detectBarcode = async () => {
          if (!videoRef.current || !canvasRef.current || !barcodeDetector) return
          
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current)
            
            if (barcodes.length > 0) {
              // Found a barcode
              const barcode = barcodes[0]
              
              // Draw rectangle around barcode
              const ctx = canvasRef.current.getContext('2d')
              if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                ctx.lineWidth = 4
                ctx.strokeStyle = '#00FF00'
                ctx.beginPath()
                ctx.rect(
                  barcode.boundingBox.x,
                  barcode.boundingBox.y,
                  barcode.boundingBox.width,
                  barcode.boundingBox.height
                )
                ctx.stroke()
                
                // Show the barcode value
                ctx.fillStyle = '#00FF00'
                ctx.font = '20px Arial'
                ctx.fillText(barcode.rawValue, barcode.boundingBox.x, barcode.boundingBox.y - 10)
              }
              
              // Call the onScan callback with the barcode data
              onScan(barcode.rawValue)
              
              // Stop scanning
              if (stream) {
                stream.getTracks().forEach(track => track.stop())
              }
              if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
              }
              return
            }
            
            // Clear canvas if no barcode found
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            }
            
            // Continue scanning
            animationFrameId = requestAnimationFrame(detectBarcode)
          } catch (err) {
            console.error("Barcode detection error:", err)
            animationFrameId = requestAnimationFrame(detectBarcode)
          }
        }
        
        // Set canvas size to match video
        if (videoRef.current && canvasRef.current) {
          const { videoWidth, videoHeight } = videoRef.current
          canvasRef.current.width = videoWidth
          canvasRef.current.height = videoHeight
        }
        
        // Start detection loop
        detectBarcode()
        
      } catch (err: any) {
        console.error("Scanner error:", err)
        setError(err.message || "Failed to start barcode scanner")
        setIsLoading(false)
      }
    }
    
    startScanner()
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isOpen, onScan])
  
  const handleClose = () => {
    onClose()
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Position the barcode within the camera view to scan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative aspect-video w-full overflow-hidden rounded-md">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4 text-center">
              <X className="h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try using a different browser or device with a camera.
              </p>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            className="h-full w-full object-cover" 
            playsInline 
            muted
          />
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 