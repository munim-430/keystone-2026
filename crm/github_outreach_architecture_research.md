# Open-Source Outreach and Lead-Generation Architecture Research

**Prepared for:** Keystone Overseas  
**Research snapshot:** 2026-10-03  
**Scope:** Reusable systems for controlled B2B prospecting, lead capture, permissioned follow-up, and reply handling. Sources are limited to official project repositories and first-party documentation.

## Executive recommendation

For Keystone Overseas, the strongest design is a **modular, auditable stack**:

```text
permissioned/imported business leads
  -> CRM system of record
  -> eligibility and suppression gate
  -> human review of first contact
  -> approved channel/provider
  -> replies, bounces, opt-outs, and outcomes synced back to CRM
```

The leading implementation pattern is **Twenty + Activepieces Community + a managed email provider**, adding **listmonk only for opted-in or otherwise permissioned follow-up** and **Chatwoot only if a shared multichannel reply inbox becomes necessary**. Mautic is the best single-application alternative when operational simplicity matters more than clean separation of responsibilities.

Automation should prepare, review, route, and log outreach. It should not harvest personal profiles, auto-send indiscriminate cold sequences, or evade platform limits.

## Primary-source shortlist

Stars are approximate as of the research date and are only an adoption signal. Release recency, licensing, operational fit, and safety controls matter more.

