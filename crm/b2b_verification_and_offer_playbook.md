# Keystone Overseas B2B Verification & Grand Slam Offer Playbook

> **INTERNAL OPERATIONS DOCUMENT — DO NOT PUBLISH.** Contains confidential partner commission terms and outreach controls.

**Audit date:** 3 October 2026 (Asia/Dhaka)  
**Facebook activity window:** 5 July–3 October 2026 (90 days)  
**Audience:** Keystone Overseas founder, B2B partner desk, callers, CRM administrator  
**Canonical inputs/outputs:** `b2b_call_sheet.csv`, `b2b_call_sheet_enriched.csv`, `b2b_facebook_audit_summary.json`

## 1. Executive decision

Keystone has 678 callable language-center records. The Facebook audit found 42 verifiable, name-matching official pages: 36 show a current public engagement signal and are classified `ACTIVE_WITHIN_90_DAYS`; 6 expose a page but no recent public activity signal and are classified `DORMANT`. The other 636 are classified `NO_PAGE`, primarily because the source record contains Google Maps or another non-Facebook URL rather than a verifiable official Facebook page.

The immediate sales move is a controlled, director-to-director pilot:

1. Call the 36 active-page centers first, while their public marketing motion is visible.
2. Call the 6 dormant-page centers next with a “reactivate your old student base” angle.
3. Work the `NO_PAGE` segment by verified WhatsApp/business-phone quality, not by assuming the center is inactive.
4. Sell one clear outcome: **Keystone turns otherwise-lost study-abroad referrals into fast, trackable partner revenue without making the center process admissions or visas.**
5. Pay **৳2,000 within 24 hours of a qualified referral being accepted and onboarded**, then **৳15,000–৳25,000 after documented visa issuance**, under a written milestone and duplicate-referral policy.
6. Keep the first touch human-reviewed. Automate validation, task creation, logging, reminders, suppression, and reporting—not indiscriminate bulk messaging.

## 2. Facebook liveness audit

### 2.1 Results

| Classification | Records | Share | Operational meaning |
|---|---:|---:|---|
| `ACTIVE_WITHIN_90_DAYS` | 36 | 5.3% | Verified matching official page with a current public engagement signal; prioritize for the first call wave |
| `DORMANT` | 6 | 0.9% | Verified matching official page but no recent public activity signal; use reactivation positioning |
| `NO_PAGE` | 636 | 93.8% | No verifiable matching official page from the supplied source record; do not infer that the business is closed |
| **Total** | **678** | **100%** | Every input row received exactly one classification |

The source contains 54 Facebook URLs. Public metadata verified 42 as matching official pages. Twelve Facebook candidates were rejected because they returned no public page metadata, resolved to personal profiles, or conflicted with the center’s district. The other 624 records supplied a non-Facebook source URL, mostly Google Maps.

| District with a verified page | Active | Dormant | No page | Total records |
|---|---:|---:|---:|---:|
| Rajshahi | 24 | 4 | 38 | 66 |
| Bogura | 8 | 1 | 12 | 21 |
| Khulna | 4 | 1 | 32 | 37 |

All other districts currently fall into `NO_PAGE` because the call sheet does not contain a verifiable Facebook page for those rows. This is a data-coverage finding, not evidence that those districts lack Facebook-active centers.

### 2.2 Evidence standard and limitation

The verifier uses public, logged-out Facebook metadata and conservative name/district matching. It does **not** treat a network error, a year inside Facebook JavaScript, or a generic/personal profile as proof of activity.

Facebook did not consistently expose a latest-post timestamp to the logged-out verifier. Therefore:

- all 36 active classifications are **medium-confidence current-engagement proxies**, based on a positive public “talking about this” signal;
- all 6 dormant classifications are **medium-confidence**, meaning a page is verified but no current public activity signal was exposed;
- `fb_latest_public_post_at` remains blank unless an explicit publication timestamp is observed;
- the CSV retains `fb_activity_evidence` and `fb_evidence_quality` so a caller can distinguish a direct timestamp from a proxy;
- `NO_PAGE` means “no verifiable matching page from this source record,” not “no Facebook presence exists anywhere.”

For high-value centers, the caller should manually open `fb_page_url` before contact and record the visible latest-post date in the CRM. A future high-confidence pipeline should use an authorized Meta API/page-owner data source rather than browser scraping or account circumvention.

### 2.3 Priority rules

Apply these rules in order:

