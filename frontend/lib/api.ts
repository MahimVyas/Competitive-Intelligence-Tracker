// API client for the Competitive Intelligence Tracker frontend.
// Calls the FastAPI backend through Next.js API rewrites (/api -> backend /api/v1).

const BASE = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_API_URL || "";

async function request(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input as string, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      detail = res.statusText;
    }
    throw new Error(`API error ${res.status}: ${detail}`);
  }
  if (res.status === 204) return res as unknown as Response;
  return res;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function getJSON<T>(path: string): Promise<T> {
  try {
    const res = await request(`${BASE}${path}`);
    return (await res.json()) as T;
  } catch (err: any) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new ApiError(
        "Backend is not reachable. Make sure the FastAPI server is running on http://localhost:8000",
        0
      );
    }
    throw err;
  }
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  try {
    const res = await request(`${BASE}${path}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return (await res.json()) as T;
  } catch (err: any) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new ApiError(
        "Backend is not reachable. Make sure the FastAPI server is running on http://localhost:8000",
        0
      );
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export interface Competitor {
  id: string;
  name: string;
  website_url: string | null;
  created_at: string;
  monitored_urls: MonitoredURL[];
}

export interface MonitoredURL {
  id: string;
  competitor_id: string;
  url: string;
  page_type: string;
  last_scraped_at: string | null;
}

export interface DiffLog {
  id: string;
  url_id: string;
  has_change: boolean;
  headline: string | null;
  bullets: string[] | null;
  category: string | null;
  created_at: string;
  competitor?: { name: string };
  url?: string;
}

export interface ScrapeResult {
  url_id: string;
  url: string;
  changed: boolean;
  hash: string;
  diff: any;
  message: string;
}

export interface ScrapeTriggerResponse {
  results: ScrapeResult[];
  scanned: number;
  changed: number;
}

export interface NewCompetitor {
  name: string;
  website_url?: string | null;
  monitored_urls: Array<{ url: string; page_type?: string }>;
}

export async function listCompetitors(): Promise<Competitor[]> {
  return getJSON<Competitor[]>("/api/competitors");
}

export async function getCompetitor(id: string): Promise<Competitor> {
  return getJSON<Competitor>(`/api/competitors/${id}`);
}

export async function createCompetitor(payload: NewCompetitor): Promise<Competitor> {
  return postJSON<Competitor>("/api/competitors", payload);
}

export async function addMonitoredUrl(
  competitorId: string,
  url: string,
  page_type: string = "changelog"
): Promise<MonitoredURL> {
  return postJSON<MonitoredURL>(
    `/api/competitors/${competitorId}/urls`,
    { url, page_type }
  );
}

export async function listDiffs(limit = 50): Promise<DiffLog[]> {
  return getJSON<DiffLog[]>(`/api/diffs?limit=${limit}`);
}

export async function triggerScrape({
  all_urls = false,
  url_id,
  competitor_id,
}: {
  all_urls?: boolean;
  url_id?: string;
  competitor_id?: string;
}): Promise<ScrapeTriggerResponse> {
  return postJSON<ScrapeTriggerResponse>("/api/scrape/trigger", {
    all_urls,
    url_id,
    competitor_id,
  });
}
