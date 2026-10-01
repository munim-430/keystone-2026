# Keystone Overseas — Agent Guardrails & Domain Invariants

## 1. Domain & Brand Invariants
- **Brand Identity**: Strictly `Keystone Overseas`. The language training unit is `Keystone Language Academy` (or `Keystone Academy`). Never revert to legacy names.
- **Physical Headquarters**: `House 7, Mirpur Road, Sobhanbag, Dhanmondi, Dhaka, Bangladesh`.
- **Contact Channels**: 
  - Phone/WhatsApp: `+880 1941 646278` / `01941-646278` (E.164: `+8801941646278`, clean WhatsApp: `8801941646278`).
  - Inbound Email: `munim.m247@gmail.com`. The old address `info@keystoneeducations.com` is deprecated and must never be referenced.
- **Fee Confidentiality**: NEVER mention agency fees, consultancy service fees, file opening charges, or internal margins on any public webpage, meta tag, or schema. All customer-facing figures must represent direct university tuition bank wires or official statutory consular fees.
- **Office Exclusivity**: Zero references to Gazipur as an office, branch, campus, or desk. Gazipur may only appear as a student geographic origin district (e.g. "from Gazipur", "32 km to Dhanmondi HQ").

## 2. Technical & Routing Invariants
- **Nationwide Saturation**: Always maintain the 64-district matrix across all 8 divisions (`Dhaka`, `Chittagong`, `Sylhet`, `Rajshahi`, `Khulna`, `Barishal`, `Rangpur`, `Mymensingh`). Notice standard spelling `Barishal` (with an 'h').
- **SPA vs. Server Route Seam**: Any link pointing to `/districts` or programmatic SEO routes from the React SPA must use plain `<a>` tags (or `reloadDocument`) to prevent client-side routing hijacking.

## 3. Data Validation Standards
- **Bangladeshi Mobile Numbers**: Must match regex `r'(?:\+?880|0)?(1[3-9]\d{8})'`. Landlines (BTCL/PSTN) must be segregated from SMS/WhatsApp campaigns.

## 4. Multi-Agent Collaboration Protocol
- Agents must operate in alternating turns as defined in `CO_AGENT_PROTOCOL.md`.
- Shared state must be maintained in `.agent_sync/turn_state.json`.
- Agent 1 (Spec & Invariant Integrity Agent / Builder) implements and verifies specs.
- Agent 2 (Adversarial Boundary Auditor / Validator) stress-tests boundaries and holds veto power.
