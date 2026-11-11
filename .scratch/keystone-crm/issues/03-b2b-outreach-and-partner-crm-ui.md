# 03 B2B Outreach & Partner CRM UI

Type: prototype
Status: resolved
Blocked by: 01, 02

## Question

How will the caller UI present the B2B coaching center cards, district filters, 1-click dialer, objection scripts, notes modal, and referral tracking for the 3 daily callers?

## Answer

Delivered and verified in `keystone-2026/crm` (`index.html`, `app.js`, `styles.css`) across both Focus Mode and Grid View:

1. **Focus Mode (Single-Lead Ergonomics)**:
   - Dynamic single-card view rendering lead status, district, large telephone number display, and direct `tel:` protocol dialer.
   - 1-click WhatsApp button triggering pre-filled respectful Bangla partnership proposal (`wa.me`) targeting coaching center directors.
   - 1-click status classification buttons: `🔥 আগ্রহী (Eager)`, `📞 ফলোআপ (Callback)`, `❄️ আগ্রহ নেই (Cold)`, `🤝 পার্টনার (Partnered)`.
   - 1-tap Bengali Quick Note Chips (`💬 হোয়াটসঅ্যাপে পাঠালাম`, `⏰ বিকেলে কল`, `📅 কাল সকালে কল`, `🎓 স্টুডেন্ট আছে আগ্রহী`, `👔 মালিকের সাথে কথা হবে`, `❌ নম্বর বন্ধ/রিং হয়নি`).
   - Interactive student counter stepper (`-` / `+`) tracking student referral potential.
   - Comprehensive call history timeline for individual centers.

2. **Caller Territory Hub Distribution**:
   - `CALLER_1`: Eastern Hub (288 centers across Sylhet, Cumilla, Noakhali, Mymensingh, etc.)
   - `CALLER_2`: Northern Hub (290 centers across Rajshahi, Bogura, Rangpur, Dinajpur, etc.)
   - `CALLER_3`: Southern Hub (281 centers across Khulna, Kushtia, Jashore, Barishal, Faridpur, etc.)
   - `ALL`: Complete 49-district national directory (859 centers).

3. **In-App Objection Handling & Script Drawer**:
   - Accessible via `#openScriptBtn` (`📖 কলিং স্ক্রিপ্ট ও গাইড`).
   - Comprehensive Bengali director-to-director scripts, value propositions (৳2,000 upfront referral + ৳15k–৳25k visa bonus), and handling for top 6 objections (study gap, zero IELTS, financial solvency, mistrust, commission timelines).

4. **Live Cloud Integration**:
   - Direct two-way sync with Supabase PostgreSQL (`public.b2b_centers`).
   - Real-time notification toasts and animated status pill (`🟢 ক্লাউড: লাইভ`).
   - End-to-end verified via automated Playwright headless runner and REST inspection.
