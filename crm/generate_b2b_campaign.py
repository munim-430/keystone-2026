#!/usr/bin/env python3
"""
generate_b2b_campaign.py — B2B Partner Campaign Generator for Keystone Overseas
Loads 859+ language centers from crm/all_bangladesh_centers.json, normalizes contact info,
generates personalized WhatsApp deep-links and exports actionable district call-sheets.
"""

import json
import re
import urllib.parse
from pathlib import Path
import csv

BASE_DIR = Path(__file__).resolve().parent
CENTERS_JSON = BASE_DIR / "all_bangladesh_centers.json"
OUTPUT_CSV = BASE_DIR / "b2b_call_sheet.csv"
SUMMARY_JSON = BASE_DIR / "b2b_district_summary.json"

PHONE_REGEX = re.compile(r'(?:\+?880|0)?(1[3-9]\d{8})')

WHATSAPP_TEMPLATE = """আসসালামু আলাইকুম স্যার।
আমি হাসিবুল মুনিম, ফাউন্ডার অফ Keystone Overseas (ধানমন্ডি, ঢাকা)।

{center_name}-এর সাথে একটি এক্সক্লুসিভ B2B এডুকেশন পার্টনারশিপের জন্য যোগাযোগ করছি।

আপনার সেন্টারের যেসকল স্টুডেন্টদের স্টাডি গ্যাপ রয়েছে বা IELTS স্কোর নেই, তাদেরকে আমরা সাইপ্রাস (No IELTS, No India Visit) ও রোমানিয়া (১ বছরের অফিসিয়াল প্রেপ ইয়ার, Schengen) সরাসরি ভর্তি ও ভিসা প্রসেসিং দিচ্ছি।

📌 পার্টনার বেনিফিট:
• প্রতি স্টুডেন্ট রেজিস্ট্রেশনে: ৳২,০০০ নিশ্চিত কমিশন (২৪ ঘণ্টার মধ্যে বিকাশ/ব্যাংক)
• প্রতি সফল ভিসায়: ৳১৫,০০০ – ৳২৫,০০০ বোনাস
• ফ্রি ইউরোপিয়ান ক্যারিয়ার সেমিনার আপনার সেন্টারে

আমাদের অফিশিয়াল ওয়েবসাইট: https://www.keystoneeducations.com
অফিস: House 7, Mirpur Road, Sobhanbag, Dhanmondi, Dhaka.

বিস্তারিত আলোচনার জন্য আপনার সুবিধাজনক সময়ে জানাবেন স্যার। ধন্যবাদ!
— হাসিবুল মুনিম (01941-646278)"""

def normalize_bd_phone(raw_phone: str):
    if not raw_phone:
        return None
    cleaned = re.sub(r'[\s\-\(\)]', '', raw_phone)
    match = PHONE_REGEX.search(cleaned)
    if match:
        local_num = match.group(1)
        return {
            "local": f"0{local_num}",
            "e164": f"+880{local_num}",
            "clean_wa": f"880{local_num}",
        }
    return None

def main():
    if not CENTERS_JSON.exists():
        print(f"Error: {CENTERS_JSON} not found.")
        return

    with open(CENTERS_JSON, "r", encoding="utf-8") as f:
        centers = json.load(f)

    print(f"Total Centers Loaded: {len(centers)}")

    district_counts = {}
    valid_campaign_records = []

    for c in centers:
        cid = c.get("id", "")
        name = c.get("name", "Language Center").strip()
        district = c.get("district", "Unknown").strip() or "Unknown"
        raw_phone = c.get("phone", "")
        url = c.get("url", "")
        status = c.get("status", "New")

        phone_info = normalize_bd_phone(raw_phone)
        if not phone_info:
            continue

        district_counts[district] = district_counts.get(district, 0) + 1

        personalized_msg = WHATSAPP_TEMPLATE.format(center_name=name)
        encoded_msg = urllib.parse.quote(personalized_msg)
        wa_link = f"https://wa.me/{phone_info['clean_wa']}?text={encoded_msg}"

        valid_campaign_records.append({
            "id": cid,
            "name": name,
            "district": district,
            "phone_local": phone_info["local"],
            "phone_e164": phone_info["e164"],
            "whatsapp_link": wa_link,
            "facebook_url": url,
            "status": status,
        })

    # Sort records: priority to Dhaka, Rajshahi, Chittagong, Sylhet, etc.
    valid_campaign_records.sort(key=lambda r: (r["district"] != "Dhaka", r["district"] != "Rajshahi", r["district"]))

    # Save to CSV
    fieldnames = ["id", "name", "district", "phone_local", "phone_e164", "whatsapp_link", "facebook_url", "status"]
    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(valid_campaign_records)

    # Save summary
    with open(SUMMARY_JSON, "w", encoding="utf-8") as f:
        json.dump({
            "total_raw_centers": len(centers),
            "valid_callable_centers": len(valid_campaign_records),
            "districts": district_counts,
        }, f, indent=2, ensure_ascii=False)

    print(f"✓ Campaign Generated: {len(valid_campaign_records)} valid mobile targets.")
    print(f"✓ Output CSV Call-Sheet: {OUTPUT_CSV}")
    print(f"✓ District Breakdown: {dict(sorted(district_counts.items(), key=lambda x: x[1], reverse=True)[:10])}")

if __name__ == "__main__":
    main()