1. **Tier A — active + verified WhatsApp business:** call today; reference one factual, visible center detail.
2. **Tier B — active + verified WhatsApp:** call within 48 hours.
3. **Tier C — dormant + verified WhatsApp:** lead with database reactivation and a free partner seminar.
4. **Tier D — no page + verified WhatsApp business:** treat as a normal phone-led prospect; do not say “you have no Facebook page.”
5. **Tier E — no page + personal/uncertain WhatsApp:** verify the director and business identity before presenting terms.

Never use engagement counts as social scoring in the pitch. They are internal prioritization signals only.

## 3. The Keystone Grand Slam Partner Offer

### 3.1 Ideal partner and painful problem

The ideal partner is a Bangladeshi IELTS, English, Japanese, Korean, German, or general coaching-center director who already attracts students but loses revenue when a student:

- does not reach the target language score;
- has a study gap or an uncertain profile;
- asks for overseas-admission guidance the center does not provide;
- leaves for an unrelated Dhaka agency; or
- creates administrative risk the center does not want to carry.

The director wants additional institutional income and stronger student outcomes, but does not want to hire admissions staff, learn visa processing, chase case updates, or put the center’s reputation behind unsupported promises.

### 3.2 Offer promise

> **Keep teaching. Keystone handles the overseas case. For every qualified student referral we accept and onboard, your center receives ৳2,000 by bKash/bank within 24 hours; after documented visa issuance, it receives a further ৳15,000–৳25,000 destination-based bonus—with a named counselor, milestone updates, and no admission or visa-processing workload for your team.**

This is a process and payout promise, not a visa guarantee. Admissions and visas remain subject to the student’s facts and the decisions of institutions and public authorities.

### 3.3 Value equation

| Lever | Director’s concern | Keystone design |
|---|---|---|
| Dream outcome | Recover value from students the center would otherwise lose | Two-stage referral income plus a credible next step for students |
| Perceived likelihood | “Will you pay and keep us informed?” | Written triggers, named owner, timestamped tracker, transfer reference, milestone evidence |
| Time delay | “When do we see any benefit?” | ৳2,000 within 24 hours after qualified-referral acceptance and onboarding |
| Effort and sacrifice | “Will my staff have to process files?” | One warm introduction and consent; Keystone handles screening, documents, application coordination, visa guidance, and status updates |

### 3.4 Offer stack

**Core: Done-for-you referral desk**

- One official WhatsApp introduction from the center to the student and Keystone.
- A Keystone counselor screens the profile and confirms acceptance or decline.
- Keystone owns the case workflow after acceptance; the center does not prepare or submit the file.

**Fast-win incentive**

- **৳2,000 referral payment** within 24 hours after the referral meets the written qualification rule and is onboarded.
- bKash or bank transfer with transaction reference recorded against the referral.

**Outcome incentive**

- **৳15,000–৳25,000 post-visa bonus**, determined by the destination schedule in the signed partner agreement.
- Pay only after documented visa issuance and the applicable milestone is verified.

**Confidence and convenience stack**

- Named counselor and escalation contact.
- Shared status updates at acceptance, document completion, application/offer, visa submission, and outcome.
- Monthly partner statement: referrals, stage, paid amount, next milestone.
- Free profile-screening clinic or overseas-career seminar at the partner center, subject to agreed capacity.
- Ready-to-use student handoff form and consent text.

**Risk reversal**

- If Keystone accepts and onboards a qualified referral but misses the 24-hour first-payment SLA, the case is escalated to the founder and the outstanding payment remains immediately due.
- If a student is rejected at screening, the center receives a short factual reason; no payout is triggered.
- No visa or admission guarantee, fabricated urgency, or unverified success-rate claim is permitted.

### 3.5 Qualification and payout rules

Put these definitions in the signed agreement before launch:

1. A **qualified referral** is a real prospective student introduced with consent, reachable on a valid number, seeking a supported destination/program, and supplying enough truthful information for initial screening.
2. **Accepted and onboarded** means Keystone has confirmed eligibility, created the case record, assigned a counselor, and obtained the student’s acknowledgement/consent. A name or phone-number drop alone does not trigger payment.
3. The CRM timestamp of the first consented introduction determines referral ownership. Pre-existing active leads and duplicate referrals must be disclosed before acceptance.
4. The post-visa amount follows the destination schedule in the current signed agreement; no caller may improvise an amount.
5. Fraudulent identity, falsified documents, withdrawn consent, or duplicate cases pause the milestone pending review.
6. Every payout must carry referral ID, trigger, date, amount, method, and transaction reference.
7. Partner commission terms are confidential internal/commercial terms and must not be published on customer-facing pages, metadata, or schema.

