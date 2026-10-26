"""Web scraping engine: Playwright with Jina Reader fallback.

Produces cleaned Markdown and a SHA-256 content hash for change detection.
"""

import hashlib
import re
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

# Playwright is imported lazily to avoid hard-failing when browsers aren't installed.
from app.core.config import settings


# ---------------------------------------------------------------------------
# Hashing
# ---------------------------------------------------------------------------
def compute_hash(text: str) -> str:
    """SHA-256 hash of cleaned markdown text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Cleaning
# ---------------------------------------------------------------------------
_NOISE_PATTERNS = [
    r"(?i)cookie[s]?\s+(policy|notice|banner|settings)",
    r"(?i)we use cookies",
    r"(?i)accept all cookies",
    r"(?i)this site uses cookies",
    r"(?i)privacy policy",
    r"(?i)terms of service",
    r"(?i)sign up|log in|login|signup",
    r"(?i)newsletter",
    r"(?i)subscribe to our",
    r"(?i)follow us on",
    r"(?i)copyright\s+\d{4}",
    r"(?i)all rights reserved",
    r"(?i)powered by",
    r"(?i)\u00a9\s*\d{4}",
]


def _strip_noise(text: str) -> str:
    """Remove common footer/cookie-banner noise from markdown text."""
    lines = text.splitlines()
    cleaned_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if any(re.search(pat, stripped) for pat in _NOISE_PATTERNS):
            continue
        cleaned_lines.append(stripped)
    return "\n".join(cleaned_lines)


def clean_markdown(markdown: str) -> str:
    """Clean raw markdown: collapse whitespace, strip noise, trim."""
    # Collapse multiple blank lines
    markdown = re.sub(r"\n{3,}", "\n\n", markdown)
    markdown = _strip_noise(markdown)
    # Collapse trailing/leading whitespace per line again
    markdown = re.sub(r"[ \t]+", " ", markdown)
    return markdown.strip()


# ---------------------------------------------------------------------------
# Jina Reader (zero-overhead HTML -> Markdown)
# ---------------------------------------------------------------------------
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def _fetch_jina(url: str) -> str:
    """Fetch URL via Jina Reader API and return markdown text."""
    target = url if url.startswith("http") else f"https://{url}"
    jina_url = settings.jina_reader_base_url.rstrip("/") + target
    headers: dict[str, str] = {}
    if settings.jina_api_key:
        headers["Authorization"] = f"Bearer {settings.jina_api_key}"
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(jina_url, headers=headers)
        resp.raise_for_status()
        return resp.text


# ---------------------------------------------------------------------------
# Playwright (full-browser rendering for JS-heavy sites)
# ---------------------------------------------------------------------------
async def _fetch_playwright(url: str) -> Optional[str]:
    """Render URL with Playwright and extract main-text markdown."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:  # pragma: no cover
        logger.warning("Playwright not installed; skipping browser fetch")
        return None

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0 Safari/537.36"
                )
            )
            page = await context.new_page()
            await page.goto(target_url(url), wait_until="networkidle", timeout=45000)
            # Give dynamic content a moment
            await page.wait_for_timeout(2000)
            # Extract visible text of the <main> or <article> or body fallback
            content = await page.evaluate("""() => {
                const main = document.querySelector('main') || document.querySelector('article') || document.body;
                return main.innerText || main.textContent || '';
            }""")
            await browser.close()
            return content or None
    except Exception as exc:  # pragma: no cover
        logger.warning(f"Playwright fetch failed for {url}: {exc}")
        return None


def target_url(url: str) -> str:
    return url if url.startswith("http") else f"https://{url}"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
async def scrape_url(url: str) -> str:
    """Scrape a URL and return cleaned markdown.

    Strategy:
      1. Try Jina Reader (fast, HTML->Markdown, no browser).
      2. Fall back to Playwright (JS-heavy pages).
    """
    logger.info(f"Scraping: {url}")

    # Attempt Jina Reader first
    try:
        markdown = await _fetch_jina(url)
        if markdown and len(markdown.strip()) > 50:
            logger.info(f"Jina Reader success: {len(markdown)} chars")
            return clean_markdown(markdown)
    except Exception as exc:
        logger.warning(f"Jina Reader failed for {url}: {exc}")

    # Fallback to Playwright
    try:
        text = await _fetch_playwright(url)
        if text and len(text.strip()) > 20:
            logger.info(f"Playwright fallback success: {len(text)} chars")
            return clean_markdown(text)
    except Exception as exc:
        logger.warning(f"Playwright fallback failed for {url}: {exc}")

    raise RuntimeError(f"Unable to scrape content from {url}")
