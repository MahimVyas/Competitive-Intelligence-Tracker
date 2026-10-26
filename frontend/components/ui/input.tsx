"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ className, label, type = "text", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "w-full bg-base/50 border border-white/10 rounded-card px-4 py-3 text-body placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all",
          className
        )}
        {...props}
      />
    </div>
  );
}
