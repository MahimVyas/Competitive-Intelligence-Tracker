"""Notifications via Resend (HTML email digest)."""

from typing import List, Optional
from uuid import UUID

import httpx
from loguru import logger

from app.core.config import settings
from app.schemas.models import DiffLogRead


async def send_digest_email(
    diffs: List[DiffLogRead],
    recipients: Optional[List[str]] = None,
    subject: Optional[str] = None,
) -> bool:
    """Send an HTML digest email of recent changes via Resend."""
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set; skipping email digest")
        return False

    recipients = recipients or settings.digest_recipients
    if not recipients:
        logger.warning("No digest recipients configured; skipping email")
        return False

    changed = [d for d in diffs if d.has_change]
    if not changed:
        logger.info("No changes to digest; skipping email")
        return False

    html = _build_html(changed)
    subject = subject or f"[Competitive Intelligence] {len(changed)} change(s) detected"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.resend_from_email,
                    "to": recipients,
                    "subject": subject,
                    "html": html,
                },
            )
            resp.raise_for_status()
            logger.info(f"Digest email sent to {len(recipients)} recipient(s)")
            return True
    except Exception as exc:
        logger.error(f"Failed to send digest email: {exc}")
        return False


def _build_html(diffs: List[DiffLogRead]) -> str:
    rows = ""
    for d in diffs:
        competitor = getattr(d.url, "competitor", None) if d.url else None
        comp_name = competitor.name if competitor else "Unknown"
        url = d.url.url if d.url else ""
        bullets = "".join(f"<li>{b}</li>" for b in (d.bullets or []))
        rows += f"""
        <tr>
          <td style="padding:8px;border-bottom:1px solid #222638">{d.created_at.strftime('%Y-%m-%d %H:%M')} UTC</td>
          <td style="padding:8px;border-bottom:1px solid #222638"><strong>{comp_name}</strong></td>
          <td style="padding:8px;border-bottom:1px solid #222638"><a href="{url}" style="color:#818cf8">{url}</a></td>
          <td style="padding:8px;border-bottom:1px solid #222638">{d.category or 'General'}</td>
          <td style="padding:8px;border-bottom:1px solid #222638"><strong>{d.headline}</strong><ul>{bullets}</ul></td>
        </tr>
        """
    return f"""
    <!doctype html>
    <html>
    <body style="background:#090A0F;color:#e5e7eb;font-family:Inter,system-ui,sans-serif;padding:24px">
      <h2 style="color:#818cf8;margin-bottom:16px">🕵️‍♂️ Competitive Intelligence Digest</h2>
      <p style="color:#9ca3af">{len(diffs)} change(s) detected since last scan.</p>
      <table style="width:100%;border-collapse:collapse;background:#12141D;border:1px solid #222638;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#12141D;border-bottom:1px solid #222638">
            <th style="text-align:left;padding:10px;color:#9ca3af">Time</th>
            <th style="text-align:left;padding:10px;color:#9ca3af">Competitor</th>
            <th style="text-align:left;padding:10px;color:#9ca3af">URL</th>
            <th style="text-align:left;padding:10px;color:#9ca3af">Category</th>
            <th style="text-align:left;padding:10px;color:#9ca3af">Change</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <p style="margin-top:24px;color:#6b7280;font-size:12px">Competitive Intelligence Tracker — automated diff report.</p>
    </body>
    </html>
    """
