"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AddCompetitorForm } from "@/components/competitors/add-competitor-form";
import { CompetitorList } from "@/components/competitors/competitor-list";
import { listCompetitors, type Competitor, ApiError } from "@/lib/api";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listCompetitors();
        if (!cancelled) {
          setCompetitors(data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : err.message || "Failed to load competitors");
          console.error("Failed to load competitors", err);
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
          <p className="text-slate-500 text-sm">Loading competitors…</p>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-body tracking-tight">Competitors</h1>
                <p className="text-slate-400 text-sm">
                  Manage tracked competitors and the pages you monitor for changes.
                </p>
              </div>
            </div>

            <AddCompetitorForm onSuccess={() => {}} />
            <div className="mt-8">
              <CompetitorList />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
