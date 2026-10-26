"""Daily background scan loop (optional standalone worker).

Can be run as:  python -m app.worker.scheduler
Or triggered by GitHub Actions via POST /api/scrape/trigger?all_urls=true
"""

import asyncio
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app import crud
from app.services.scraper import scrape_url, compute_hash
from app.services.gemini import analyze_diff
from app.services.notifications import send_digest_email
from app.core.config import settings
from app.models.database import MonitoredURL, Snapshot, DiffLog
from app.schemas.models import DiffLogRead
from loguru import logger


async def run_daily_scan() -> None:
    """Scan every monitored URL, diff against previous snapshot, persist results."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(MonitoredURL)
            .options(selectinload(MonitoredURL.competitor))
        )
        urls = result.scalars().all()

    logger.info(f"Daily scan starting for {len(urls)} monitored URL(s)")

    changed_diffs = []
    for mu in urls:
        try:
            markdown = await scrape_url(mu.url)
            content_hash = compute_hash(markdown)

            async with AsyncSessionLocal() as db:
                latest_result = await db.execute(
                    select(Snapshot)
                    .where(Snapshot.url_id == mu.id)
                    .order_by(Snapshot.created_at.desc())
                    .limit(1)
                )
                latest = latest_result.scalars().first()

                if latest and latest.content_hash == content_hash:
                    logger.info(f"No change: {mu.url}")
                    continue

                previous_result = await db.execute(
                    select(Snapshot)
                    .where(Snapshot.url_id == mu.id)
                    .where(Snapshot.id != (latest.id if latest else None))
                    .order_by(Snapshot.created_at.desc())
                    .limit(1)
                )
                previous = previous_result.scalars().first()

                if previous:
                    diff_analysis = await analyze_diff(
                        old_text=previous.markdown_content,
                        new_text=markdown,
                        page_type=mu.page_type,
                        competitor_name=mu.competitor.name if mu.competitor else "Unknown",
                    )
                else:
                    diff_analysis = type(
                        "DA",
                        (),
                        {
                            "has_change": True,
                            "headline": f"Initial snapshot for {mu.competitor.name if mu.competitor else 'competitor'}",
                            "summary_bullets": ["Baseline captured."],
                            "category": mu.page_type.capitalize(),
                        },
                    )()

                db.add(
                    Snapshot(
                        url_id=mu.id,
                        content_hash=content_hash,
                        markdown_content=markdown,
                    )
                )
                db.add(
                    DiffLog(
                        url_id=mu.id,
                        has_change=diff_analysis.has_change,
                        headline=diff_analysis.headline,
                        bullets=diff_analysis.summary_bullets,
                        category=diff_analysis.category,
                    )
                )
                await db.commit()

                if diff_analysis.has_change:
                    changed_diffs.append(
                        {
                            "created_at": datetime.now(timezone.utc),
                            "url": mu,
                            "headline": diff_analysis.headline,
                            "bullets": diff_analysis.summary_bullets,
                            "category": diff_analysis.category,
                        }
                    )
        except Exception as exc:
            logger.error(f"Scan failed for {mu.url}: {exc}")

    # Send digest
    if changed_diffs:
        email_diffs = []
        for cd in changed_diffs:
            email_diffs.append(
                DiffLogRead(
                    id=UUID(int=0),
                    url_id=cd["url"].id,
                    has_change=True,
                    headline=cd["headline"],
                    bullets=cd["bullets"],
                    category=cd["category"],
                    created_at=cd["created_at"],
                )
            )
        await send_digest_email(email_diffs)

    logger.info(f"Daily scan complete. {len(changed_diffs)} change(s) detected.")


if __name__ == "__main__":
    asyncio.run(run_daily_scan())
