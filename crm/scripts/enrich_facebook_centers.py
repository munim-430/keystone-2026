#!/usr/bin/env python3
"""
Keystone B2B CRM - Facebook Page Verification & Phone Number Enrichment Pipeline
Discovers official Facebook Pages for language and IELTS coaching centers,
verifies identity, extracts listed phone numbers, and links them to the CRM.
"""

import os
import re
import sys
import json
import time
import argparse
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path

# DDGS for search
try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_JSON = BASE_DIR / "all_bangladesh_centers.json"
OUTPUT_JSON = BASE_DIR / "b2b_facebook_enriched_centers.json"
REPORT_MD = BASE_DIR / "FACEBOOK_ENRICHMENT_REPORT.md"

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://myuvhvmdftaxvdhrwwmu.supabase.co")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_JxGaanhRLZCmGhUskHs4LQ_SI1y7aNy")

# Strict regex requiring whitespace/separator boundary before phone number:
BANGLADESH_PHONE_REGEX = re.compile(
    r'(?:^|[\s\*\:\|\(])(?:\+?880\s*|0)(1[3-9][\d\s-]{7,10}\d)(?:[^\d]|$)'
)

def clean_phone_number(raw: str) -> str:
    """Normalize phone number to standard E.164 +880 format."""
    if not raw:
        return ""
    digits = re.sub(r'[^0-9]', '', raw)
    if digits.startswith('880'):
        digits = digits[3:]
    if digits.startswith('0'):
        digits = digits[1:]
    if len(digits) == 10 and digits[0] == '1':
        return f"+880{digits}"
    return raw.strip()

def search_facebook_page(center_name: str, district: str) -> str:
    """Search DuckDuckGo for the center's official Facebook Page URL."""
    clean_name = re.sub(r'[\(\)\[\]\{\}\'\"-]', ' ', center_name)
    clean_name = ' '.join(clean_name.split()[:5])  # first 5 words
    query = f"{clean_name} {district} facebook"

    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
            for r in results:
                href = r.get('href', '')
                if 'facebook.com' in href.lower():
                    if any(x in href.lower() for x in ['/groups/', '/events/', '/hashtag/', '/watch/', '/login', '/help/']):
                        continue
                    parsed = urllib.parse.urlparse(href)
                    path_parts = [p for p in parsed.path.split('/') if p]
                    if path_parts:
                        if path_parts[0] == 'profile.php':
                            clean_fb_url = f"https://www.facebook.com/profile.php"
                            if 'id=' in parsed.query:
                                clean_fb_url += f"?{parsed.query}"
                            return clean_fb_url
                        else:
                            return f"https://www.facebook.com/{path_parts[0]}/"
    except Exception:
        pass
    return ""

def fetch_facebook_metadata(fb_url: str) -> dict:
    """Fetch public page content via curl and extract contact details."""
    result = {
        "url": fb_url,
        "title": "",
        "phones": [],
        "emails": [],
        "followers": "",
        "address": "",
        "verified": False
    }

    if not fb_url or 'facebook.com' not in fb_url:
        return result

    base_fb = fb_url.rstrip('/')
    targets = [base_fb]
    if not base_fb.endswith('/about'):
        targets.append(f"{base_fb}/about")

    all_phones = []
    all_emails = []

    for target in targets:
        jina_endpoint = f"https://r.jina.ai/{target}"
        try:
            text = subprocess.check_output(
                ['curl', '-s', '-L', '--max-time', '12', jina_endpoint],
                stderr=subprocess.DEVNULL
            ).decode('utf-8', errors='ignore')

            if not text or len(text) < 100:
                continue

            # Extract Title
            if not result["title"]:
                title_match = re.search(r'Title:\s*(.+)', text)
                if title_match and "Log In" not in title_match.group(1):
                    result["title"] = title_match.group(1).replace('| Rajshahi', '').replace('| Facebook', '').strip()

            # Extract Followers
            if not result["followers"]:
                follower_match = re.search(r'(\d+[\.,]?\d*[KM]?\+?\s*followers)', text, re.IGNORECASE)
                if follower_match:
                    result["followers"] = follower_match.group(1).strip()

            # Extract Phones
            for match in BANGLADESH_PHONE_REGEX.finditer(text):
                raw = match.group(0)
                digits = re.sub(r'[^0-9]', '', raw)
                if digits.startswith('880'):
                    digits = digits[3:]
                if digits.startswith('0'):
                    digits = digits[1:]
                if len(digits) == 10 and digits[0] == '1':
                    norm_phone = f"+880{digits}"
                    if norm_phone not in all_phones:
                        all_phones.append(norm_phone)

            # Extract Emails
            emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
            for e in emails:
                if not any(x in e.lower() for x in ['fb.com', 'facebook', 'sentry', 'example', 'w3.org']):
                    if e not in all_emails:
                        all_emails.append(e)

            # If we got phones, break out
            if all_phones:
                break

        except Exception:
            continue

    result["phones"] = all_phones
    result["emails"] = all_emails
    if all_phones or result["title"]:
        result["verified"] = True

    return result

