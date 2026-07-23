# Wayfinder Map — Malaysia Membership Platform: Go/No-Go & Build-Ready MVP Spec

> Label: `wayfinder:map` · Tracker: local markdown (no issue tracker configured — run `/setup-matt-pocock-skills` to move this to a real tracker; tickets below are child issues, blocking edges written as text)

## Destination

A **build-ready MVP spec** (provisional pricing, committed scope, compliance posture, launch validation plan) that a build effort can start from without anything left to decide — with the go/no-go converted to a **post-launch traction gate** per the founder's build-first decision.

## Notes

- Domain: B2B SaaS for Malaysian SMEs (F&B first), loyalty/membership, WhatsApp-first, PDPA-regulated.
- Founder context: solo, Next.js/Supabase, 3 yrs experience, no DevOps.
- Standing input: two desk-research docs in `/mnt/user-data/uploads/`, and the verification note [research-feasibility-verification.md](research-feasibility-verification.md) — every session should read the verification note first; it corrects several claims in the desk research.
- Skills to invoke per ticket type: `/grilling` + `/domain-modeling` for grilling tickets, `/research` for research tickets, `/prototype` for prototype tickets.
- Standing preference: decisions, not deliverables — this map ends at a spec, not at code.

## Decisions so far

- **MVP scope (T6) — MAP DESTINATION REACHED (11 Jul 2026)** — Spec grilled question-by-question and confirmed: see `MVP-SPEC.md`. Highlights decided in-session: cashier-scans-member via staff-mode URL; tenant-custom earning rule (N pts/visit or N pts/RM1, round down, no multipliers); one-time-QR in-store redemption; no passwords — phone number + WhatsApp login link + device session; dual enrolment (table/counter QR portal + peak-hour ghost-member capture by cashier); 3 launch themes with anti-sameness layout slots; WhatsApp-button + help-center support; Stripe; member portal trilingual (EN/中文/BM), admin EN-only; retention insights panel; Refash-inspired hero-card layout. Remaining open item: **T7 (member-portal prototype) — optional epilogue, founder to decide prototype-first vs first-build-milestone.** T2 + T8 transfer to the build effort's map.

- **Choose the business model: self-serve SaaS vs managed service (T1)** — Resolved: **self-serve with support**, per founder. Managed service ruled out (would make a solo founder a services company). Consequence accepted: this competes directly in Pixalink's lane, so differentiation must come from onboarding UX quality, not the feature list — spawned T9 and T10.
- **WhatsApp positioning (recorded during T1 discussion)** — WhatsApp is demoted from "first-class product" to a **thin utility-message rail** at MVP (enrolment confirmations, points updates, portal-link delivery at ~RM0.06/msg or free in service window). Marketing broadcasts are deferred to a post-MVP paid add-on with message costs passed through. This removes the dominant variable-cost risk flagged in the verification research.
- **Differentiation wedge vs Pixalink (T9)** — Resolved: the wedge is the **radical self-service motion** ("launch in 15 minutes, transparent pricing, no sales call"), which quote-driven incumbents can't copy without cannibalizing their sales funnel. Hard metric: time-to-first-member-enrolled < 15 min. *(Corrected during T10: the visual charm lives in the member-facing themes, not the admin UI — see next.)*
- **Provisional pricing (T5)** — Resolved: 30-day free trial (no card) → **Starter RM299/mo (1 outlet) · Growth RM399/mo (≤3 outlets)**, outlet-gated not member-gated, annual = 2 months free, **founding rate RM199/mo for life for the first 10 tenants**. Provisional until the T8 traction gate.
- **Validation strategy (re-scoping T2)** — Founder decision: **build-first**. Pre-build interviews skipped (no network; prefers momentum). Named risk accepted: pricing and willingness-to-pay stay unvalidated until launch — the MVP + transparent-pricing landing page becomes the market test, with the interview kit's thresholds (≥5 pilot commitments, median price ≥ RM299, ≥60% unaided setup) now serving as the **post-launch traction gate**. Go/no-go (T8) converts from a pre-build decision to that gate.
- **PDPA posture (T4)** — Resolved: DPA-in-ToS, bilingual auto-generated notices + consent capture, member export/delete, Supabase SG region + documented TIA, breach runbook at launch; DPO self-appointment deferred until ~20k aggregate members; data minimisation by design. Details: `research-pdpa-compliance-T4.md`.
- **Messaging rail (T3, revised during T6 grilling)** — MVP uses a **single platform-owned WhatsApp number**: platform's card, platform's Meta bill, cost baked into subscriptions with included quotas (**Starter 1,000 msgs/mo, Growth 3,000, top-up RM30/500**). This deletes tenant Meta-billing friction and removes the Tech Provider/Embedded Signup review from the launch critical path (only own-business verification + template approval needed). Tenant-owned numbers via Embedded Signup **return in V2** with marketing broadcasts (cafe identity, cafe pays). Original analysis: `research-whatsapp-rail-T3.md` — §2–3 now describe the V2 path, not MVP.
- **Onboarding structure & design system split (T10)** — Resolved: wizard uses **Variant A structure** (checklist + live preview); **admin CMS = clean/professional**; **member-facing UI = theme gallery** where tenants pick a theme and their logo/colors/content render inside it (true white-label, Linktree-style). The **HeyTea-aesthetic theme** (premium-playful minimalism, not cartoon doodle) is the flagship candidate. Launch with 3–5 themes on a gallery architecture; ~20 is the post-launch growth target and a marketing engine ("new theme drops"). Founder's prototype run: 1.5 min to member #1.

