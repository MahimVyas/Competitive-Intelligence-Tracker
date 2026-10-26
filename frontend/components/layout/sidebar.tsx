"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Activity, Database, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/competitors", label: "Competitors", icon: Database },
  { href: "/diffs", label: "Change Log", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-white/5 bg-base/50 backdrop-blur-md flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Navigator</span>
      </div>
      <nav className="flex-1 py-6 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-violet-500/10 text-violet-400 border-r-2 border-violet-500"
                  : "text-slate-400 hover:bg-white/5 hover:text-body"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", active ? "text-violet-400" : "text-slate-500")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-white/5">
        <Link href="/competitors" className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-violet-400 bg-violet-500/5 rounded-card border border-violet-500/20 hover:bg-violet-500/10 transition-colors">
          <PlusIcon className="w-4 h-4" /> Add Competitor
        </Link>
      </div>
    </aside>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
