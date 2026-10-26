"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentDiffs } from "@/components/dashboard/recent-diffs";
import { TriggerScan } from "@/components/dashboard/trigger-scan";
import { listCompetitors, listDiffs, type Competitor, type DiffLog, ApiError } from "@/lib/api";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Dashboard() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [diffs, setDiffs] = useState<DiffLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [comps, diffLogs] = await Promise.all([listCompetitors(), listDiffs(20)]);
        if (!cancelled) {
          setCompetitors(comps);
          setDiffs(diffLogs);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : err.message || "Failed to load data");
          console.error("Failed to load dashboard data", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center pl-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading intelligence…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center pl-64">
        <Card className="max-w-md w-full">
          <CardHeader title="Backend Unreachable" className="flex flex-row items-center justify-between mb-0" />
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pl-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-body tracking-tight">Dashboard</h1>
                <p className="text-slate-400 text-sm">
                  Monitor competitor pricing, changelogs, and features with AI-powered diff detection.
                </p>
              </div>
              <TriggerScan />
            </div>

            <StatsCards competitors={competitors.length} diffs={diffs} />
            <RecentDiffs diffs={diffs} />
          </div>
        </main>
      </div>
    </div>
  );
}
