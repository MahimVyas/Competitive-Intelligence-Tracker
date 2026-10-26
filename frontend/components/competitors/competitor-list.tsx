"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, Globe, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, categoryColor } from "@/lib/utils";
import { listCompetitors, addMonitoredUrl, type Competitor } from "@/lib/api";

const PAGE_TYPE_LABELS: Record<string, string> = {
  changelog: "Changelog",
  pricing: "Pricing",
  features: "Features",
};

export function CompetitorList() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    listCompetitors()
      .then((data) => {
        setCompetitors(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-8 bg-white/5 rounded w-1/3 mb-3" />
        <div className="h-4 bg-white/5 rounded w-1/2" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader
        title="Competitors"
        description="Tracked competitors and their monitored pages."
      />
      <CardContent>
        <div className="overflow-x-auto border border-white/5 rounded-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-xs text-slate-500 uppercase tracking-wider pb-4 px-4">
                  Competitor
                </th>
                <th className="text-xs text-slate-500 uppercase tracking-wider pb-4 px-4">
                  Website
                </th>
                <th className="text-xs text-slate-500 uppercase tracking-wider pb-4 px-4">
                  Monitored Pages
                </th>
                <th className="text-xs text-slate-500 uppercase tracking-wider pb-4 px-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="text-sm font-medium text-body">{c.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatDate(c.created_at)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {c.website_url ? (
                      <a
                        href={c.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-400 hover:underline truncate max-w-xs"
                        title={c.website_url}
                      >
                        {c.website_url}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-2">
                      {c.monitored_urls.map((u) => (
                        <Badge
                          key={u.id}
                          variant="neutral"
                          className={categoryColor(u.page_type)}
                        >
                          {PAGE_TYPE_LABELS[u.page_type] || u.page_type}
                        </Badge>
                      ))}
                      {c.monitored_urls.length === 0 && (
                        <span className="text-xs text-slate-500">No URLs</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpanded((p) => ({
                          ...p,
                          [c.id]: !expanded[c.id],
                        }))
                      }
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {competitors.length === 0 && (
                <tr>
                  <td colSpan={4} className="h-32 text-center text-slate-500">
                    No competitors yet. Add your first competitor to start tracking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {competitors.some((c) => expanded[c.id]) && (
          <div className="mt-6 space-y-4">
            {competitors.map((c) => {
              if (!expanded[c.id]) return null;
              return (
                <CompetitorDetail
                  key={c.id}
                  competitor={c}
                  onRefresh={() => setCompetitors(competitors)}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </div>
  );
}

function CompetitorDetail({
  competitor,
  onRefresh,
}: {
  competitor: Competitor;
  onRefresh: () => void;
}) {
  const [newUrl, setNewUrl] = useState("");
  const [pageType, setPageType] = useState("changelog");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await addMonitoredUrl(competitor.id, newUrl, pageType);
      setNewUrl("");
      const updated = await fetch(`/api/competitors/${competitor.id}`).then(
        (r) => r.json()
      );
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to add URL");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-base/50 border border-white/10">
      <CardContent className="p-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-base/30">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-slate-500" />
            <div>
              <div className="font-medium text-body">
                Manage URLs for {competitor.name}
              </div>
              <div className="text-xs text-slate-500">
                Add or remove monitored pages
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <form
            onSubmit={addUrl}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          >
            <Input
              label="URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/pricing"
            />
            <select
              value={pageType}
              onChange={(e) => setPageType(e.target.value)}
              className="w-full bg-base/50 border border-white/10 rounded-card px-4 py-3 text-body focus:border-violet-500"
            >
              <option value="changelog">Changelog</option>
              <option value="pricing">Pricing</option>
              <option value="features">Features</option>
            </select>
            <Button type="submit" variant="default" disabled={isLoading}>
              {isLoading ? "Adding…" : "Add URL"}
            </Button>
          </form>
          {error && (
            <div className="mt-3 p-3 rounded-card border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="mt-4 space-y-2">
            {competitor.monitored_urls.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-card border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-slate-500" />
                  <span
                    className="text-sm text-slate-300 truncate max-w-md"
                    title={u.url}
                  >
                    {u.url}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {PAGE_TYPE_LABELS[u.page_type] || u.page_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
