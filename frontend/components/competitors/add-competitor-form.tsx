"use client";

import { useState } from "react";
import { Plus, Link2, TextCursorInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createCompetitor, type NewCompetitor } from "@/lib/api";

export function AddCompetitorForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [urls, setUrls] = useState<{ url: string; page_type: string }[]>([{ url: "", page_type: "changelog" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addUrlRow = () => {
    setUrls([...urls, { url: "", page_type: "changelog" }]);
  };

  const removeUrlRow = (idx: number) => {
    if (urls.length > 1) setUrls(urls.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: NewCompetitor = {
        name,
        website_url: website || undefined,
        monitored_urls: urls.filter((u) => u.url.trim()).map((u) => ({ url: u.url, page_type: u.page_type })),
      };
      await createCompetitor(payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to add competitor");
    } finally {
      setLoading(false);
    }
  };

  const PAGE_TYPES = [
    { label: "Changelog", value: "changelog" },
    { label: "Pricing", value: "pricing" },
    { label: "Features", value: "features" },
  ];

  return (
    <Card className="max-w-2xl">
      <CardHeader title="Add Competitor" description="Enter the competitor's name, site, and URLs to monitor." />
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Competitor Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" />
            <Input label="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://acme.com" />
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase">Monitored URLs</span>
              <button type="button" onClick={addUrlRow} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300">
                <Plus className="w-3 h-3" /> Add URL
              </button>
            </div>
            <div className="space-y-3">
              {urls.map((u, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <Input
                    label={`URL ${idx + 1}`}
                    value={u.url}
                    onChange={(e) => {
                      const next = [...urls];
                      next[idx] = { ...next[idx], url: e.target.value };
                      setUrls(next);
                    }}
                    placeholder="https://acme.com/pricing"
                  />
                  <select
                    value={u.page_type}
                    onChange={(e) => {
                      const next = [...urls];
                      next[idx] = { ...next[idx], page_type: e.target.value };
                      setUrls(next);
                    }}
                    className="w-full bg-base/50 border border-white/10 rounded-card px-4 py-3 text-body focus:border-violet-500"
                  >
                    {PAGE_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                  {urls.length > 1 && (
                    <button type="button" onClick={() => removeUrlRow(idx)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-card">
                      <TextCursorInput className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-card border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" variant="default" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Link2 className="w-4 h-4 animate-spin mr-2" /> Adding…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" /> Create Competitor
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