### 3.6 Sales language

**One-line hook**

> “স্যার/ম্যাম, যে স্টুডেন্ট IELTS স্কোর, স্টাডি গ্যাপ বা প্রসেসিং সাপোর্টের কারণে আপনার সেন্টার থেকে বের হয়ে অন্য এজেন্সিতে চলে যায়—Keystone সেই ছাত্রকে আপনার রেফারেল হিসেবেই হ্যান্ডেল করবে, আর আপনার টিমকে ফাইল প্রসেস না করিয়েই দুই ধাপে পেমেন্ট করবে।”

**30-second offer**

> “আমি Keystone Overseas, ধানমন্ডি থেকে বলছি। আপনারা ট্রেনিংয়ে ফোকাস করবেন; ভর্তি ও ভিসা কেস আমরা হ্যান্ডেল করব। আপনার সম্মতিতে পাঠানো qualified student আমরা accept ও onboard করলে ২৪ ঘণ্টার মধ্যে ৳২,০০০ bKash/ব্যাংকে, আর visa issue হলে destination অনুযায়ী আরও ৳১৫,০০০–৳২৫,০০০। প্রতিটি milestone tracker-এ থাকবে। কোনো visa guarantee নয়, কোনো processing workload-ও আপনাদের নয়। আমি কি এক পাতার terms পাঠিয়ে ১০ মিনিটের director call ঠিক করতে পারি?”

**Permission-based WhatsApp follow-up**

> আসসালামু আলাইকুম [Director Name] স্যার/ম্যাম। ফোনে অনুমতি দেওয়ার জন্য ধন্যবাদ। Keystone Overseas-এর partner model: (১) qualified referral accept ও onboard হলে ২৪ ঘণ্টার মধ্যে ৳২,০০০, (২) documented visa issue হলে destination অনুযায়ী ৳১৫,০০০–৳২৫,০০০, (৩) processing, documentation coordination ও status update Keystone-এর দায়িত্ব। এটি visa guarantee নয়; সব milestone লিখিত agreement ও tracker অনুযায়ী। ১০ মিনিটের review call-এর জন্য [দুইটি সময়]—কোনটি সুবিধাজনক?

### 3.7 Objection handling

| Objection | Response |
|---|---|
| “পরে টাকা পাব তো?” | “প্রথম ৳২,০০০ visa পর্যন্ত অপেক্ষা করে না; qualified referral accept/onboard হওয়ার ২৪ ঘণ্টার SLA, transaction reference ও tracker entry থাকবে। Post-visa amount-ও written schedule অনুযায়ী।” |
| “আমরা processing করতে চাই না।” | “সেটাই offer-এর মূল কথা—আপনারা শুধু consented warm introduction দেবেন। Screening থেকে case coordination Keystone-এর।” |
| “Student reject হলে reputation নষ্ট হবে।” | “আমরা আগে profile screen করি, unsupported promise দিই না, এবং acceptance/decline reason লিখিত রাখি। Institution বা visa authority-এর সিদ্ধান্তকে guarantee বলা হবে না।” |
| “আমার student কে নিয়ে নেবেন?” | “Referral source CRM-এ locked থাকবে, updates আপনার center-কে যাবে, এবং payout trail referral ID-তে থাকবে। Student consent ও privacy সীমা বজায় থাকবে।” |
| “এখন সময় নেই।” | “আমি ১-পেজ terms পাঠাই; শুধু ১০ মিনিটে payout trigger, duplicate rule আর handoff দেখে সিদ্ধান্ত নিন।” |

## 4. Outreach operating system

### 4.1 Human-led sequence

**Day 0 — verification and call**

- Confirm center name, director/manager, business phone, district, and `fb_activity_evidence`.
- Call once during business hours. Ask permission before sending WhatsApp material.
- Record disposition immediately: `CONNECTED`, `GATEKEEPER`, `NO_ANSWER`, `WRONG_NUMBER`, `INTERESTED`, `NOT_INTERESTED`, or `DO_NOT_CONTACT`.

**Day 0 — permitted follow-up**

- Send the one-page offer only after permission or a clear business-context invitation.
- Offer two specific 10-minute meeting windows.

**Day 2 — value follow-up**

- If there is no reply and no suppression, send one short, individualized clarification: payout trigger, zero-processing handoff, or seminar option.

**Day 5 — close the loop**

