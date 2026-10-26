"""Gemini 2.5 Flash diff analyzer.

Sends old vs new markdown to Gemini and returns a structured DiffAnalysis.
"""

import json
import re
from typing import Optional

import google.generativeai as genai
from loguru import logger

from app.core.config import settings
from app.schemas.models import DiffAnalysis

genai.configure(api_key=settings.gemini_api_key or "")


_DIFF_SYSTEM_PROMPT = """You are a competitive intelligence analyst. You receive two snapshots
(OLD and NEW) of a competitor's web page (markdown format) and must determine what
changed, if anything, and summarize it in structured JSON.

Rules:
- Return ONLY valid JSON, no markdown fences, no extra prose.
- has_change: boolean — true only if there is a meaningful business-relevant change
  (pricing, features, packaging, positioning, changelog entries). Ignore cosmetic
  rewording, dates, timestamps, or minor layout tweaks.
- headline: a single sentence, max ~20 words, describing the most important change.
- summary_bullets: array of short strings (3-6 max), each one concrete fact.
- category: one of ["Pricing", "Product", "Changelog", "Positioning", "General"].
- If nothing meaningful changed, set has_change=false and headline="No significant change detected".
"""


_DIFF_USER_TEMPLATE = """Competitor: {competitor_name}
Page type: {page_type}

--- OLD SNAPSHOT ---
{old_text}

--- NEW SNAPSHOT ---
{new_text}

Output JSON with keys: has_change, headline, summary_bullets, category.
"""


async def analyze_diff(
    *,
    old_text: str,
    new_text: str,
    page_type: str,
    competitor_name: str = "Unknown",
) -> DiffAnalysis:
    """Run Gemini 2.5 Flash to compare old vs new snapshots."""
    model = genai.GenerativeModel(settings.gemini_model)

    prompt = _DIFF_SYSTEM_PROMPT + "\n\n" + _DIFF_USER_TEMPLATE.format(
        competitor_name=competitor_name,
        page_type=page_type,
        old_text=old_text[:12000],
        new_text=new_text[:12000],
    )

    try:
        response = await model.generate_content_async(prompt)
        raw = response.text or "{}"
    except Exception as exc:  # pragma: no cover - network/model failure
        logger.error(f"Gemini diff analysis failed: {exc}")
        return DiffAnalysis(
            has_change=False,
            headline="Diff analysis unavailable (AI error)",
            summary_bullets=[f"Error: {exc}"],
            category="General",
        )

    # Strip possible markdown code fences
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n", "", cleaned)
        cleaned = re.sub(r"\n```$", "", cleaned)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # Attempt to extract a JSON object substring
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                data = json.loads(cleaned[start : end + 1])
            except json.JSONDecodeError:
                data = {}
        else:
            data = {}

    return DiffAnalysis(
        has_change=bool(data.get("has_change", False)),
        headline=str(data.get("headline", "Change detected"))[:200],
        summary_bullets=list(data.get("summary_bullets", []))[:6],
        category=str(data.get("category", "General"))[:64],
    )
