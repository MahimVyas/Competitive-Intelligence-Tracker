"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, categoryColor } from "@/lib/utils";
import { DiffLog } from "@/lib/api";

export function RecentDiffs({ diffs }: { diffs: DiffLog[] }) {
  return (
    <Card>
      <CardHeader title="Recent Changes" description="Latest diff detections across all tracked competitors." />
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-xs text-slate-500 uppercase tracking-wider pb-3">Time</th>
                <th className="text-xs text-slate-500 uppercase tracking-wider pb-3">Competitor</th>
                <th className="text-xs text-slate-500 uppercase tracking-wider pb-3">URL</th>
                <th className="text-xs text-slate-500 uppercase tracking-wider pb-3">Category</th>
                <th className="text-xs text-slate-500 uppercase tracking-wider pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {diffs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-slate-500">
                    No diffs yet. Run a scan to detect changes.
                  </td>
                </tr>
              ) : (
                diffs.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 text-xs text-slate-400 font-mono">{formatDate(d.created_at)}</td>
                    <td className="py-4 text-sm text-body">
                      {d.competitor?.name || "Unknown"}
                    </td>
                    <td className="py-4 text-xs text-slate-400 truncate max-w-xs" title={d.url || ""}>
                      {d.url || "—"}
                    </td>
                    <td className="py-4">
                      <Badge
                        variant={d.category === "Pricing" ? "warn" : "neutral"}
                        className={categoryColor(d.category)}
                      >
                        {d.category || "General"}
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      <Badge
                        variant={d.has_change ? "alert" : "ok"}
                        className={cnBadge(d.has_change ? "alert" : "ok")}
                      >
                        {d.has_change ? "Changed" : "No change"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {diffs.length > 0 && (
          <div className="mt-4 flex justify-end">
            <a href="/diffs" className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-4">
              View all changes →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function cnBadge(variant: "ok" | "alert" | "neutral") {
  const map = {
    ok: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    alert: "text-red-400 bg-red-500/10 border-red-500/20",
    neutral: "text-slate-400 bg-white/5 border-white/10",
  };
  return map[variant];
}
