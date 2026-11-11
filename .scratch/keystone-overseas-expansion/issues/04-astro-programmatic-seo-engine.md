# 04 - Production Website Overhaul & High-Speed Conversion Funnel

Type: task
Status: closed
Closed At: 2026-10-01
Blocked by: None

## Question
How should the live production website (`keystone-website_main` deployed at `https://www.keystoneeducations.com`) be overhauled to establish Keystone Overseas as the dominant study abroad consultancy and language academy in Dhanmondi, Dhaka—incorporating high-conversion corridors (Cyprus, Romania prep year, Malaysia, Hungary, Korea), strict fee privacy, Dhanmondi geo-coordinates, and zero-drop WhatsApp lead routing?

## Resolution
1. **Complete Brand & Identity Overhaul**:
   - Rebranded public brand to **Keystone Overseas** (Global Education & Academy).
   - Flagship address updated to `House - 5/4, Sobhanbag, Sobhanbag Road No. 16, Dhaka 1207, Bangladesh` with local geo-coordinates (`23.7533, 90.3769`).
   - Active contact email updated across all touchpoints to `munim.m247@gmail.com`.
   - Contact & WhatsApp line unified to `+880 1941 646278` (`01941-646278`).
   - Completely purged all traces of the Gazipur office from history, team bios, stats, and footer.
   - Strictly removed all public mentions of agency fees, file opening fees, and flat rates. Only foreign university tuition fees and statutory embassy fees remain visible.

2. **High-Converting Corridors Integrated**:
   - **Cyprus (EU)**: Direct CRMD entry permit (Blue Paper), zero IELTS mandatory, accepts study gaps up to 5–8 years, zero Indian transit.
   - **Romania (EU)**: Official 1-Year Preparatory Language Year (*Anul Pregătitor de Limba Română*, OME 5516/2024), zero IELTS, statutory tuition €2,200–€2,700/yr, digital Hague Apostille, authorized alternative consular submission bypassing India.
   - **Malaysia**: 95%+ visa ratio via EMGS, fast eVAL, affordable English-taught degrees.
   - **Hungary (Schengen)**: Full 29-nation Schengen access with direct in-person submission at VFS Global Dhaka (Gulshan-1).
   - **South Korea**: Founder insider guidance (9 years in Korea) and GKS scholarship preparation.
   - **Canada**: High-academic degree pathways and PGWP work permits.

3. **Keystone Language Academy Section**:
   - Injected dedicated **Keystone Language Academy** section on `Home.tsx` and in `Services.tsx` promoting physical Dhanmondi batches:
     - IELTS 6.5 Fast-Track (4–8 Week Intensive, small batches, daily speaking clinics).
     - European Prep & Consular Masterclass (Zero-IELTS visa interview coaching, Romanian basics, SOP clinic).
     - Korean Language & GKS Masterclass (Hangul fluency, TOPIK 1–2, D-2/D-4 interview drills).

4. **Zero-Drop WhatsApp Lead Routing**:
   - Upgraded `ConsultationForm.tsx` to automatically package candidate profile data (Name, Phone, Email, Education, Study Gap, IELTS status, Target Country, Message) and deep-link directly into WhatsApp (`https://wa.me/8801941646278?text=...`).
   - Upgraded `EligibilityChecker.tsx` to evaluate study gaps and zero-IELTS profiles against Cyprus and Romania.

5. **Expanded SEO & Schema Architecture**:
   - Generated expanded `public/sitemap.xml` with priority ranking for all 6 country corridors and academy routes.
   - Injected rich JSON-LD structured data (`EducationalOrganization`, `LocalBusiness`, `FAQPage`) targeting AI overviews and Dhaka local search.

6. **Production Deployment Verified**:
   - Built locally via Vite in 1.83s with zero TypeScript/compilation errors.
   - Deployed directly to production via Vercel CLI under project `keystone-website-main` linked to `munim430-ais-projects`.
   - Verified live at `https://www.keystoneeducations.com`.
