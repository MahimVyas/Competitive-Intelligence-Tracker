"use client";

import { Activity, Monitor, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: string;
  Icon: React.ElementType;
  variant?: "default" | "success" | "alert";
}

export function StatCard({ title, value, delta, Icon: IconComp, variant = "default" }: StatCardProps) {
  const color =
    variant === "success"
      ? "text-emerald-400 bg-emerald-500/10"
      : variant === "alert"
      ? "text-red-400 bg-red-500/10"
      : "text-violet-400 bg-violet-500/10";

  return (
    <Card className="interactive">
      <CardHeader
        title={title}
        description={delta}
        className="flex flex-row items-center justify-between mb-0"
      >
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
          <IconComp className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-body tracking-tight">{value}</div>
        {delta && (
          <p className="text-xs text-slate-500 mt-1">{delta}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCards({ competitors, diffs }: { competitors: number; diffs: any[] }) {
  const changed = diffs.filter((d) => d.has_change).length;
  const unchanged = diffs.length - changed;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Competitors Tracked"
        value={competitors}
        Icon={Monitor}
        variant="default"
      />
      <StatCard
        title="Total Snapshots"
        value={diffs.length}
        delta={relativeTime(diffs[0]?.created_at || null)}
        Icon={Activity}
        variant="default"
      />
      <StatCard
        title="Changes Detected"
        value={changed}
        delta={`${unchanged} unchanged`}
        Icon={changed > 0 ? AlertCircle : CheckCircle2}
        variant={changed > 0 ? "alert" : "success"}
      />
      <StatCard
        title="Last Scan"
        value="—"
        delta="GitHub Actions • Daily"
        Icon={CheckCircle2}
        variant="default"
      />
    </div>
  );
}