| Project | Reusable role | Adoption and maintenance signal | License boundary | Assessment |
|---|---|---|---|---|
| [Twenty](https://github.com/twentyhq/twenty) | CRM source of truth: organizations, contacts, opportunities, custom compliance fields, workflows, API integrations | ~57.8k stars; [`twenty/v2.44.0`](https://github.com/twentyhq/twenty/releases/tag/twenty/v2.44.0) released 2026-10-01; active repository | Mostly AGPLv3, with commercial-marked files and some MIT packages; see the [official license](https://github.com/twentyhq/twenty/blob/main/LICENSE) | Best modern CRM foundation, provided deployment stays patched and the team reviews the mixed-license boundary before customization |
| [Activepieces](https://github.com/activepieces/activepieces) | Workflow/orchestration: validation, deduplication, review tasks, event sync, retries | ~24.9k stars; [`0.92.1`](https://github.com/activepieces/activepieces/releases/tag/0.92.1) released 2026-09-30; active repository | MIT community core; enterprise directories are commercial, per the [official explanation](https://github.com/activepieces/activepieces/blob/main/docs/about/license.mdx) | Best open-source-core workflow layer; build approval as an explicit CRM state unless licensed approval features are adopted |
| [Mautic](https://github.com/mautic/mautic) | All-in-one lead capture, contacts, forms, segmentation, scoring, campaigns, preferences, and reporting | ~10.7k stars; [`7.2.1`](https://github.com/mautic/mautic/releases/tag/7.2.1) released 2026-09-23; active repository | GPLv3; see the [official license](https://github.com/mautic/mautic/blob/7.x/LICENSE.txt) | Best single-deployment option; mature controls, but heavier and less modular than the recommended stack |
| [listmonk](https://github.com/knadh/listmonk) | High-throughput list management and email campaigns for permissioned audiences | ~23.7k stars; [`v6.2.0`](https://github.com/knadh/listmonk/releases/tag/v6.2.0) released 2026-06-26; active repository | AGPLv3; see the [repository license statement](https://github.com/knadh/listmonk#license) | Excellent delivery/list component, but not a CRM, prospect discovery engine, or justification for unsolicited bulk sending |
| [Postal](https://github.com/postalserver/postal) | Self-hosted SMTP transport, delivery events, bounce handling, and DNS checks | ~16.8k stars; [`3.3.7`](https://github.com/postalserver/postal/releases/tag/3.3.7) released 2026-06-03; active repository | MIT; see the [official license](https://github.com/postalserver/postal/blob/main/LICENSE) | Capable transport layer, but self-hosted mail creates substantial DNS, deliverability, abuse, and upgrade responsibilities; not recommended for Keystone's first phase |
| [Chatwoot](https://github.com/chatwoot/chatwoot) | Shared reply inbox across email, website, WhatsApp, Facebook, SMS, and other supported channels | ~37.4k stars; [`v4.18.0`](https://github.com/chatwoot/chatwoot/releases/tag/v4.18.0) released 2026-09-18; active repository | Community code is MIT, while `enterprise/` is separately licensed; see the [repository](https://github.com/chatwoot/chatwoot) and [enterprise license](https://github.com/chatwoot/chatwoot/blob/develop/enterprise/LICENSE) | Useful after reply volume requires team routing; it should receive inbound conversations, not originate unreviewed campaigns |

## Architecture 1: modular and auditable (recommended)

### Component responsibilities

1. **Twenty is canonical.** Store each organization, director/contact, source URL, collection date, Facebook-liveness result, owner, intended channel, contact basis, review status, suppression status, touch history, and next action. Twenty's official repository describes its stack as PostgreSQL, Redis/BullMQ, NestJS, and React and supports custom objects, workflows, APIs, and self-hosting ([repository](https://github.com/twentyhq/twenty)). Its app model can add custom objects and server-side logic with API-level permissions and sandboxed execution ([app concepts](https://github.com/twentyhq/twenty/blob/main/packages/twenty-docs/developers/extend/apps/getting-started/concepts.mdx)).

2. **Activepieces is the integration bus.** Use it to validate imports, normalize business phone numbers, deduplicate records, create review tasks, synchronize suppression events, and write delivery outcomes back to Twenty. Its production architecture separates app, workers, sandboxed execution, PostgreSQL, and Redis/BullMQ; queue-backed jobs can be replayed after worker failure ([architecture overview](https://www.activepieces.com/docs/install/architecture/overview), [worker model](https://www.activepieces.com/docs/install/architecture/workers)). The Community Edition supports versioned flows, retries, branches, and human-input building blocks ([official README](https://github.com/activepieces/activepieces/blob/main/README.md)).

3. **A human approves the first contact.** The workflow may create a call task or individualized draft, but sending remains blocked until a reviewer changes `review_status` from `PENDING` to `APPROVED_TO_CONTACT`. This state transition should record the reviewer and timestamp.

4. **Use listmonk only after eligibility is established.** It supports double-opt-in lists, unsubscribed states, a global blocklist, bounce processing, and preference/unsubscribe URLs ([concepts](https://listmonk.app/docs/concepts/), [subscriber API](https://listmonk.app/docs/apis/subscribers/), [templating](https://listmonk.app/docs/templating/)). Its docs also note the privacy implications of open/click tracking and support anonymous tracking. These controls make it suitable for permissioned follow-up and newsletters, not for turning scraped leads into a bulk cold-email list.

5. **Feed every outcome back to the CRM.** Bounce, complaint, unsubscribe, invalid number, objection, reply, appointment, and partnership outcome events must update the canonical contact record. A suppression event must win over every scheduled action.

6. **Add Chatwoot only when needed.** Chatwoot models channel instances as inboxes and routes conversations to agents across email, WhatsApp, Facebook, SMS, and other supported channels ([first-party inbox documentation](https://www.chatwoot.com/hc/user-guide/articles/1677492191-adding-inboxes)). Its best use here is consolidating inbound replies and preserving context for human operators.

### Suggested minimum data contract

Every contactable record should include:

- `organization_id`, `organization_name`, district, and business category
- business contact name/role and verified business channel
- `source_url`, `source_type`, `collected_at`, and `verified_at`
- `contact_basis` and a short factual note supporting it
- `facebook_liveness_status` and last observed activity date
- `review_status`, `reviewed_by`, and `reviewed_at`
- `do_not_contact`, `suppression_reason`, and `suppressed_at`
- `last_contact_at`, `contact_count_30d`, `reply_status`, and `next_action_at`
- immutable event IDs for imports, reviews, sends, replies, bounces, and opt-outs

Use an organization-level deduplication key plus normalized phone/email keys. Never let a CSV re-import clear a suppression flag or overwrite a newer contact preference.

## Architecture 2: Mautic all-in-one

Mautic is the simpler alternative when Keystone wants one operational application rather than a CRM, workflow engine, and list manager.

Its Campaign Builder accepts segments or forms as sources and composes conditions, decisions, and actions ([campaign documentation](https://docs.mautic.org/en/7.2/campaigns/campaign_builder.html)). Its forms are expressly designed for lead generation and data collection ([forms documentation](https://docs.mautic.org/en/7.2/components/forms.html)), while CSV imports retain import history and support background processing ([import documentation](https://docs.mautic.org/en/7.2/contacts/import_contacts.html)).

The principal safety advantage is that contact preferences are part of the product model. Mautic supports per-channel Do Not Contact status, channel and frequency preferences, pauses, categories, and segment opt-outs ([Preference Center](https://docs.mautic.org/en/7.0/contacts/preference_center.html)). Its settings include global frequency caps, monitored bounce and unsubscribe inboxes, preference pages, and unsubscribe handling ([configuration](https://docs.mautic.org/en/7.2/configuration/settings.html)).

Choose Mautic when:

- one application and one contact model are more important than component specialization;
- Keystone wants forms, scoring, segmentation, and permissioned campaigns immediately; and
- the team can operate its PHP application, database, queues/cron tasks, upgrades, and mail integration.

Do not deploy Mautic and Twenty as competing systems of record. If both are used, Twenty remains canonical, Mautic stores the immutable Twenty contact ID, and suppression changes synchronize in both directions.

## Optional event-driven alternative: Dittofeed

[Dittofeed](https://github.com/dittofeed/dittofeed) provides API/Segment ingestion, segmentation, broadcasts, and event-triggered journeys across multiple channels. It is a reasonable lifecycle-messaging engine after an inquiry, opt-in, webinar registration, or active sales conversation. It is not a prospect-harvesting system and should not be used to initiate scraped cold sequences.

The project is MIT-licensed ([license](https://github.com/dittofeed/dittofeed/blob/main/LICENSE)), but its maintenance signal is weaker than the core shortlist: the latest stable release observed was [`v0.23.0`](https://github.com/dittofeed/dittofeed/releases/tag/v0.23.0) on 2025-12-01, followed by 0.24 alpha releases through 2026-03-28. Treat it as a later pilot rather than the Keystone default.

## Licensing caveat: n8n is not strict open source

[n8n](https://github.com/n8n-io/n8n) is popular and actively maintained, but its own README calls it **fair-code** and **source available**. Most of the product uses the Sustainable Use License, while enterprise-designated files require a separate license ([official license](https://github.com/n8n-io/n8n/blob/master/LICENSE.md), [official README](https://github.com/n8n-io/n8n/blob/master/README.md)). It should not be presented as an OSI-style open-source choice. Prefer Activepieces Community when an open-source core is a hard requirement.

## Mandatory safety and compliance controls

These are architecture requirements, not optional campaign settings:

1. **Provenance before contact.** Store where each business contact came from, when it was collected, what was verified, and why the intended channel is appropriate.
2. **Human-reviewed first touch.** Create a task or draft; do not automatically send the first message to a newly discovered prospect.
3. **Central suppression service.** A reply asking not to be contacted, unsubscribe, complaint, invalid address, or internal exclusion must immediately stop every workflow and channel.
4. **Frequency and quiet-hour limits.** Apply organization- and person-level caps before provider/channel limits are considered.
5. **Channel-policy enforcement.** Use official APIs and approved business accounts. Do not automate browser sessions or personal accounts to circumvent platform rules.
6. **Data minimization.** Keep relevant business-contact facts; do not collect unrelated personal-profile data. Encrypt credentials, restrict roles, and define retention/deletion periods.
7. **Privacy-minimized analytics.** Prefer replies, appointments, qualified opportunities, and signed partnerships over invasive open tracking. Disable or anonymize tracking when it is unnecessary.
8. **Auditability.** Preserve source, reviewer, message/version, channel, timestamp, outcome, and suppression changes. Retryable workflows must use idempotency keys to prevent duplicate sends.
9. **Human takeover on engagement.** Any reply pauses automated follow-up until an operator classifies it.
10. **Independent legal review.** Product features are controls, not proof that a campaign is lawful. Validate Bangladesh requirements and any destination-market rules before launch.

Explicitly exclude personal-profile scraping, CAPTCHA bypass, proxy or account rotation, inbox-warming networks, fake identities, purchased personal lists, automatic connection requests, and tactics intended to defeat rate limits or platform enforcement.

## Keystone rollout decision

Start with a **controlled pilot**, not a bulk system:

1. Import the verified B2B call sheet into one canonical CRM with provenance and suppression fields.
2. Deduplicate at organization and channel level.
3. Route a small batch to human reviewers and create call tasks or individualized drafts.
4. Record replies and objections before enabling any follow-up automation.
5. Add permissioned follow-up through Mautic or listmonk only after suppression synchronization is tested end to end.
6. Add Activepieces when repeatable imports, approvals, and event synchronization justify an orchestration layer.
7. Add Chatwoot only when inbound volume requires shared routing.

This sequence gives Keystone the useful parts of open-source outreach architecture—data ownership, repeatable workflow, auditability, and measurable outcomes—without building a spam-enablement pipeline.
