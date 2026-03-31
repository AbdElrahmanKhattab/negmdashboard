import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = (variant, size, className) => {
  const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-bg-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  
  const variants = {
    default: "bg-text-primary text-bg-base hover:bg-text-primary/90",
    destructive: "bg-status-critical text-white hover:bg-status-critical/90",
    outline: "border border-border-default bg-bg-base hover:bg-bg-elevated hover:text-text-primary",
    secondary: "bg-bg-elevated text-text-primary hover:bg-bg-elevated/80",
    ghost: "hover:bg-bg-elevated hover:text-text-primary",
    link: "text-text-primary underline-offset-4 hover:underline",
  }
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  }

  return cn(baseClasses, variants[variant || "default"], sizes[size || "default"], className)
}

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? "span" : "button"
  return (
    <Comp
      className={buttonVariants(variant, size, className)}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
