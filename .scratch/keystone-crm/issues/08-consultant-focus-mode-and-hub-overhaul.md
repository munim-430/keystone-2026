# Issue 08: Consultant Visual Ergonomics, Territory Hubs & Focus Mode Engine

## Summary
The 3 female telecallers starting outreach today experienced high cognitive load with the multi-district 859-center dense grid. This ticket delivers an intuitive, single-lead Focus Mode workflow with automated 3-way caller territory distribution, 1-click status transitions, instant WhatsApp message dispatch, and an in-app Bengali objection handling drawer.

## Key Changes Implemented
1. **Balanced 3-Way Caller Territory Hubs**:
   - `👩‍💼 কলার ১: ইস্টার্ন হাব (২৮৮)` (Cumilla, Feni, Noakhali, Sylhet, Mymensingh, etc.)
   - `👩‍💼 কলার ২: নর্দার্ন হাব (২৯০)` (Rajshahi, Bogura, Pabna, Rangpur, Dinajpur, etc.)
   - `👩‍💼 কলার ৩: সাউদার্ন হাব (২৮১)` (Khulna, Kushtia, Jashore, Barishal, Faridpur, etc.)
   - `🌐 সব সেন্টার (৮৫৯)` (Complete 49-district dataset)
2. **Dedicated Single-Lead Focus Mode (১টি করে কল মোড)**:
   - Visual progress counter & animated fill track (`সেন্টার ১ / ২৮৮ (০% সম্পন্ন)`).
   - Prominent large telephone display + native dialer trigger (`tel:`).
   - Instant WhatsApp dispatch button (`wa.me`) with pre-filled respectful Bengali partnership proposal.
   - 1-click status classification: `🔥 আগ্রহী (Eager)`, `📞 ফলোআপ (Callback)`, `❄️ আগ্রহ নেই (Cold)`, `🤝 পার্টনার (Partnered)`.
   - 1-tap Bengali Quick Note Chips (`💬 হোয়াটসঅ্যাপে পাঠালাম`, `⏰ বিকেলে কল`, `📅 কাল সকালে কল`, `🎓 স্টুডেন্ট আছে আগ্রহী`, `👔 মালিকের সাথে কথা হবে`, `❌ নম্বর বন্ধ/রিং হয়নি`).
   - In-card interactive student counter stepper (`-` / `+`).
   - Integrated call log history timeline for each individual center.
   - Smooth next-lead progression (`পরবর্তী সেন্টারে যান ➡️`).
3. **In-App Slide-In Bengali Calling Script & Objection Handling Drawer**:
   - Triggered via top navbar button: `📖 কলিং স্ক্রিপ্ট ও গাইড`.
   - Opening greeting pitch in natural Bengali.
   - Value proposition hooks (South Korea scholarships, revenue sharing per visa, direct Dhaka file management).
   - 4 battle-tested objection handling scripts (Already have an agency, only teach / don't send abroad, too busy, owner unavailable).
   - Essential lead qualification checklist.
4. **View Mode Toggle**:
   - `🎯 ফোকাস মোড (১টি করে)` (default, clean, distraction-free).
   - `📋 গ্রিড ভিউ` (bulk data browsing, 49-district filters, search, multi-limit pagination).
5. **Brand Compliance**:
   - Strict palette: `#0593C6` (Cerulean Cyan), `#FCFFFF` (Ice White), `#D83995` (Vivid Magenta).
   - Official Keystone logo integrated in top navbar.

## Verification
- Verified end-to-end in real Chrome DevTools via `browser` subagent (`93aade0e-32fc-4f05-b221-bc6ad91ee520`).
- All 5 QA suites passed:
  - Caller Hub switching and regional center filtering.
  - Focus mode phone dialer and WhatsApp URL generation.
  - Quick note chip insertion and history log persistence.
  - Metric counters real-time updates.
  - Script drawer open/close transitions.
  - Grid mode switching and state preservation.
