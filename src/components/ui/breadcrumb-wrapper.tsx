"use client"

import React from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

// Module name mappings
const moduleNames: Record<string, string> = {
  "attendance": "Attendance",
  "hr": "HR",
  "store": "Inventory",
  "inventory": "Inventory",
  "manager": "Management Console",
  "analytics": "Analytics",
  "login": "Login",
  "register": "Register",
  "auth": "Authentication",
  "invite": "Invitation",
  "reset-password": "Reset Password",
  "forgot-password": "Forgot Password",
}

function titleFromSegment(segment: string) {
  if (!segment) return ""
  
  // Check if we have a predefined name for this segment
  const lowerSegment = segment.toLowerCase()
  if (moduleNames[lowerSegment]) {
    return moduleNames[lowerSegment]
  }
  
  // Otherwise, decode and capitalize
  const dec = decodeURIComponent(segment)
  return dec.replace(/-/g, " ").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

export default function BreadcrumbWrapper() {
  const pathname = usePathname() || "/"

  // Hide on landing page
  if (pathname === "/") return null

  const segments = pathname.split("/").filter(Boolean)

  // Always start with Home and Dashboard
  const items = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
  ]

  // Add remaining segments
  segments.forEach((segment, i) => {
    // Skip if it's the first segment and it's "dashboard"
    if (i === 0 && segment.toLowerCase() === "dashboard") {
      return
    }
    
    items.push({
      name: titleFromSegment(segment),
      href: `/${segments.slice(0, i + 1).join("/")}`,
    })
  })

  return (
    <div className="px-4 md:px-6 lg:px-8 py-2">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, idx) => (
            <BreadcrumbItem key={`${item.href}-${idx}`}>
              {idx + 1 === items.length ? (
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.name}</BreadcrumbLink>
              )}
              {idx + 1 < items.length ? <BreadcrumbSeparator /> : null}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
