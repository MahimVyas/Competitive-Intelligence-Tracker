"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, glow = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative bg-card border border-white/10 backdrop-blur-md rounded-card p-6 transition-all duration-300",
          interactive
            ? "cursor-pointer hover:bg-white/5 hover:border-white/20 group"
            : "",
          glow ? "shadow-glow-violet border-violet-500/40" : "",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, description, className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props}>
      {title && <h3 className="text-sm font-semibold text-body tracking-tight">{title}</h3>}
      {description && <p className="text-xs text-muted">{description}</p>}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ actions, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3", className)}
      {...props}
    >
      {actions}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardContent, CardFooter };
