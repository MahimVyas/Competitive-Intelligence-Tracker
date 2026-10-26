"""CRUD operations for Competitive Intelligence Tracker."""

from app.crud.base import (
    add_monitored_url,
    create_competitor,
    create_diff_log,
    create_snapshot,
    get_all_monitored_urls,
    get_competitor_by_id,
    get_competitors,
    get_diffs_for_url,
    get_latest_snapshot,
    get_monitored_url,
    get_previous_snapshot,
    get_recent_diffs,
    get_snapshots_for_url,
)

__all__ = [
    "create_competitor",
    "add_monitored_url",
    "get_competitors",
    "get_competitor_by_id",
    "get_all_monitored_urls",
    "get_monitored_url",
    "create_snapshot",
    "get_latest_snapshot",
    "get_previous_snapshot",
    "get_snapshots_for_url",
    "create_diff_log",
    "get_recent_diffs",
    "get_diffs_for_url",
]
