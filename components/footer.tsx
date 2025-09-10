"use client"

import { Github, Linkedin, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">E-tori</h3>
            <p className="text-sm text-muted-foreground">
              E-tori ialah sistem pengurusan inventori dalaman yang membantu syarikat menyusun, 
              menyimpan dan menjejak stok dengan lebih mudah. 
              Di buat dengan penuh kasih sayang dari Muhammad Irfan Bin Rosani. 
            </p>
            <div className="flex space-x-4">
          
              
              <Link 
                href="mailto:info@inventorypro.com" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/requests" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Requests
                </Link>
              </li>
              <li>
                <Link href="/reports" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Reports
                </Link>
              </li>
            </ul>
          </div>


          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+60 11 1050 1551</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>irfan@tbbasb.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Flora CBD, Suite 4805 3 - 8, Block 4805 CBD Perdana, 2, Jln Perdana, Perdana 2, 63000 Cyberjaya, Selangor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} E-tori. All rights reserved.2025
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
