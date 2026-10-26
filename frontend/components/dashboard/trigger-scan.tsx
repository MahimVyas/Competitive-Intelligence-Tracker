"use client";

import { useState } from "react";
import { RefreshCw, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { triggerScrape, type ScrapeTriggerResponse } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export function TriggerScan() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeTriggerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await triggerScrape({ all_urls: true });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <Card>
        <CardHeader
          title="Trigger Manual Scan"
          description="Run a diff check across all monitored URLs right now."
        />
        <CardContent>
          <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 items-end">
            <Button type="submit" variant="default" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Zap className="w-4 h-4 animate-spin mr-2" />
                  Scanning…
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan All URLs
                </>
              )}
            </Button>
            {error && (
              <div className="ml-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-card px-3 py-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glow-active">
      <CardHeader title="Scan Complete" description={result.changed > 0 ? "Changes detected!" : "No changes found."} />
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-white/5 rounded-card border border-white/10">
            <div className="text-xs text-slate-400 uppercase">Scanned</div>
            <div className="text-lg font-mono text-body">{result.scanned}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-card border border-white/10">
            <div className="text-xs text-slate-400 uppercase">Changed</div>
            <div className={`text-lg font-mono ${result.changed > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {result.changed}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {result.results.map((r) => (
            <div key={r.url_id} className="flex items-center justify-between p-3 bg-base/30 rounded-card border border-white/5 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-500">{r.hash.slice(0, 12)}…</span>
                <span className="text-body truncate max-w-xs">{r.url}</span>
              </div>
              <span className={cnStatus(r.changed)}>{r.message}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-slate-500">
          Last run: {formatDate(new Date().toISOString())}
        </div>
      </CardContent>
    </Card>
  );
}

function cnStatus(changed: boolean) {
  return changed
    ? "px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"
    : "px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
}
