import * as React from "react"
import Link from "next/link"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export function Breadcrumb({ className, children, ...props }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("w-full", className)} {...props}>
      {children}
    </nav>
  )
}

export function BreadcrumbList({ children }: { children?: React.ReactNode }) {
  return (
    <ol className="flex items-center gap-2 text-sm text-muted-foreground">{children}</ol>
  )
}

export interface BreadcrumbItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode
}

export function BreadcrumbItem({ children, ...props }: BreadcrumbItemProps) {
  return <li {...props}>{children}</li>
}

export interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string
  asChild?: boolean
}

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ href, children, asChild = false, className, ...props }, ref) => {
    const Comp: any = asChild ? Slot : Link
    if (!asChild) {
      // When not using `asChild`, render a Next.js Link
      return (
        <Link href={href || "#"} className={cn("hover:underline", className)} {...props}>
          {children}
        </Link>
      )
    }

    // As a child, allow users to pass in their own Link component or other wrappers
    return (
      <Comp className={cn("hover:underline", className)} ref={ref as any} {...props}>
        {children}
      </Comp>
    )
  }
)
BreadcrumbLink.displayName = "BreadcrumbLink"

export function BreadcrumbPage({ children }: { children?: React.ReactNode }) {
  return <span className="font-medium">{children}</span>
}

export function BreadcrumbSeparator({ children }: { children?: React.ReactNode }) {
  return <span className="text-muted-foreground">{children ?? "/"}</span>
}

export function BreadcrumbEllipsis() {
  return <span className="px-1">...</span>
}

export default Breadcrumb
