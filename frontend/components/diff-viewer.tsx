"use client";

import { Activity, Code2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { DiffLog } from "@/lib/api";

export function DiffViewer({ diff }: { diff: DiffLog }) {
  return (
    <Card className="max-w-4xl">
      <CardHeader
        title={diff.headline || "Change detected"}
        description={`${diff.category || "General"} • ${formatDate(diff.created_at)}`}
        className="flex flex-row items-center justify-between mb-0"
      >
        <div className="flex items-center gap-2">
          <Badge variant={diff.has_change ? "alert" : "ok"} className="px-2 py-1 text-xs">
            {diff.has_change ? "Changed" : "No change"}
          </Badge>
          <Badge variant="neutral" className={cn(categoryColor(diff.category), "px-2 py-1 text-xs")}>
            {diff.category || "General"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {diff.bullets && diff.bullets.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key changes</h3>
            <ul className="space-y-2">
              {diff.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                  <span className="font-mono text-xs text-slate-200">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto text-slate-700 mb-2" />
            <p>No detailed change summary available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function categoryColor(category: string | null): string {
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
      return "text-slate-400 bg-white/5 border-white/10";
  }
}

export function DiffsList({ diffs }: { diffs: DiffLog[] }) {
  return (
    <div className="space-y-3">
      {diffs.map((d) => (
        <Card key={d.id} className="interactive" onClick={() => {}}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-sm font-medium text-body">{d.headline || "Untitled change"}</div>
                  <div className="text-xs text-slate-500">{formatDate(d.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={d.has_change ? "alert" : "ok"} className="px-2 py-1 text-xs">
                  {d.has_change ? "Changed" : "No change"}
                </Badge>
                <Badge variant="neutral" className={cn(categoryColor(d.category), "px-2 py-1 text-xs")}>
                  {d.category || "General"}
                </Badge>
              </div>
            </div>
            {d.bullets && d.bullets.length > 0 && (
              <div className="mt-3 text-xs text-slate-400 font-mono line-clamp-2">
                {d.bullets.join(" • ")}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
