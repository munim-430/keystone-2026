# 03 - B2B Language Center Partnership Pipeline

Type: task
Status: closed
Closed At: 2026-10-01
Blocked by: None

## Question
How should Keystone Overseas operationalize the 856+ language and coaching center dataset (`crm/all_bangladesh_centers.json`) into an active affiliate network—including the one-page partner revenue-share contract (৳2,000 upfront referral payment upon file opening + ৳15,000–৳20,000 post-visa bonus), outreach call scripts, and automated WhatsApp partner sequences?

## Resolution
1. **B2B Revenue-Share Agreement (`crm/b2b_partner_contract.md`)**:
   - Codified a formal 1-page MOU between Keystone Overseas and the Partner Center Director.
   - Payout SLA:
     - **Stage 1 (Student Document Registration):** ৳2,000 transferred via bKash/Bank within 24 hours of onboarding.
     - **Stage 2 (Visa Stamping):** ৳15,000–৳25,000 transferred within 48 hours (Cyprus: ৳15k, Malaysia: ৳15k, Romania: ৳20k, Hungary: ৳20k, South Korea: ৳25k, Canada: ৳25k).
   - Inclusions: Free co-branded European career masterclasses hosted at partner centers, dedicated counselor routing, real-time milestone notifications.

2. **Director-to-Director Outbound Call & Objection Playbook (`crm/b2b_outreach_scripts.md`)**:
   - Professional script designed for fast rapport with institute directors.
   - Core value proposition: Monetizing 50%–60% of students who fail IELTS 6.5 or have study gaps >3 years via Cyprus & Romania zero-IELTS corridors.
   - Objection scripts handling "We only teach IELTS", "Agencies never pay commissions", and "Students want UK/USA only".
   - 3-touch WhatsApp follow-up sequence with social proof and closing calls-to-action.

3. **B2B Campaign Engine (`crm/generate_b2b_campaign.py`)**:
   - Filtered, validated, and normalized 859 centers into **678 verified callable mobile targets** across Bangladesh.
   - Generated personalized WhatsApp deep-links with pre-filled Bengali partner pitches.
   - Exported sorted, actionable call-sheet at `crm/b2b_call_sheet.csv` and district metrics at `crm/b2b_district_summary.json`.