- **Redeem-on-confirm (build, ticket 5, 24 Jul 2026)** — Founder-directed reversal of MVP-SPEC §3's original "cashier scans → deduct." Points are now deducted **the moment the member confirms** a redemption, the code is valid **3 minutes** (was 60s), only **one live voucher per member** at a time, and an unclaimed/expired voucher is **not refunded**. Rationale: the confirm dialog is the true commitment; deducting up front prevents mis-operation by member or staff and closes gaming. Ledger consequence: `points_ledger.outlet_id` becomes nullable — a member confirming from their phone is at no outlet; the fulfilment outlet is still captured on `redemptions.claimed_outlet_id` at claim. `create_redemption` (new, atomic) does the check + deduct; `claim_redemption` no longer deducts, only marks used. **Security consequence (accepted):** without signed sessions (ticket 8), anyone who knows a phone can now spend that member's points remotely — previously an in-person staff scan was required, the property ticket 8's security note relied on. Bounded to demo tenants; ticket 8 (hard prerequisite before any real tenant) closes it.

---

## Open tickets

### ~~T1 — Choose the business model~~ *(grilling, HITL)* — **CLOSED, resolved**
**Answer:** Self-serve with support. See Decisions so far.

### ~~T9 — Differentiation wedge vs Pixalink for a self-serve product~~ *(grilling, HITL)* — **CLOSED, resolved**
**Answer:** Positioning statement: *"Launch your own branded membership program in 15 minutes — sign up yourself, transparent pricing, no sales call. Software that doesn't feel like enterprise software."* The wedge is the **radical self-service motion** (card sign-up, transparent pricing page, no human in the loop), which quote-driven incumbents structurally resist copying because it cannibalizes their sales-assisted funnel. The modern UI (doodle-style admin, sleek CMS dashboard) is the proof of the promise, not the promise — and in a white-label product it lives in the admin dashboard and marketing site, while the member portal disappears behind tenant branding. Hard metric: **time-to-first-member-enrolled < 15 minutes** (validated by T10, tested in T2). Known risk written into T2: the wedge fails if owners prefer sales-assisted setup.

