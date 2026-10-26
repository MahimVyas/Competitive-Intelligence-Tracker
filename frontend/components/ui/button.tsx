"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "danger" | "outline";
  size?: "default" | "sm";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const base = "inline-flex items-center justify-center rounded-card font-medium text-center transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-base";
    const variants = {
      default: "bg-violet-600 text-white hover:bg-violet-500 hover:shadow-glow-violet",
      ghost: "bg-white/5 border border-white/10 text-body hover:bg-white/10 hover:border-white/20",
      danger: "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300",
      outline: "bg-transparent border border-white/10 text-body hover:bg-white/5",
    };
    const sizes = {
      default: "h-11 px-4 py-3",
      sm: "h-9 px-3 py-1.5 text-sm",
    };
    return (
      <Comp
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
