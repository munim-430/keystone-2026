# 01 Unified Schema & Data Model Architecture

Type: research
Status: resolved

## Question

How should the database schema unify B2B institutional partners (`all_bangladesh_centers.json` / `b2b_call_sheet_verified.csv`), B2C candidate profiles (`StudentIntakeForm`), call logging history, caller PIN profiles, and quota leases in Supabase PostgreSQL?

## Answer

Researched existing structures in `/home/munim/keystone-2026/crm/supabase_schema.sql`, `/home/munim/keystone-counselor-pwa/src/services/storage.js`, and `b2b_call_sheet_verified.csv`. 

Developed and authored `/home/munim/keystone-2026/crm/supabase_schema_unified.sql`:
1. **`users` Table**: Supports 4-digit PIN authentication (`pin VARCHAR(10) UNIQUE`), roles (`admin`, `counselor`, `telecaller`, `partner`), and phone numbers.
2. **`b2b_partners` Table**: Accommodates 859 centers (`center-0001` format), WhatsApp verification state (`ACTIVE`, `VERIFIED_ACTIVE`, `BUSINESS_ACCOUNT`), carrier, status (`eager`, `follow_up`, `cold`, `partnered`), and concurrency lease locks (`assigned_to_user_id`, `lease_expires_at`).
3. **`b2b_call_logs` Table**: Replaces unindexed JSONB arrays with normalized relational call logs, caller attribution, status transitions, and callback scheduling.
4. **`students` Table**: Unifies the Counselor PWA intake schema (academic gap years, GPA, English proficiency, discipline, budget) and tracks the 2-Stage fee lifecycle (`stage1_fee_paid`, `stage2_fee_paid`) and partner referral attribution (`referred_by_partner_id`).
5. **`lease_b2b_batch` RPC**: Implemented using PostgreSQL `FOR UPDATE SKIP LOCKED` to dynamically lease batches of 30–50 leads for 45 minutes to active PIN callers, completely eliminating dialer collisions.
