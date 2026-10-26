"use client";

import Link from "next/link";
import { Menu, RefreshCw, Bell, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-base/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-card bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white shadow-glow-violet">
            CI
          </div>
          <span className="font-semibold text-body tracking-tight">Competitive Intel</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <RefreshCw className="w-4 h-4 mr-2" /> Scan Now
          </Button>
          <Button variant="ghost" size="sm" className="flex md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          <button className="w-8 h-8 rounded-card bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
