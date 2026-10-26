"""CRUD operations for Competitive Intelligence Tracker."""

from typing import List, Optional, Sequence
from uuid import UUID
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database import (
    Competitor,
    MonitoredURL,
    Snapshot,
    DiffLog,
)


# ---------------------------------------------------------------------------
# Competitor
# ---------------------------------------------------------------------------
async def create_competitor(
    session: AsyncSession, *, name: str, website_url: Optional[str] = None
) -> Competitor:
    competitor = Competitor(name=name, website_url=website_url)
    session.add(competitor)
    await session.flush()
    await session.refresh(competitor)
    return competitor


async def add_monitored_url(
    session: AsyncSession,
    *,
    competitor_id: UUID,
    url: str,
    page_type: str = "changelog",
) -> MonitoredURL:
    mon_url = MonitoredURL(
        competitor_id=competitor_id,
        url=url,
        page_type=page_type,
    )
    session.add(mon_url)
    await session.flush()
    await session.refresh(mon_url)
    return mon_url


async def get_competitors(session: AsyncSession) -> Sequence[Competitor]:
    result = await session.execute(
        select(Competitor)
        .options(selectinload(Competitor.monitored_urls))
        .order_by(Competitor.created_at.desc())
    )
    return result.scalars().all()


async def get_competitor_by_id(
    session: AsyncSession, competitor_id: UUID
) -> Optional[Competitor]:
    result = await session.execute(
        select(Competitor)
        .options(selectinload(Competitor.monitored_urls))
        .where(Competitor.id == competitor_id)
    )
    return result.scalars().first()


async def get_monitored_url(session: AsyncSession, url_id: UUID) -> Optional[MonitoredURL]:
    result = await session.execute(
        select(MonitoredURL)
        .options(selectinload(MonitoredURL.competitor))
        .where(MonitoredURL.id == url_id)
    )
    return result.scalars().first()


async def get_all_monitored_urls(session: AsyncSession) -> Sequence[MonitoredURL]:
    result = await session.execute(
        select(MonitoredURL)
        .options(selectinload(MonitoredURL.competitor))
        .order_by(MonitoredURL.id.asc())
    )
    return result.scalars().all()


# ---------------------------------------------------------------------------
# Snapshot
# ---------------------------------------------------------------------------
async def create_snapshot(
    session: AsyncSession,
    *,
    url_id: UUID,
    content_hash: str,
    markdown_content: str,
) -> Snapshot:
    snapshot = Snapshot(
        url_id=url_id,
        content_hash=content_hash,
        markdown_content=markdown_content,
    )
    session.add(snapshot)
    await session.flush()
    await session.refresh(snapshot)
    return snapshot


async def get_latest_snapshot(
    session: AsyncSession, url_id: UUID
) -> Optional[Snapshot]:
    result = await session.execute(
        select(Snapshot)
        .where(Snapshot.url_id == url_id)
        .order_by(Snapshot.created_at.desc())
        .limit(1)
    )
    return result.scalars().first()


async def get_previous_snapshot(
    session: AsyncSession, url_id: UUID, exclude_id: UUID
) -> Optional[Snapshot]:
    """Return the snapshot immediately before exclude_id (for diffing)."""
    result = await session.execute(
        select(Snapshot)
        .where(Snapshot.url_id == url_id)
        .where(Snapshot.id != exclude_id)
        .order_by(Snapshot.created_at.desc())
        .limit(1)
    )
    return result.scalars().first()


async def get_snapshots_for_url(
    session: AsyncSession, url_id: UUID, limit: int = 10
) -> Sequence[Snapshot]:
    result = await session.execute(
        select(Snapshot)
        .where(Snapshot.url_id == url_id)
        .order_by(Snapshot.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


# ---------------------------------------------------------------------------
# DiffLog
# ---------------------------------------------------------------------------
async def create_diff_log(
    session: AsyncSession,
    *,
    url_id: UUID,
    has_change: bool,
    headline: Optional[str] = None,
    bullets: Optional[List[str]] = None,
    category: Optional[str] = None,
) -> DiffLog:
    diff_log = DiffLog(
        url_id=url_id,
        has_change=has_change,
        headline=headline,
        bullets=bullets,
        category=category,
    )
    session.add(diff_log)
    await session.flush()
    await session.refresh(diff_log)
    return diff_log


async def get_recent_diffs(
    session: AsyncSession, limit: int = 50
) -> Sequence[DiffLog]:
    result = await session.execute(
        select(DiffLog)
        .options(selectinload(DiffLog.url).selectinload(MonitoredURL.competitor))
        .order_by(DiffLog.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def get_diffs_for_url(
    session: AsyncSession, url_id: UUID, limit: int = 20
) -> Sequence[DiffLog]:
    result = await session.execute(
        select(DiffLog)
        .where(DiffLog.url_id == url_id)
        .order_by(DiffLog.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
