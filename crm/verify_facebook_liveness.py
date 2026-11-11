#!/usr/bin/env python3
"""Conservative Facebook-page verification for the B2B call sheet.

The source CSV's ``facebook_url`` field is really a general source URL: most
rows contain a Google Maps URL. This verifier never treats a network error,
the current year in Facebook's JavaScript, or a non-Facebook source as proof
of activity.

Every processed record receives exactly one business classification:

* ACTIVE_WITHIN_90_DAYS -- a verified, name-matching public page exposes a
  post timestamp inside the 90-day window, or a current public engagement
  signal (Facebook's "talking about this" count) as a documented proxy.
* DORMANT -- the official page is publicly verifiable but exposes no recent
  post/activity signal.
* NO_PAGE -- no Facebook URL was supplied, the URL is unavailable, or its
  public metadata does not match the named center.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import csv
import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


BASE_DIR = Path(__file__).resolve().parent
INPUT_CSV = BASE_DIR / "b2b_call_sheet.csv"
OUTPUT_CSV = BASE_DIR / "b2b_call_sheet_enriched.csv"
SUMMARY_JSON = BASE_DIR / "b2b_facebook_audit_summary.json"

# A deliberately small UA gets Facebook's public metadata response. At the
# time of this audit a full Chrome UA received HTTP 400 from the same URLs.
HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
}

OUTPUT_FIELDS = [
    "fb_verified",
    "fb_liveness_status",
    "fb_page_url",
    "fb_page_title",
    "fb_latest_public_post_at",
    "fb_activity_evidence",
    "fb_evidence_quality",
    "fb_last_activity_check",
]

GENERIC_NAME_WORDS = {
    "a", "an", "and", "at", "bangladesh", "branch", "british", "campus",
    "care", "center", "centre", "club", "coaching", "college", "course",
    "dhaka", "education", "english", "for", "german", "global", "ielts",
    "in", "institute", "international", "japanese", "korean", "language",
    "learning", "of", "official", "online", "rajshahi", "school", "test",
    "the", "training",
}


def clean_fb_url(url: str) -> str | None:
    """Return a normalized public Facebook URL, or None for non-FB sources."""
    value = (url or "").strip()
    if not re.search(r"(?:^|\.)facebook\.com$", urllib.parse.urlsplit(value).netloc.lower()):
        return None
    if value.startswith("http://"):
        value = "https://" + value[7:]
    value = re.sub(
        r"^https://(?:m|web)\.facebook\.com",
        "https://www.facebook.com",
        value,
        flags=re.IGNORECASE,
    )
    parts = urllib.parse.urlsplit(value)
    query = urllib.parse.parse_qs(parts.query)
    # Preserve the numeric id used by profile.php pages; discard tracking data.
    clean_query = urllib.parse.urlencode({"id": query["id"][0]}) if "id" in query else ""
    path = re.sub(r"/(?:about|reels|groups|posts)/?$", "/", parts.path, flags=re.I)
    return urllib.parse.urlunsplit(("https", parts.netloc.lower(), path, clean_query, ""))


def _meta(body: str, key: str) -> str:
    patterns = (
        rf'<meta[^>]+(?:property|name)=["\']{re.escape(key)}["\'][^>]+content=["\']([^"\']*)',
        rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:property|name)=["\']{re.escape(key)}["\']',
    )
    for pattern in patterns:
        match = re.search(pattern, body, re.IGNORECASE)
        if match:
            return html.unescape(match.group(1)).strip()
    return ""


def _name_tokens(value: str) -> set[str]:
    tokens = set(re.findall(r"[a-z0-9]+", value.lower()))
    return {token for token in tokens if len(token) > 1 and token not in GENERIC_NAME_WORDS}


def _is_official_match(name: str, district: str, title: str, description: str) -> tuple[bool, str]:
    """Conservatively match center identity against Facebook public metadata."""
    if not title:
        return False, "facebook_url_returned_no_public_page_metadata"

    haystack = f"{title} {description}".lower()
    if " is on facebook. join facebook " in f" {haystack} ":
        return False, "personal_profile_not_official_center_page"

    district_l = district.strip().lower()
    known_places = {"dhaka", "rajshahi", "bogura", "khulna", "karachi"}
    page_places = {place for place in known_places if re.search(rf"\b{place}\b", haystack)}
    if district_l in known_places and page_places and district_l not in page_places:
        return False, "page_location_conflicts_with_center_district"

    name_tokens = _name_tokens(name)
    page_tokens = _name_tokens(f"{title} {description}")
    shared = name_tokens & page_tokens
    compact_name = " ".join(re.findall(r"[a-z0-9]+", name.lower()))
    compact_title = " ".join(re.findall(r"[a-z0-9]+", title.lower()))
    similarity = SequenceMatcher(None, compact_name, compact_title).ratio()

    if shared or similarity >= 0.52:
        return True, "public_metadata_name_match"
    # Some short/generic names have no useful distinctive token after
    # stop-word removal; require the literal name in metadata.
    compact_haystack = " ".join(re.findall(r"[a-z0-9]+", haystack))
    if compact_name and len(compact_name) >= 4 and compact_name in compact_haystack:
        return True, "public_metadata_literal_name_match"
    return False, "facebook_page_metadata_does_not_match_center"


def _parse_engagement_count(description: str) -> int | None:
    match = re.search(r"([\d,.]+)\s+talking about this", description, re.IGNORECASE)
    if not match:
        return None
    try:
        return int(match.group(1).replace(",", ""))
    except ValueError:
        return None


def _latest_post_timestamp(body: str) -> datetime | None:
    """Extract only timestamps explicitly labelled as content publication time."""
    candidates: list[datetime] = []
    patterns = (
        r'(?:creation_time|publish_time|publishTime|creation_timestamp)[^0-9]{0,20}(1[5-9]\d{8})',
        r'(?:creation_time|publish_time|publishTime|creation_timestamp)[^0-9]{0,20}(20\d\d-\d\d-\d\d[T ][0-9:.+Z-]+)',
    )
    for pattern in patterns:
        for raw in re.findall(pattern, body, re.IGNORECASE):
            try:
                if raw.isdigit():
                    parsed = datetime.fromtimestamp(int(raw), timezone.utc)
                else:
                    parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
                    parsed = parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
                candidates.append(parsed.astimezone(timezone.utc))
            except (ValueError, OSError, OverflowError):
                continue
    return max(candidates) if candidates else None


def check_row(row: dict[str, str], now: datetime) -> dict[str, Any]:
    candidate = clean_fb_url(row.get("facebook_url", ""))
    checked_date = now.date().isoformat()
    if not candidate:
        return {
            "fb_verified": "NO",
            "fb_liveness_status": "NO_PAGE",
            "fb_page_url": "",
            "fb_page_title": "",
            "fb_latest_public_post_at": "",
            "fb_activity_evidence": "no_facebook_url_in_source_record",
            "fb_evidence_quality": "HIGH",
            "fb_last_activity_check": checked_date,
        }

    last_error: Exception | None = None
    body = ""
    final_url = candidate
    for attempt in range(3):
        try:
            request = urllib.request.Request(candidate, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=15) as response:
                body = response.read().decode("utf-8", errors="ignore")
                final_url = clean_fb_url(response.geturl()) or candidate
            break
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(0.5 * (attempt + 1))
    if not body:
        exc = last_error or OSError("empty Facebook response")
        return {
            "fb_verified": "NO",
            "fb_liveness_status": "NO_PAGE",
            "fb_page_url": candidate,
            "fb_page_title": "",
            "fb_latest_public_post_at": "",
            "fb_activity_evidence": f"facebook_probe_failed:{type(exc).__name__}",
            "fb_evidence_quality": "LOW",
            "fb_last_activity_check": checked_date,
        }

    title = _meta(body, "og:title")
    description = _meta(body, "og:description") or _meta(body, "description")
    canonical = clean_fb_url(_meta(body, "og:url")) or final_url
    official, match_reason = _is_official_match(
        row.get("name", ""), row.get("district", ""), title, description
    )
    if not official:
        return {
            "fb_verified": "NO",
            "fb_liveness_status": "NO_PAGE",
            "fb_page_url": canonical,
            "fb_page_title": title,
            "fb_latest_public_post_at": "",
            "fb_activity_evidence": match_reason,
            "fb_evidence_quality": "MEDIUM" if title else "LOW",
            "fb_last_activity_check": checked_date,
        }

    cutoff = now - timedelta(days=90)
    post_time = _latest_post_timestamp(body)
    if post_time and cutoff <= post_time <= now + timedelta(days=1):
        return {
            "fb_verified": "YES",
            "fb_liveness_status": "ACTIVE_WITHIN_90_DAYS",
            "fb_page_url": canonical,
            "fb_page_title": title,
            "fb_latest_public_post_at": post_time.isoformat(),
            "fb_activity_evidence": "public_post_timestamp_within_90_days",
            "fb_evidence_quality": "HIGH",
            "fb_last_activity_check": checked_date,
        }

    engagement = _parse_engagement_count(description)
    if engagement is not None and engagement > 0:
        return {
            "fb_verified": "YES",
            "fb_liveness_status": "ACTIVE_WITHIN_90_DAYS",
            "fb_page_url": canonical,
            "fb_page_title": title,
            "fb_latest_public_post_at": "",
            "fb_activity_evidence": f"current_public_engagement_proxy:{engagement}_talking_about_this",
            "fb_evidence_quality": "MEDIUM",
            "fb_last_activity_check": checked_date,
        }

    return {
        "fb_verified": "YES",
        "fb_liveness_status": "DORMANT",
        "fb_page_url": canonical,
        "fb_page_title": title,
        "fb_latest_public_post_at": post_time.isoformat() if post_time else "",
        "fb_activity_evidence": "verified_page_no_recent_public_activity_signal",
        "fb_evidence_quality": "MEDIUM",
        "fb_last_activity_check": checked_date,
    }


def run_verification(limit: int | None = None, workers: int = 4) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    dhaka = ZoneInfo("Asia/Dhaka")
    with INPUT_CSV.open("r", encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        rows = list(reader)
        original_fields = list(reader.fieldnames or [])
    if not rows:
        raise SystemExit(f"No records found in {INPUT_CSV}")

    selected = rows[:limit] if limit else rows
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        audits = list(pool.map(lambda row: check_row(row, now), selected))

    if limit and limit < len(rows):
        raise SystemExit("Refusing to write a partial production audit; omit --limit for the full run")

    enriched = [{**row, **audit} for row, audit in zip(selected, audits)]
    fieldnames = original_fields + [field for field in OUTPUT_FIELDS if field not in original_fields]
    with OUTPUT_CSV.open("w", encoding="utf-8", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enriched)

    counts = {status: 0 for status in ("ACTIVE_WITHIN_90_DAYS", "DORMANT", "NO_PAGE")}
    quality: dict[str, int] = {}
    evidence: dict[str, int] = {}
    for audit in audits:
        counts[audit["fb_liveness_status"]] += 1
        quality[audit["fb_evidence_quality"]] = quality.get(audit["fb_evidence_quality"], 0) + 1
        reason = audit["fb_activity_evidence"].split(":", 1)[0]
        evidence[reason] = evidence.get(reason, 0) + 1

    summary = {
        "audit_version": "2.0-conservative-public-metadata",
        "total": len(enriched),
        "classification_counts": counts,
        "active_within_90d": counts["ACTIVE_WITHIN_90_DAYS"],
        "dormant": counts["DORMANT"],
        "no_page": counts["NO_PAGE"],
        "facebook_urls_in_source": sum(clean_fb_url(row.get("facebook_url", "")) is not None for row in rows),
        "verified_official_pages": sum(audit["fb_verified"] == "YES" for audit in audits),
        "evidence_quality_counts": dict(sorted(quality.items())),
        "evidence_reason_counts": dict(sorted(evidence.items())),
        "cutoff_utc": (now - timedelta(days=90)).isoformat(),
        "checked_at_utc": now.isoformat(),
        "cutoff_asia_dhaka": (now - timedelta(days=90)).astimezone(dhaka).isoformat(),
        "checked_at_asia_dhaka": now.astimezone(dhaka).isoformat(),
        "methodology_note": (
            "Public Facebook metadata only. A positive 'talking about this' count is a current "
            "engagement proxy, not a directly exposed post timestamp. NO_PAGE means no verifiable, "
            "name-matching official page was available from the source record; it is not proof that "
            "no Facebook presence exists anywhere."
        ),
    }
    with SUMMARY_JSON.open("w", encoding="utf-8") as target:
        json.dump(summary, target, indent=2, ensure_ascii=False)

    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, help="diagnostic only; partial runs are not written")
    parser.add_argument("--workers", type=int, default=4, help="concurrent public metadata probes")
    args = parser.parse_args()
    summary = run_verification(limit=args.limit, workers=args.workers)
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
