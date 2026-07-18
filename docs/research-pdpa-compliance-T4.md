# Research: PDPA Compliance Posture (Wayfinder T4)

**Date:** 10 July 2026 · **Resolves:** T4 on WAYFINDER-MAP.md
**Question:** What exactly must this platform do to be PDPA-compliant as a multi-tenant membership SaaS — and what can be deferred?

## The platform wears two hats

- **Data processor** for each tenant's member data (the cafe is the data controller of its customers' data; the platform processes on its behalf). Since the 2024 Amendment, processors carry **direct statutory obligations** (Security Principle; DPO duty).
- **Data controller** for its own data: tenant accounts, billing, analytics. Full seven-principle obligations apply here directly.

## Compliance checklist

### 1. DPO — plan for it, founder can be it
Appointment is mandatory (from 1 June 2025) for controllers *and* processors that process personal data of **>20,000 data subjects**, sensitive data (which explicitly includes financial information) of **>10,000**, or whose processing involves **regular and systematic monitoring** of personal data. Aggregated member counts across tenants cross 20,000 fast (≈30 tenants × 700 members), and continuous points/visit tracking is arguably systematic monitoring — so assume the duty applies from early growth. Practical path: the founder self-appoints as DPO — requirements are Malaysian residency (≥180 days/yr) or easy contactability, **proficiency in both Bahasa Melayu and English**, and sound PDPA/IT-security knowledge (a Training & Competency Guideline of 21 July 2025 sets standards; outsourced DPO services exist as a fallback). Register the DPO at **daftar.pdp.gov.my within 21 days of appointment** and publish the DPO's business contact on the website and privacy notices.

### 2. Breach notification — build the runbook before launch
Controllers must notify the Commissioner as soon as practicable, with the guideline setting **72 hours** as the outer limit, where a breach causes/likely causes significant harm **or affects >1,000 individuals**; affected individuals within **7 days** of that notification when significant harm is likely. Notably, **processors are not directly responsible for notifying — controllers must bind processors by contract to report breaches promptly and assist**. Implication: the platform's Data Processing Agreement with every tenant must contain a prompt-breach-report clause (the platform reports to the cafe; the cafe notifies), *and* for the platform's own controller-hat data the 72-hour duty applies directly. Build: detection + logging (the countdown runs from the breach, so documented fast detection is what makes 72h achievable), a one-page response runbook, and the notification templates — before launch, not after.

### 3. Data Processing Agreement baked into the Terms of Service
Every tenant signup must accept a DPA covering: processing only on tenant instructions, the Security Principle measures, prompt breach reporting, assistance with data-subject requests, the **sub-processor list (Supabase, Vercel, Meta/WhatsApp)**, and deletion on termination. One standard clause set in the ToS — no negotiation at SME scale.

### 4. Bilingual notice and consent at member enrolment
The PDPA's notice requirement obliges notices in **both Bahasa Melayu and English**. The member enrolment screen (the QR flow) needs a short bilingual privacy notice per tenant plus a consent record (who, when, what version). Marketing consent must be separate from membership consent — and since promo broadcasts are deferred anyway, MVP only needs membership + transactional consent. **Product opportunity: auto-generate each tenant's bilingual notice from wizard data — a genuine "PDPA-ready out of the box" selling point no setup-it-yourself competitor makes this easy.**

### 5. Data-subject rights plumbing
Access, correction, and (since June 2025) **data portability** rights mean the platform should ship simple member-data export (CSV/JSON) and delete functions in the tenant admin from day one — trivial to build now, painful to retrofit, and they double as the tenant's own compliance tooling.

### 6. Cross-border transfers — pick the region deliberately
The old whitelist regime was replaced (CBPDT Guidelines, Apr 2025): before transferring personal data outside Malaysia, the controller must conduct and **document a Transfer Impact Assessment** evaluating whether the destination's framework is substantially similar to the PDPA; the Commissioner may request evidence at any time. Since Supabase/Vercel host outside Malaysia, this applies. Cheapest mitigation: **deploy Supabase in its Singapore region** — geographically close (low latency for MY users) and Singapore's PDPA regime makes the TIA straightforward — then write the one-page TIA once and file it. Vercel edge/compute and Meta (WhatsApp) go into the same assessment.

### 7. Registration of data users — likely not required, verify once
The pre-existing registration regime covers specified classes/sectors (banking, healthcare, tourism, direct selling, etc.). A horizontal loyalty SaaS is unlikely to fall in a registered class, and small F&B tenants generally aren't either — but verify against the Class of Data Users Order once before launch (30 minutes with the JPDP list).

### 8. Data minimisation by design — the cheapest compliance there is
Collect only phone number (identity), name (optional), and birthday month (rewards) from members. **Collect nothing sensitive** — no health, no financial profiles beyond point balances — which keeps the 10,000-subject sensitive threshold permanently irrelevant, shrinks breach blast radius, and simplifies every notice. Add a retention rule (auto-anonymise members inactive >24 months, configurable) to satisfy the Retention Principle.

## What this costs

Almost nothing in cash; mostly founder hours: DPO self-appointment + registration (a day, when thresholds near), DPA + bilingual notice templates (a few days once, ideally lawyer-reviewed ~RM2–5k as the only real spend), breach runbook (a day), TIA (a day), rights plumbing (normal feature work). Penalties for getting the principles wrong run to **RM1M / 3 years**, with personal director liability — so the review spend is justified.

## MVP scope implications (feeds T6)

Ship at launch: DPA-in-ToS, bilingual auto-generated privacy notice per tenant, consent capture at enrolment, member export/delete, Supabase SG region + documented TIA, breach runbook. Defer: DPO registration until member count approaches thresholds (track it on the admin dashboard), sector registration check (verify once, likely N/A).

### Sources
Hogan Lovells, Christopher & Lee Ong, Rajah & Tann, DLA Piper Privacy Matters, Securiti — analyses of the DPO Guideline and Data Breach Notification Guideline (25 Feb 2025, in force 1 June 2025); JPDP DPO Training & Competency Guideline (21 Jul 2025); GDPR Local Malaysia DPO guide (2026); Recording Law Malaysia PDPA compliance guide (2026, incl. TIA/CBPDT and registration regime); sibermate PDPA checklist (2026). Cross-checked against the earlier `research-feasibility-verification.md`.
