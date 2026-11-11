# 02 Caller Hub Partitioning & Supabase Live Sync

Type: prototype
Status: resolved
Blocked by: 01

## Question

How will multi-caller concurrency and lead tracking be enforced across 3 telecallers without session collisions, data siloing, or loss of call history?

## Answer

Implemented a dual-layer architecture:

1. **Geographic Territory Partitioning (Caller Hubs)**:
   - 859 centers are split into 3 non-overlapping territorial hubs in `crm/app.js`:
     - `CALLER_1` (Eastern Hub: 288 centers)
     - `CALLER_2` (Northern Hub: 290 centers)
     - `CALLER_3` (Southern Hub: 281 centers)
   - Eliminates lead dialer collisions by design.

2. **Supabase Realtime Cloud Sync Engine**:
   - Integrated Supabase JS SDK (`@supabase/supabase-js@2`) with fallback to local cache.
   - **Schema**: Updated `crm/supabase_schema.sql` for `public.b2b_centers` with `supabase_realtime` publication enabled.
   - **Realtime Listener**: `supabase.channel('b2b_centers_realtime').on('postgres_changes', ...)` dynamically receives remote telecaller updates and updates the UI and counters in real time with toast notifications.
   - **Optimistic Sync**: Any status change (Eager, FollowUp, Cold, Partnered), student count step, or call note immediately executes an upsert to Supabase while keeping `localStorage` fresh.
   - **Configuration Interface**: In-app setup modal (`#cloudSyncModal`) supports direct credential input, URL query parameter bootstrapping (`?sb_url=...&sb_key=...`), `config.js`, and 1-click initial bulk upload of all 859 centers.