- Ask for a yes/no on a pilot referral or agreement review.
- If no response, stop the sequence and schedule a later manual review; do not create an endless automated cadence.

**On any reply**

- Pause automation immediately.
- A human classifies intent, handles objections, and sets the next action.

### 4.2 Mandatory controls

- Central `do_not_contact` and suppression reason across phone, WhatsApp, and email.
- Human approval before every first contact.
- Organization and normalized-phone deduplication.
- Business-hour/quiet-hour rules and per-organization frequency caps.
- Official APIs/business accounts only; no personal-account automation, CAPTCHA bypass, proxy rotation, or platform-limit evasion.
- Minimum necessary business data only; do not harvest unrelated personal-profile information.
- Store source, reviewer, message version, channel, timestamp, outcome, and opt-out event.
- Require an independent Bangladesh legal/privacy review before scaling; software controls are not proof of legal compliance.

## 5. Open-source GitHub architecture intelligence

### 5.1 Recommended modular architecture

```text
verified call sheet / consented inbound leads
                 |
                 v
         Twenty CRM (canonical record)
                 |
                 v
  eligibility + suppression + duplicate gate
                 |
                 v
 Activepieces Community (tasks, approvals, sync)
                 |
      human approves first contact
                 |
                 v
  official channel/provider or call task
                 |
                 v
 replies / bounces / opt-outs / outcomes
                 |
                 +------> CRM + suppression ledger

 Optional after need is proven:
 - listmonk: permissioned follow-up/newsletters only
 - Chatwoot: shared inbound reply inbox
```