### ~~T10 — Onboarding UX & education design~~ *(prototype, HITL)* — **CLOSED, resolved**
**Answer (from prototype session, founder verdict):** **Variant A — "Checklist & Canvas" — wins**: checklist-driven config on the left, live member-card preview on the right; the owner visualises their membership platform working as they select data. Founder completed the flow in **1.5 minutes** (real owners est. 5–10×, still inside the 15-min promise — the claim is printable). Two corrections captured: (1) the **admin CMS is clean and professional**, no illustration styling — the prototype over-applied the aesthetic to the admin frame; (2) "doodle style" = the **HeyTea app aesthetic** (premium-playful minimalism: white base, rounded cards, restrained cute illustration accents), and it belongs to the **member-facing UI as one theme in a theme gallery** (~20 themes as growth target; launch with 3–5, gallery architecture from day one). The wizard's finale (QR → owner enrols self as member #1 → elapsed time shown) is confirmed as the "you're live" moment. Prototype file: `prototype-onboarding-wizard.html` (throwaway — verdict captured here, safe to delete).

### T2 — Pilot validation with the live MVP *(task, HITL)* — **RE-SCOPED (was: pre-build interviews)**
**Question:** Founder decision (July 2026): skip pre-build interviews (zero network; prefers build-first) — the **MVP becomes the validation instrument**. Validation now means: landing page with transparent pricing live, then 20–30 cold approaches (walk-ins with the working product, F&B owner Facebook groups, Lowyat/local communities) offering a founding-tenant pilot. Success thresholds carry over from the interview kit: ≥5 concrete pilot commitments, median accepted price ≥ RM299, ≥60% complete setup unaided. The interview kit (`interview-kit-T2.md`) remains the script for those conversations — same questions, now with a real product in hand.
**Blocked by:** MVP launch (beyond this map's destination — this ticket transfers to the build effort's map).

### ~~T3 — Utility-message rail economics and BSP selection~~ *(research, AFK)* — **CLOSED, resolved**
**Answer:** **No BSP.** Integrate Meta's Cloud API directly and register the platform as a **Meta Tech Provider**; each tenant connects their own WhatsApp number via **Embedded Signup** ("Connect WhatsApp" button, ~90s, skippable at setup so it never blocks the 15-min promise). **Meta bills each tenant's own card for their messages — the platform's message cost is ~RM0**, and a wa.me deep-link QR (customer messages first) opens the free service window, making enrolment/welcome messaging free; out-of-window utility touches ≈ RM0.056/msg on the tenant's bill. Launch-critical path: Meta Business Verification + App Review (demo videos) — start early, it gates the Connect button. Mitigation for Meta churn: isolate messaging behind one internal interface so a BSP can be swapped in later. Full findings: `research-whatsapp-rail-T3.md`.

### ~~T4 — PDPA compliance posture as a data processor~~ *(research, AFK)* — **CLOSED, resolved**
**Answer:** Dual role: processor for tenants' member data, controller for tenant-account data. MVP must ship: **DPA baked into ToS** (incl. prompt breach-report clause — controllers notify, processors must be contractually bound to report), **bilingual (BM+EN) auto-generated privacy notice per tenant + consent capture at enrolment**, member **export/delete** (portability), **Supabase Singapore region + one documented Transfer Impact Assessment**, and a breach runbook (72h Commissioner / 7-day subject timelines). DPO duty triggers at >20k aggregate members or "regular and systematic monitoring" — founder self-appoints (must be BM+EN proficient, MY resident) and registers at daftar.pdp.gov.my within 21 days when thresholds near; track member count on the admin dashboard. **Data minimisation by design**: phone + optional name + birthday month only, nothing sensitive. Cash cost ≈ one lawyer review (RM2–5k); the bilingual auto-notice is a genuine selling point. Full checklist: `research-pdpa-compliance-T4.md`.

### ~~T5 — Provisional pricing and packaging~~ *(grilling, HITL)* — **CLOSED, resolved**
**Answer (provisional until the T8 traction gate):** **30-day free trial, no card.** Two tiers gated on **outlets, not member count** (never punish the product working): **Starter RM299/mo** (1 outlet, 3 themes, standard support) · **Growth RM399/mo** (up to 3 outlets, full theme gallery, priority support) · annual = 2 months free. **Founding-tenant offer:** first 10 tenants lock **RM199/mo for life** on Starter — real payment (counts as validation) + urgency for the pilot push. No message quotas (tenants pay Meta directly, per T3). Public wedge: transparent RM299 self-serve vs Simple Loyalty ~RM450 and Pixalink's quote-driven RM300–800 — clearest price, not cheapest.

