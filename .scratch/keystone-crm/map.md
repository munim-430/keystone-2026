# Wayfinder Map: Keystone Hybrid Employee CRM & Lead Distribution System

## Destination

A production-ready hybrid CRM (B2B Partner Outreach + B2C Candidate Lifecycle) with territory hub partitioning, live Supabase synchronization, focus-mode calling ergonomics, and automated lead ingestion.

## Notes

- **Domain**: Higher Education Consultancy & Legal Workforce Mobility (Keystone Overseas, Sobhanbag, Dhanmondi HQ).
- **Core Invariants**:
  - HQ Address: House - 5/4, Sobhanbag, Road No. 16, Dhaka 1207 (Zero Gazipur desks).
  - 2-Stage Hybrid Fee: 10,000 / 20,000 BDT Stage 1 intake fee; 0 BDT cash tuition (direct international bank wire via authorized student file).
  - Anti-dalal transparency: 0 BDT agency service fees on commission-sharing corridors (Cyprus, Korea, Malaysia).
- **Reference Skills**: `codebase-design`, `domain-modeling`, `tdd`, `prototype`.
- **Target Users**: 3 Telephone Callers / Counselors (Territory Partitioned) and Managing Partner / Founder (Hasibul Munim).
- **Milestone Ladder**:
  - **Part 1, Milestone 1**: Core Schema, Next.js / Supabase SDK bindings, and initial caller UI scaffolding. [COMPLETED]
  - **Part 1, Milestone 2**: Operational Caller Hubs (3 female telecallers), Live Supabase Cloud Sync across all 859 nationwide coaching centers, real-time multi-caller replication, and Focus Mode dialing engine. [COMPLETED]
  - **Part 2, Milestone 1**: B2C Candidate File Opening & Counselor Matching Engine (Counselor PWA integration). [PENDING]
  - **Part 2, Milestone 2**: Automated Omnichannel Ingestion (Website Forms + WhatsApp Webhook + Meta Harvester). [PENDING]

## Decisions so far

- [01 Unified Schema & Data Model Architecture](file:///home/munim/keystone-2026/.scratch/keystone-crm/issues/01-schema-and-data-model-architecture.md): Normalized PostgreSQL schema in Supabase with PIN users, leased B2B partners via `FOR UPDATE SKIP LOCKED`, relational call logs, and 2-stage student fee tracking (`keystone-2026/crm/supabase_schema_unified.sql`).
- [02 Caller Hub Partitioning & Supabase Live Sync](file:///home/munim/keystone-2026/.scratch/keystone-crm/issues/02-caller-pin-auth-and-quota-leasing.md): Balanced 3-way territory split (Eastern 288, Northern 290, Southern 281), active Supabase realtime channel (`b2b_centers_realtime`), optimistic local caching, and live cloud status pill.
- [03 B2B Outreach & Partner CRM UI](file:///home/munim/keystone-2026/.scratch/keystone-crm/issues/03-b2b-outreach-and-partner-crm-ui.md): Single-card Focus Mode with 1-click dialer, WhatsApp proposal generator, instant status buttons, quick Bengali note chips, and student counter stepper.
- [07 Language Center Verified Lead Pipeline Engine](file:///home/munim/keystone-2026/.scratch/keystone-crm/issues/07-language-center-verified-lead-pipeline.md): 4-Pillar pipeline converting 859 centers into verified institutional lead generators via WhatsApp Tiering, Tele-Verification checklists, Director Fast-Drop, and 24-hr bKash payout flywheel.
- [08 Consultant Visual Ergonomics & Focus Mode Engine](file:///home/munim/keystone-2026/.scratch/keystone-crm/issues/08-consultant-focus-mode-and-hub-overhaul.md): Full visual redesign with brand colors `#0593C6`, `#FCFFFF`, `#D83995`, official logo, and low cognitive-load focus mode.

## Not yet specified

- **WhatsApp/SMS Instant Cloud Dispatch**: Official WhatsApp Cloud API integration vs native `wa.me` desktop redirect.
- **Automated bKash Commission Disbursement**: Integrating bKash B2B Payout API for ৳2,000 referral commissions vs manual accounting reconciliations.
- **B2C Candidate Lifecycle Integration**: Direct hand-off from B2B center referrals to the Counselor PWA (`keystone-counselor-pwa`).

## Out of scope

- Direct international tuition payment processing inside the CRM (violates Bangladesh Bank foreign exchange student file quota regulations).
- Public candidate self-service portal (candidates communicate via WhatsApp/in-person counseling).
