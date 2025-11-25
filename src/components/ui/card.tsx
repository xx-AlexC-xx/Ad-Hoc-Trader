import * as React from "react"
import { cn } from "@/lib/utils"

// Base Card wrapper
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-border/40 bg-background shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

// Header — compact variant always applied now, reduced spacing
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // compact unified header: small padding for minimal dead space
      "flex flex-col space-y-0.5 p-2 py-1",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// Title — all cards now compact variant, increased font size by 2 points
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      // increased from text-xs → text-sm
      "text-sm font-semibold leading-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

// Description — unchanged (rarely used)
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

// Content — compact variant always applied, larger font for data, minimal padding
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // previously text-sm → now text-base (2 steps up)
      "p-2 pt-0 text-base font-medium leading-snug",
      className
    )}
    {...props}
  />
))
CardContent.displayName = "CardContent"

// Footer — compact variant padding
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-2 pt-0",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
