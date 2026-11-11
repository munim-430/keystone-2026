# Keystone Overseas — Domain Model & Glossary

This document serves as the canonical domain vocabulary for Keystone Overseas (formerly Keystone Education). It contains business and legal definitions only; implementation details belong in design specifications.

---

### Core Entities & Identity

- **Keystone Overseas**: The parent operating brand representing the international education consultancy, university placement pipeline, and global mobility services.
- **Keystone Academy**: The educational training wing based in the Dhanmondi physical facility. Conducts test-preparation (IELTS 6.5 Fast-Track) and European vocational language and cultural orientation classes.
- **Founder**: Hasibul Munim, managing director and primary student counselor (9 years resident experience in South Korea).
- **Candidate / Student**: An applicant seeking higher education or vocational study enrollment abroad.
- **B2B Partner / Language Center**: Independent coaching centers, IELTS institutes, and district language schools across Bangladesh that refer prospective students to Keystone Overseas under a revenue-share agreement.

---

### Corridors & Visa Regimes

- **Cyprus Corridor (Republic of Cyprus / South Cyprus)**: An EU-member study corridor where admissions and **Entry Permits (CRMD Blue Paper)** are processed directly by the university through the Civil Registry and Migration Department in Nicosia. Requires zero embassy travel to India and permits high study gaps without standardized IELTS.
- **Northern Cyprus Corridor (TRNC)**: High-speed, lower-cost tertiary study corridor with immediate acceptance and on-arrival visa processing via transit hubs.
- **Malaysia Corridor**: High-conversion Asian corridor utilizing the online **EMGS (Education Malaysia Global Services)** system for Visa Approval Letters (eVAL), finalized via the High Commission in Dhaka.
- **Romania Corridor**: European corridor focused on the **Preparatory Year (Anul Pregătitor de Limba Română)** and technical polytechnic diplomas issued under the Romanian Ministry of Education.
- **Hungary Corridor**: Full Schengen student corridor processed in Dhaka via the VFS Global application center (Nafi Tower, Gulshan-1), accepting Medium of Instruction (MOI) and study gaps with justification.
- **South Korea Flagship**: Premium study corridor focused on IEQAS-certified South Korean universities requiring formal bank solvency verification ($10,000 deposit).

---

### Financial & Fee Architecture

- **File Opening / Assessment Fee**: An upfront, non-refundable administrative and diagnostic charge (৳5,000 – ৳10,000) collected from the student upon original document submission.
- **B2B Referral Split**: The commission distributed to partner language centers consisting of two milestones:
  1. *Immediate Referral Incentive*: ৳2,000 paid immediately upon the referred student's file opening.
  2. *Visa Success Bonus*: ৳15,000 – ৳20,000 paid upon visa issuance and tuition settlement.
- **Post-Visa Success Fee**: The service fee (৳100,000 – ৳150,000) collected from the student or received as university commission following successful visa issuance.
- **Academy Tuition Fee**: Tuition charged directly to students enrolled in physical Dhanmondi classes (e.g., ৳3,500 – ৳5,000 for IELTS Fast-Track / European Prep).

---

### Technical & Marketing Concepts

- **Omni-Channel Lead Harvester**: Automated pipeline using open-source web scraping tools (Crawl4AI, Playwright-stealth) to identify active student inquiries from public social media groups and competitor posts.
- **Programmatic SEO (pSEO)**: Automated generation of thousands of static, ultra-fast localized search landing pages covering Bangladesh's 64 districts and specific study-gap / non-IELTS query permutations.
- **Study Gap**: The elapsed time between a student's last formal educational graduation (e.g. HSC, Diploma, Bachelor's) and their intended foreign intake date.
- **Medium of Instruction (MOI)**: Official institutional certificate verifying that previous secondary or tertiary education was conducted entirely in English, used in lieu of IELTS.
