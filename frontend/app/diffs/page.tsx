"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { DiffsList } from "@/components/diff-viewer";
import { listDiffs, type DiffLog, ApiError } from "@/lib/api";
import { Activity } from "lucide-react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DiffsPage() {
  const [diffs, setDiffs] = useState<DiffLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listDiffs(100);
        if (!cancelled) {
          setDiffs(data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : err.message || "Failed to load changes");
          console.error("Failed to load diffs", err);
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
        <p className="text-slate-500 text-sm">Loading changes…</p>
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
              <Button onClick={() => window.location.reload()} variant="default" className="w-full">
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
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-body tracking-tight mb-2">Change Log</h1>
            <p className="text-slate-400 text-sm mb-8">
              All detected diffs across your tracked competitors.
            </p>
            <div className="space-y-3">
              {diffs.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto text-slate-700 mb-3 opacity-50" />
                  <p>No changes detected yet.</p>
                </div>
              ) : (
                <DiffsList diffs={diffs} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
