"""Pydantic schemas for request/response validation and Gemini structured output."""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field


# ---------------------------------------------------------------------------
# Competitor schemas
# ---------------------------------------------------------------------------
class MonitoredURLBase(BaseModel):
    url: HttpUrl
    page_type: str = Field(default="changelog", pattern="^(pricing|changelog|features)$")


class MonitoredURLCreate(MonitoredURLBase):
    pass


class MonitoredURLRead(MonitoredURLBase):
    id: UUID
    competitor_id: UUID
    last_scraped_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompetitorBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    website_url: Optional[HttpUrl] = None


class CompetitorCreate(CompetitorBase):
    monitored_urls: List[MonitoredURLCreate] = Field(default_factory=list)


class CompetitorRead(CompetitorBase):
    id: UUID
    created_at: datetime
    monitored_urls: List[MonitoredURLRead] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CompetitorWithLatest(CompetitorRead):
    """Competitor enriched with latest snapshot & diff per monitored URL."""
    latest_diffs: List[dict] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Snapshot / Diff schemas
# ---------------------------------------------------------------------------
class SnapshotRead(BaseModel):
    id: UUID
    url_id: UUID
    content_hash: str
    created_at: datetime

    class Config:
        from_attributes = True


class DiffLogBase(BaseModel):
    has_change: bool
    headline: Optional[str] = None
    bullets: Optional[List[str]] = None
    category: Optional[str] = None


class DiffLogRead(DiffLogBase):
    id: UUID
    url_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Gemini structured diff output
# ---------------------------------------------------------------------------
class DiffAnalysis(BaseModel):
    has_change: bool
    headline: str
    summary_bullets: List[str] = Field(default_factory=list)
    category: str = Field(default="General")


# ---------------------------------------------------------------------------
# Scrape trigger / response schemas
# ---------------------------------------------------------------------------
class ScrapeTrigger(BaseModel):
    url_id: Optional[UUID] = None
    competitor_id: Optional[UUID] = None
    all_urls: bool = False


class ScrapeResult(BaseModel):
    url_id: UUID
    url: str
    changed: bool
    hash: str
    diff: Optional[DiffAnalysis] = None
    message: str


class ScrapeTriggerResponse(BaseModel):
    results: List[ScrapeResult]
    scanned: int
    changed: int