### ~~T6 — MVP scope spec~~ *(grilling, HITL)* — **CLOSED, resolved — DESTINATION REACHED**
**Answer:** Full grilling completed (counter mechanic, earning rule, redemption, identity, enrolment paths, themes, support, messaging billing, Stripe, languages) and the assembled spec **confirmed by the founder on 11 July 2026**, including the review-added retention insights panel and the Refash-inspired member-portal layout (hero card with embedded QR + tier progress bar). The spec is the map's destination deliverable: **`MVP-SPEC.md`**.

### ~~T7 — Prototype: end-customer loyalty flow~~ *(prototype, HITL)* — **CLOSED, resolved (map complete)**
**Answer:** Two prototype rounds + design-essence research (`research-design-essence-T7.md`). Round 1 (3 taste variants) rejected as flagship — "too simple, too cartoonish"; its Cream & Stickers variant survives as **theme #2**. Round 2 (**"Atelier"**: photo-material card, stroke icons, serif accent, gold tier language, ritual microcopy — `prototype-member-portal-atelier.html`) **accepted as a theme** but honestly **not the founder's HeyTea-inspired flagship vision**, which remains an open *build-phase design task*: founder to collect 5–10 reference screenshots of the specific screens they love so the next design pass targets the actual vision. Layout, flows (redeem one-time QR, trilingual, count-up/journey copy) all validated and carried into the spec. Launch gallery working state: Atelier + Cream & Stickers + flagship-TBD.

### T8 — Post-launch traction gate *(grilling, HITL)* — **RE-SCOPED (was: pre-build go/no-go)**
**Question:** Per the build-first decision, the go/no-go moves after launch: within ~3 months of the pilot push (T2 re-scoped), does the business hit the gate — **≥5 paying founding tenants, median accepted price ≥ RM299, ≥60% unaided setup completion**? Hit → scale; miss on price → reprice; miss on adoption → revisit positioning or pivot. Resolves to: continue / adjust / stop, with reasons. This ticket transfers to the build effort's map along with T2.
**Blocked by:** T2 (re-scoped), which is blocked by MVP launch.

---

## Not yet specified (fog of war)

- **Tenant acquisition channel** — how the first 20 tenants are actually acquired (founder network, door-to-door, POS-vendor partnerships, content). Sharpens after T2 reveals where target owners actually are.
- **Member re-engagement without marketing broadcasts** — if the MVP has no promo blasts, what brings a lapsed member back (voucher expiry utility messages? merchant-side prompts?). Sharpens after T3 and T6.
- **Theme system depth** — how far tenants can customize inside a theme (logo/colors/content only, or fonts/layout too?), how themes are authored and QA'd against arbitrary tenant branding, and whether themes are a paid-tier lever. Sharpens during T6.
- **AI layer scope** — Doc A's V2 AI features (RAG assistant, campaign drafts, CSV mapping); worth revisiting only once MVP scope (T6) exists. Token costs verified immaterial.
- **Payments/billing rails** — Stripe vs Billplz/local FPX for subscription collection; sharpens after pricing (T5) decides billing cadence and currency handling.
- **Retail and services verticals** — Doc B ranks them second/third; revisit after F&B traction evidence exists.

## Out of scope

- Building the production platform itself — this map ends at a build-ready spec (a build effort would be a fresh map).
- **Managed-service model and its operations design** — ruled out by the T1 resolution (self-serve with support chosen); returns only as a fresh effort if self-serve fails validation.
- **Marketing broadcast tooling at MVP** — deferred by the WhatsApp decision; a post-MVP add-on effort.
- V3 features from Doc A (franchise/reseller model, multi-location, white-label mobile web) — beyond the destination.
- Competing for enterprise/chain accounts (10+ outlets with custom contracts) — different sales motion, ruled out of this effort.
