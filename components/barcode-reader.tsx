"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BarcodeScanner } from "./barcode-scanner"
import { BarcodeInput } from "./barcode-input"
import { Scan, Barcode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BarcodeReaderProps {
  onScan: (barcodeData: string) => void
  buttonText?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function BarcodeReader({ 
  onScan, 
  buttonText = "Scan Barcode", 
  variant = "default",
  size = "default"
}: BarcodeReaderProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isInputOpen, setIsInputOpen] = useState(false)
  const [isBarcodeDetectorSupported, setIsBarcodeDetectorSupported] = useState<boolean | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if BarcodeDetector is supported
    const checkBarcodeDetectorSupport = async () => {
      try {
        if ('BarcodeDetector' in window) {
          // @ts-ignore - BarcodeDetector is not in TypeScript's lib.dom.d.ts yet
          const formats = await window.BarcodeDetector.getSupportedFormats()
          setIsBarcodeDetectorSupported(formats.length > 0)
        } else {
          setIsBarcodeDetectorSupported(false)
        }
      } catch (error) {
        console.error("Error checking BarcodeDetector support:", error)
        setIsBarcodeDetectorSupported(false)
      }
    }
    
    checkBarcodeDetectorSupport()
  }, [])
  
  const handleOpenScanner = () => {
    if (isBarcodeDetectorSupported) {
      setIsScannerOpen(true)
    } else {
      setIsInputOpen(true)
    }
  }
  
  const handleScanComplete = (barcodeData: string) => {
    onScan(barcodeData)
    setIsScannerOpen(false)
    setIsInputOpen(false)
    
    toast({
      title: "Barcode Scanned",
      description: `Barcode: ${barcodeData}`,
    })
  }
  
  const handleCloseScanner = () => {
    setIsScannerOpen(false)
  }
  
  const handleCloseInput = () => {
    setIsInputOpen(false)
  }
  
  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        onClick={handleOpenScanner}
        className="gap-2"
      >
        {isBarcodeDetectorSupported ? <Scan className="h-4 w-4" /> : <Barcode className="h-4 w-4" />}
        {buttonText}
      </Button>
      
      {isBarcodeDetectorSupported && (
        <BarcodeScanner 
          isOpen={isScannerOpen} 
          onScan={handleScanComplete} 
          onClose={handleCloseScanner} 
        />
      )}
      
      {(!isBarcodeDetectorSupported || !isScannerOpen) && (
        <BarcodeInput 
          isOpen={isInputOpen} 
          onSubmit={handleScanComplete} 
          onClose={handleCloseInput} 
        />
      )}
    </>
  )
} 