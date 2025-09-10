import type React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ChevronRight } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import NotificationDropdown from "@/components/notification-dropdown"
import { Separator } from "@/components/ui/separator"
import { Footer } from "@/components/footer"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="h-9 w-9 p-0 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Toggle sidebar</span>
            </SidebarTrigger>
            <Separator orientation="vertical" className="h-4 mx-2" />
            <NotificationDropdown />
          </header>
          <div className="p-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Footer />
    </>
  )
}