def main():
    parser = argparse.ArgumentParser(description="Enrich B2B coaching centers with verified Facebook pages and phones")
    parser.add_argument("--start", type=int, default=0, help="Starting index")
    parser.add_argument("--limit", type=int, default=10, help="Number of centers to process")
    parser.add_argument("--sync-supabase", action="store_true", help="Upsert results to Supabase")
    args = parser.parse_args()

    print(f"==================================================")
    print(f"🚀 Keystone B2B Facebook Page & Phone Verifier")
    print(f"==================================================")
    print(f"Input: {INPUT_JSON}")
    print(f"Range: Index {args.start} to {args.start + args.limit}")

    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        centers = json.load(f)

    target_slice = centers[args.start : args.start + args.limit]
    print(f"Processing {len(target_slice)} centers...\n")

    enriched_results = []
    stats = {
        "existing_fb": 0,
        "discovered_fb": 0,
        "not_found": 0,
        "phones_extracted": 0,
        "missing_phones_filled": 0,
        "exact_matches": 0
    }

    for idx, center in enumerate(target_slice, start=args.start + 1):
        cid = center.get("id")
        name = center.get("name", "Unknown")
        district = center.get("district", "")
        crm_phone = center.get("phone", "")
        existing_url = center.get("url", "")

        print(f"[{idx}/{len(centers)}] {name} ({district})")
        print(f"   CRM Phone: {crm_phone or '[MISSING]'}")

        fb_url = ""
        # 1. Check if existing URL is already Facebook
        if "facebook.com" in existing_url.lower():
            fb_url = existing_url
            stats["existing_fb"] += 1
            print(f"   Found Direct FB URL: {fb_url}")
        else:
            # 2. Search DuckDuckGo for official Facebook page
            fb_url = search_facebook_page(name, district)
            if fb_url:
                stats["discovered_fb"] += 1
                print(f"   Discovered FB URL: {fb_url}")
            else:
                stats["not_found"] += 1
                print(f"   ❌ Facebook Page not found in search")

        extracted_phones = []
        meta = {}
        if fb_url:
            # 3. Fetch metadata & extract phone numbers
            meta = fetch_facebook_metadata(fb_url)
            extracted_phones = meta.get("phones", [])
            if extracted_phones:
                stats["phones_extracted"] += 1
                print(f"   Extracted FB Phone(s): {', '.join(extracted_phones)}")
                if meta.get("followers"):
                    print(f"   Audience: {meta.get('followers')}")
            else:
                print(f"   (No phone extracted from FB public text)")

        # 4. Cross-reference with CRM record
        match_status = "NO_FB"
        updated_phone = crm_phone

        if fb_url:
            clean_crm = clean_phone_number(crm_phone)
            if clean_crm and clean_crm in extracted_phones:
                match_status = "VERIFIED_EXACT_MATCH"
                stats["exact_matches"] += 1
                print(f"   ✅ VERIFIED: Extracted phone matches CRM perfectly!")
            elif not clean_crm and extracted_phones:
                match_status = "ENRICHED_NEW_PHONE"
                updated_phone = extracted_phones[0]
                stats["missing_phones_filled"] += 1
                print(f"   🌟 ENRICHED: Blank CRM phone filled with FB phone: {updated_phone}")
            elif clean_crm and extracted_phones:
                match_status = "ALTERNATE_PHONE_FOUND"
                print(f"   ℹ️ Alternate phone found on FB: {extracted_phones[0]}")
            else:
                match_status = "FB_LINKED"

        record = {
            **center,
            "facebook_url": fb_url,
            "extracted_phones": extracted_phones,
            "facebook_followers": meta.get("followers", ""),
            "verification_status": match_status,
            "phone": updated_phone or crm_phone,
            "url": fb_url if fb_url else existing_url
        }
        enriched_results.append(record)
        time.sleep(1.0)

    print(f"\n==================================================")
    print(f"📊 Batch Results Summary:")
    print(f"==================================================")
    print(f"Processed:              {len(target_slice)}")
    print(f"Facebook Pages Found:   {stats['existing_fb'] + stats['discovered_fb']} (Direct: {stats['existing_fb']}, Discovered: {stats['discovered_fb']})")
    print(f"Phones Extracted:       {stats['phones_extracted']}")
    print(f"Exact Phone Matches:    {stats['exact_matches']}")
    print(f"Missing Phones Filled:  {stats['missing_phones_filled']}")

    # Save output
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(enriched_results, f, ensure_ascii=False, indent=2)
    print(f"\nSaved enriched batch data to: {OUTPUT_JSON}")

    # Optionally sync to Supabase
    if args.sync_supabase:
        sync_to_supabase(enriched_results)

def sync_to_supabase(records):
    print(f"\nSyncing {len(records)} updated records to Supabase b2b_centers...")
    endpoint = f"{SUPABASE_URL}/rest/v1/b2b_centers"
    
    payload = []
    for r in records:
        payload.append({
            "id": r["id"],
            "name": r["name"],
            "district": r["district"],
            "phone": r.get("phone", ""),
            "url": r.get("facebook_url") or r.get("url", ""),
            "link": r.get("facebook_url") or r.get("url", ""),
            "status": r.get("status", "New"),
            "priority": r.get("priority", "Medium"),
            "studentCount": r.get("studentCount", 0),
            "updated_at": "now()"
        })

    req = urllib.request.Request(
        endpoint,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        },
        data=json.dumps(payload).encode("utf-8"),
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"✅ Supabase batch upsert succeeded! HTTP {resp.status}")
    except Exception as e:
        print(f"❌ Supabase upsert error: {e}")

if __name__ == "__main__":
    main()
