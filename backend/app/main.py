"""FastAPI application entrypoint."""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import init_db, get_db
from app import crud
from app.models.database import Competitor, MonitoredURL
from app.schemas.models import (
    CompetitorCreate,
    CompetitorRead,
    CompetitorWithLatest,
    MonitoredURLCreate,
    MonitoredURLRead,
    ScrapeTriggerResponse,
    ScrapeResult,
    DiffLogRead,
    DiffAnalysis,
)

app = FastAPI(
    title=settings.app_name,
    docs_url="/docs",
    openapi_url=f"{settings.api_v1_str}/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    """Initialize database tables on startup."""
    try:
        from app.core.database import init_db

        await init_db()
    except Exception as exc:  # pragma: no cover - startup resilience
        # Log but don't crash; individual endpoints will return clear errors
        print(f"Warning: DB initialization failed on startup: {exc}")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.app_name, "env": settings.app_env}


# ---------------------------------------------------------------------------
# Competitors
# ---------------------------------------------------------------------------
@app.post(
    f"{settings.api_v1_str}/competitors",
    response_model=CompetitorRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Competitors"],
)
async def create_competitor_endpoint(
    payload: CompetitorCreate,
    db: AsyncSession = Depends(get_db),
) -> CompetitorRead:
    competitor = await crud.create_competitor(
        db, name=payload.name, website_url=str(payload.website_url) if payload.website_url else None
    )
    for mu in payload.monitored_urls:
        await crud.add_monitored_url(
            db,
            competitor_id=competitor.id,
            url=str(mu.url),
            page_type=mu.page_type,
        )
    await db.commit()
    await db.refresh(competitor)
    # reload with relationships
    result = await crud.get_competitor_by_id(db, competitor.id)
    return result  # type: ignore[return-value]


@app.get(
    f"{settings.api_v1_str}/competitors",
    response_model=List[CompetitorRead],
    tags=["Competitors"],
)
async def list_competitors_endpoint(
    db: AsyncSession = Depends(get_db),
) -> List[CompetitorRead]:
    competitors = await crud.get_competitors(db)
    return competitors  # type: ignore[return-value]


@app.get(
    f"{settings.api_v1_str}/competitors/{{competitor_id}}",
    response_model=CompetitorRead,
    tags=["Competitors"],
)
async def get_competitor_endpoint(
    competitor_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> CompetitorRead:
    competitor = await crud.get_competitor_by_id(db, competitor_id)
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return competitor  # type: ignore[return-value]


@app.post(
    f"{settings.api_v1_str}/competitors/{{competitor_id}}/urls",
    response_model=MonitoredURLRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Competitors"],
)
async def add_url_endpoint(
    competitor_id: UUID,
    payload: MonitoredURLCreate,
    db: AsyncSession = Depends(get_db),
) -> MonitoredURLRead:
    competitor = await crud.get_competitor_by_id(db, competitor_id)
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    mon_url = await crud.add_monitored_url(
        db, competitor_id=competitor_id, url=str(payload.url), page_type=payload.page_type
    )
    await db.commit()
    await db.refresh(mon_url)
    return mon_url  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Scrape / Diff trigger
# ---------------------------------------------------------------------------
@app.post(
    f"{settings.api_v1_str}/scrape/trigger",
    response_model=ScrapeTriggerResponse,
    tags=["Scrape"],
)
async def scrape_trigger_endpoint(
    all_urls: bool = False,
    url_id: Optional[UUID] = None,
    competitor_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
) -> ScrapeTriggerResponse:
    from app.services.scraper import scrape_url
    from app.services.gemini import analyze_diff
    from app.core.database import AsyncSessionLocal

    urls_to_scan: List[MonitoredURL] = []

    if all_urls:
        urls_to_scan = await crud.get_all_monitored_urls(db)
    elif url_id:
        mu = await crud.get_monitored_url(db, url_id)
        if not mu:
            raise HTTPException(status_code=404, detail="Monitored URL not found")
        urls_to_scan = [mu]
    elif competitor_id:
        comp = await crud.get_competitor_by_id(db, competitor_id)
        if not comp:
            raise HTTPException(status_code=404, detail="Competitor not found")
        urls_to_scan = list(comp.monitored_urls)
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide url_id, competitor_id, or all_urls=true",
        )

    results: List[ScrapeResult] = []
    changed_count = 0

    for mu in urls_to_scan:
        result = await scrape_and_diff(db, mu)
        results.append(result)
        if result.changed:
            changed_count += 1

    await db.commit()

    return ScrapeTriggerResponse(results=results, scanned=len(results), changed=changed_count)


async def scrape_and_diff(db: AsyncSession, mu: MonitoredURL) -> ScrapeResult:
    """Scrape a URL, compare hash, run Gemini diff if changed, persist."""
    from app.services.scraper import scrape_url, compute_hash

    # 1. Scrape + clean
    try:
        markdown = await scrape_url(mu.url)
    except Exception as exc:
        # Scraping failed — record the attempt but don't crash
        mu.last_scraped_at = datetime.now(timezone.utc)
        await db.flush()
        return ScrapeResult(
            url_id=mu.id,
            url=mu.url,
            changed=False,
            hash="",
            message=f"Scrape failed: {exc}",
        )

    cleaned = markdown  # scraper already cleans
    content_hash = compute_hash(cleaned)

    # 2. Compare with latest snapshot
    latest = await crud.get_latest_snapshot(db, mu.id)

    if latest and latest.content_hash == content_hash:
        # No change — save tokens, just update last_scraped_at
        mu.last_scraped_at = datetime.now(timezone.utc)
        await crud.create_snapshot(
            db, url_id=mu.id, content_hash=content_hash, markdown_content=cleaned
        )
        await db.flush()
        return ScrapeResult(
            url_id=mu.id,
            url=mu.url,
            changed=False,
            hash=content_hash,
            message="No change detected",
        )

    # 3. Changed (or first run) -> run Gemini diff against previous snapshot
    previous = await crud.get_previous_snapshot(db, mu.id, exclude_id=latest.id if latest else None)
    diff_analysis: Optional[DiffAnalysis] = None

    if previous:
        diff_analysis = await analyze_diff(
            old_text=previous.markdown_content,
            new_text=cleaned,
            page_type=mu.page_type,
            competitor_name=mu.competitor.name if mu.competitor else "Unknown",
        )
    else:
        # First snapshot ever — record as baseline change
        diff_analysis = DiffAnalysis(
            has_change=True,
            headline=f"Initial snapshot captured for {mu.competitor.name if mu.competitor else 'competitor'}",
            summary_bullets=["Baseline content captured for future diffing."],
            category=mu.page_type.capitalize(),
        )

    # 4. Persist new snapshot + diff log
    await crud.create_snapshot(
        db, url_id=mu.id, content_hash=content_hash, markdown_content=cleaned
    )
    await crud.create_diff_log(
        db,
        url_id=mu.id,
        has_change=diff_analysis.has_change,
        headline=diff_analysis.headline,
        bullets=diff_analysis.summary_bullets,
        category=diff_analysis.category,
    )
    mu.last_scraped_at = datetime.now(timezone.utc)
    await db.flush()

    return ScrapeResult(
        url_id=mu.id,
        url=mu.url,
        changed=diff_analysis.has_change,
        hash=content_hash,
        diff=diff_analysis,
        message="Change detected" if diff_analysis.has_change else "No change",
    )


# ---------------------------------------------------------------------------
# Diffs
# ---------------------------------------------------------------------------
@app.get(
    f"{settings.api_v1_str}/diffs",
    response_model=List[DiffLogRead],
    tags=["Diffs"],
)
async def list_diffs_endpoint(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
) -> List[DiffLogRead]:
    diffs = await crud.get_recent_diffs(db, limit=limit)
    return diffs  # type: ignore[return-value]


@app.get(
    f"{settings.api_v1_str}/diffs/url/{{url_id}}",
    response_model=List[DiffLogRead],
    tags=["Diffs"],
)
async def list_diffs_for_url_endpoint(
    url_id: UUID,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
) -> List[DiffLogRead]:
    diffs = await crud.get_diffs_for_url(db, url_id=url_id, limit=limit)
    return diffs  # type: ignore[return-value]
