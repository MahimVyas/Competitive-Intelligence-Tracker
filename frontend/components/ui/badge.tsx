"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "ok" | "warn" | "alert" | "neutral";
}

const variants: Record<string, string> = {
  ok: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  warn: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  alert: "bg-red-500/10 border-red-500/20 text-red-400",
  neutral: "bg-white/5 border-white/10 text-slate-400",
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
