# Wayfinder Map: Keystone Hybrid Employee CRM & Lead Distribution System

## Destination

A production-ready hybrid CRM (B2B Partner Outreach + B2C Candidate Lifecycle) with PIN-based caller authentication, quota allocation leases, real-time Supabase synchronization, and automated omnichannel lead ingestion.

## Notes

- **Domain**: Higher Education Consultancy & Legal Workforce Mobility (Keystone Overseas, Sobhanbag, Dhanmondi HQ).
- **Core Invariants**:
  - HQ Address: House - 5/4, Sobhanbag, Road No. 16, Dhaka 1207 (Zero Gazipur desks).
  - 2-Stage Hybrid Fee: 10,000 / 20,000 BDT Stage 1 intake fee; 0 BDT cash tuition (direct international bank wire via authorized student file).
  - Anti-dalal transparency: 0 BDT agency service fees on commission-sharing corridors (Cyprus, Korea, Malaysia).
- **Reference Skills**: `codebase-design`, `domain-modeling`, `tdd`, `prototype`.
- **Target Users**: 3 Telephone Callers / Counselors (PIN authenticated) and Managing Partner / Founder (Hasibul Munim).

## Decisions so far

- [01 Unified Schema & Data Model Architecture](file:///home/munim/.scratch/keystone-crm/issues/01-schema-and-data-model-architecture.md): Normalized PostgreSQL schema in Supabase with PIN users, leased B2B partners via `FOR UPDATE SKIP LOCKED`, relational call logs, and 2-stage student fee tracking (`keystone-2026/crm/supabase_schema_unified.sql`).
- [07 Language Center Verified Lead Pipeline Engine](file:///home/munim/.scratch/keystone-crm/issues/07-language-center-verified-lead-pipeline.md): 4-Pillar pipeline converting 859 centers into verified institutional lead generators via WhatsApp Tiering, Tele-Verification checklists, Director Fast-Drop, and 24-hr bKash payout flywheel.

## Not yet specified

- **WhatsApp/SMS Instant Dispatch**: Automated 1-click WhatsApp message triggers via official WhatsApp Business Cloud API vs native `wa.me` desktop redirect.
- **Automated bKash Commission Disbursement**: Integrating bKash B2B Payout API for ৳2,000 referral commissions vs manual accounting reconciliations.
- **Offline Resiliency & Conflict Resolution**: Local IndexedDB caching with background sync for intermittent Sobhanbag internet drops.

## Out of scope

- Direct international tuition payment processing inside the CRM (violates Bangladesh Bank foreign exchange student file quota regulations).
- Public candidate self-service portal (candidates communicate via WhatsApp/in-person counseling).
