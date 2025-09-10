"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith("/auth")

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </SidebarProvider>
  )
}
