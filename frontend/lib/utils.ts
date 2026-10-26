import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNowStrict, format } from "date-fns";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy • HH:mm");
  } catch {
    return iso;
  }
}

export function categoryColor(category: string | null): string {
  switch (category?.toLowerCase()) {
    case "pricing":
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "product":
      return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
    case "changelog":
      return "text-violet-400 bg-violet-500/10 border-violet-500/20";
    case "positioning":
      return "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20";
    default:
      return "text-slate-400 bg-slate-800/50 border-slate-700/50";
  }
}