| Project | Role | Why it fits | Boundary |
|---|---|---|---|
| [Twenty](https://github.com/twentyhq/twenty) | Canonical organizations, contacts, opportunities, custom compliance fields | Modern CRM, APIs, self-hosting, custom objects/workflows | Mostly AGPLv3 with mixed-license areas; review before deep customization |
| [Activepieces](https://github.com/activepieces/activepieces) | Validation, dedupe, review tasks, event sync, retries | Open-source community core, versioned flows, worker/queue architecture | Some enterprise directories/features are commercial; model approval explicitly in CRM if needed |
| [listmonk](https://github.com/knadh/listmonk) | Permissioned list management and campaigns | Double opt-in, unsubscribe/blocklist, bounce and preference controls | Not a CRM or lead harvester; never treat a scraped list as permissioned |
| [Chatwoot](https://github.com/chatwoot/chatwoot) | Shared inbound conversation routing | Consolidates supported inbox channels and human ownership | Add only when reply volume warrants it; community/enterprise licensing differs |
| [Postal](https://github.com/postalserver/postal) | Self-hosted SMTP transport | Delivery events, bounces, DNS checks | Defer: deliverability, abuse handling, DNS reputation, and upgrades create avoidable phase-one risk |

**Decision:** start with Twenty as the source of truth plus a human call queue. Add Activepieces when repeatable import, approval, and status-sync work justifies orchestration. Add listmonk only for opted-in/permissioned lifecycle follow-up, and Chatwoot only when inbound volume needs team routing.

### 5.2 Simpler alternative: Mautic

[Mautic](https://github.com/mautic/mautic) is the strongest single-application alternative. It combines contacts, forms, segmentation, scoring, campaigns, preferences, and reporting. Its preference model supports per-channel do-not-contact state, frequency limits, pauses, and unsubscribe handling.

Choose Mautic when one application and simpler operations matter more than component separation. Do not let Mautic and Twenty become competing systems of record. If both are ever used, Twenty remains canonical, Mautic stores the immutable Twenty contact ID, and suppression updates synchronize in both directions.

### 5.3 Licensing and product caveats

- [n8n](https://github.com/n8n-io/n8n) is useful but its own materials describe it as fair-code/source-available; do not present it as strict OSI-style open source. Prefer Activepieces Community if an open-source core is a hard requirement.
- Twenty and Chatwoot contain community and commercial-license boundaries; check the exact files/features before modifying or redistributing.
- AGPL components such as Twenty’s community code and listmonk require a deployment and modification review with qualified counsel.
- Adoption signals such as GitHub stars are not architecture requirements. Maintenance, security updates, data ownership, and operator capacity matter more.

### 5.4 Minimum CRM data contract

- `organization_id`, legal/display name, district, business category
- contact name/role and verified business channel
- source URL/type, collected date, verified date, provenance note
- Facebook status, page URL, evidence, evidence quality, visible activity date
- contact basis, reviewer, review timestamp, approved channel
- `do_not_contact`, suppression reason/date/source
- last contact, touches in 30 days, reply state, next action
- referral ID, acceptance/onboarding timestamps, counselor, milestones
- payout trigger, amount, due date, paid date, method, transaction reference
- immutable event/idempotency ID for imports, sends, replies, opt-outs, and payouts

A CSV re-import must never clear a suppression flag, change referral ownership, or overwrite a newer contact preference.

## 6. Measurement and management

### 6.1 Funnel metrics

Track by operator, district, Facebook segment, and week:

- attempted calls and valid business connections;
- director conversations / connected calls;
- permission-to-send rate;
- agreement-review meetings booked;
- signed partner rate;
- accepted qualified referrals per signed partner;
- 24-hour first-payment SLA attainment;
- post-visa payout SLA attainment;
- duplicate, invalid, complaint, and opt-out rates;
- active partners producing at least one accepted referral in 30 days.

Do not optimize for raw sends, scraped contacts, open pixels, or sequence volume. Optimize for qualified conversations, accepted referrals, payout reliability, and durable partners.

### 6.2 Initial pilot gates

Run a 20-center pilot from Tier A before scaling. Expand only if all gates pass:

- 100% of first touches had human approval;
- 100% of opt-outs were suppressed across every channel;
- no duplicate message caused by workflow retry;
- every accepted referral has consent, source, owner, and qualification evidence;
- every due first payment is made within the promised SLA;
- all claims used by callers are supported and no visa guarantee was made.

## 7. 30-day execution plan

**Days 1–3**

- Import the enriched CSV into the canonical CRM.
- Configure organization/phone dedupe, suppression, review status, referral, and payout fields.
- Manually inspect the top 20 active-page records and assign one caller.
- Approve one message version and one call script.

**Days 4–10**

- Run the 20-center human-reviewed pilot.
- Hold daily 15-minute disposition review.
- Fix objections, qualification language, and handoff friction before adding volume.

**Days 11–20**

- Advance interested centers to agreement review.
- Test one real referral end to end: consent, acceptance, counselor assignment, 24-hour payment, updates, and partner statement.
- Add automation only for task creation, reminders, and event logging.

**Days 21–30**

- Review conversion, complaints, suppression, duplicates, and payout SLA.
- Expand to the remaining active and dormant records only if pilot gates pass.
- Prioritize `NO_PAGE` records using verified WhatsApp/business identity and district strategy, not the absence of a Facebook URL.

## 8. Primary-source references

- [Twenty repository](https://github.com/twentyhq/twenty), [license](https://github.com/twentyhq/twenty/blob/main/LICENSE), and [app concepts](https://github.com/twentyhq/twenty/blob/main/packages/twenty-docs/developers/extend/apps/getting-started/concepts.mdx)
- [Activepieces repository](https://github.com/activepieces/activepieces), [license explanation](https://github.com/activepieces/activepieces/blob/main/docs/about/license.mdx), [architecture](https://www.activepieces.com/docs/install/architecture/overview), and [workers](https://www.activepieces.com/docs/install/architecture/workers)
- [Mautic repository](https://github.com/mautic/mautic), [campaign builder](https://docs.mautic.org/en/7.2/campaigns/campaign_builder.html), [contact imports](https://docs.mautic.org/en/7.2/contacts/import_contacts.html), and [preference center](https://docs.mautic.org/en/7.0/contacts/preference_center.html)
- [listmonk repository](https://github.com/knadh/listmonk), [concepts](https://listmonk.app/docs/concepts/), and [subscriber API](https://listmonk.app/docs/apis/subscribers/)
- [Chatwoot repository](https://github.com/chatwoot/chatwoot) and [inbox documentation](https://www.chatwoot.com/hc/user-guide/articles/1677492191-adding-inboxes)
- [Postal repository](https://github.com/postalserver/postal)
- [n8n repository](https://github.com/n8n-io/n8n) and [license](https://github.com/n8n-io/n8n/blob/master/LICENSE.md)

## 9. Artifact map

- `b2b_call_sheet_enriched.csv` — row-level classifications, canonical page metadata, evidence, confidence, and audit date.
- `b2b_facebook_audit_summary.json` — totals, evidence-quality counts, UTC cutoff/check times, and methodology note.
- `verify_facebook_liveness.py` — repeatable conservative verifier; full-run default and partial-output guard.
- `github_outreach_architecture_research.md` — primary-source research notes supporting the architecture section.

