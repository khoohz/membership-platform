# MVP Spec — Malaysia Self-Serve Membership Platform

**Date:** 11 July 2026 · **Status:** Draft for founder confirmation (closes Wayfinder T6)
**Positioning:** *"Launch your own branded membership program in 15 minutes — sign up yourself, transparent pricing, no sales call. Software that doesn't feel like enterprise software."*

## 1. Pricing (provisional until traction gate)

30-day free trial, no card. **Starter RM299/mo** — 1 outlet, 3 themes, 1,000 WhatsApp messages/mo, standard support (≤1 business day). **Growth RM399/mo** — up to 3 outlets, full gallery, 3,000 messages/mo, priority (same-day target) support. Annual = 2 months free. Message top-up RM30/500. **Founding offer: first 10 tenants lock RM199/mo for life (Starter).** Public pricing page — no "contact us."

## 2. Product surfaces (5)

1. **Marketing site + pricing page** — the wedge made visible; transparent pricing, live demo card.
2. **Setup wizard** — Variant-A structure: checklist left, live themed member-card preview right. Steps: business info → branding (logo, colors, cover) → earning rule → first tier + first reward → go live (print QR, enrol yourself as member #1, elapsed-time moment). Clean professional design language. Target: <15 min to member #1.
3. **Admin CMS** — dashboard (members, points issued, redemptions), **retention insights panel** (repeat-visit rate, 30-day active members, new vs returning per month, avg visits per member, top redeemed rewards — the numbers that let an owner see the program working), member management (search by phone, view/adjust, export/delete), rewards & tiers editor, theme picker, QR poster generator (portal-URL QR, A5/A4 PDF), settings, WhatsApp-support button, message-quota meter, member-count tracker (PDPA DPO threshold watch).
4. **Staff mode** — mobile web page per outlet, PIN-protected, three actions: **scan member QR → award** (one tap per-visit, or numpad amount per-RM), **scan redemption QR → confirm**, **type phone number → bank points** (ghost-member capture for peak hour; system sends one WhatsApp invite).
5. **Member portal** — themed card (tenant brand inside theme): points balance, tier + progress, rewards list, redeem (generates one-time QR), transaction history. **Layout (Refash-inspired, founder reference 11 Jul 2026):** hero member card as a designed object — tenant cover/sticker layer, member name, points balance, and the **member QR embedded on the card** (zero taps to the earn moment) — then a **tier progress bar** immediately beneath ("N points to <next tier>"), then the rewards grid, then history. Trilingual: EN default / 中文 / BM. Long-lived device session; add-to-home-screen hint (bonus path, never relied on).

## 3. Core flows

- **Enrol (idle moment):** table/counter QR → portal → enter phone number → WhatsApp login link (utility msg) → card live. Bilingual PDPA notice + consent checkbox at this screen.
- **Enrol (peak moment):** cashier types phone in staff mode → points banked to ghost member → one WhatsApp invite → member claims later.
- **Earn:** member shows personal QR → cashier scans in staff mode → award per tenant's rule. Earning rule is tenant-configured with custom values: **N points per visit** or **N points per RM1** (friendly "1 point per RM__" input allowed); always round down; no multipliers/bonus rules at MVP.
- **Redeem:** member taps reward → **confirmation** → one-time QR (reward name in big text) → cashier scans → mark used, log. In-store only; no gifting, no combining. **Points are deducted at member confirm, not at the counter (revised 24 Jul 2026):** the confirm dialog is the commitment, the code is valid **3 minutes**, only **one live voucher per member** at a time, and an unclaimed/expired voucher is **not refunded** — this prevents member/staff mis-operation. Security caveat: until signed member sessions exist (ticket 8), deduct-on-confirm lets anyone who knows a phone spend that member's points remotely; acceptable for demo tenants only, closed by ticket 8. (Wayfinder: "Redeem-on-confirm".)
- **Return:** device session; else enter phone on portal → WhatsApp login link. No passwords, no SMS OTP, no "message the cafe" path.

## 4. Themes

Launch with **3**: (1) HeyTea-style flagship — premium-playful minimalism; (2) Classic elegant — dark/serif/gold; (3) Bold energy — big type, loud blocks. Every theme takes tenant logo/colors/cover plus 2–3 layout choices (rewards cards vs list, progress bar vs ring) so same-theme tenants don't look identical. Gallery growth + widget-level customization = V2 lever.

## 5. Messaging rail

**Single platform-owned WhatsApp number** (Cloud API direct, no BSP): platform's Meta bill, quotas per §1. Templates needed at launch: login link, ghost-member invite, (optional) points-update. Own-business verification + template approval = a launch task, not the heavyweight Tech Provider review. Tenant-owned numbers via Embedded Signup return in V2 with marketing broadcasts. Messaging isolated behind one internal interface (swap-safe).

## 6. PDPA launch set

DPA baked into ToS (incl. prompt breach-report clause, sub-processor list: Supabase, Vercel, Meta, Stripe) · auto-generated bilingual (BM+EN) privacy notice per tenant + consent capture at enrolment · member export (CSV) + delete in admin · Supabase **Singapore region** + one documented TIA · breach runbook (72h/7-day timelines) · data minimisation: phone + optional name + birthday month, nothing sensitive · retention rule: auto-anonymise members inactive >24 months (configurable) · DPO self-appointment deferred until ~20k aggregate members (dashboard tracker) · one-time lawyer review of DPA + notices (~RM2–5k — the only planned cash spend).

## 7. Billing

**Stripe** (MYR, subscriptions, trial conversion, invoices; cards + FPX). Build-time caveat to verify: FPX-recurring support — fallback pattern: card for auto-renew, FPX for manual annual.

## 8. Stack

Next.js + Supabase (Postgres, RLS multi-tenancy, SG region) + Vercel. One points-ledger data model (transactions with rule source) serving both earning rules. Staff-mode QR scan via browser camera (getUserMedia). No DevOps beyond the managed platforms.

## 9. Explicitly deferred (V2+)

Marketing broadcasts + tenant WABA/Embedded Signup · AI layer (assistant, campaign drafts, CSV import mapping) · advanced analytics beyond the retention panel (cohort curves, RFM segments, campaign attribution) · custom domains · >3 outlets & deep multi-location · theme gallery beyond 3 + widget customization · POS integrations · BM/中文 admin UI · done-for-you setup (paid add-on) · printed table-tent packs (paid add-on) · bonus-point rules & happy hours · points expiry (urgency lever — needs expiry jobs + notice messages) · refer-a-friend rewards · gifting/online redemption · franchise/reseller model · international member phone numbers (MVP is Malaysian mobiles only — fixed +60 prefix at every phone input).

## 10. Launch sequence & critical path

Parallel workstream from day 1 (external clocks): Meta business verification + template approval; Stripe account activation; lawyer review of DPA/notices. Build order: schema + RLS → wizard + themes (×3) → member portal (trilingual) → staff mode → WhatsApp rail → Stripe/trial → admin CMS polish → marketing site → founding-tenant pilot push (interview kit as script). **Traction gate (~3 months post-launch): ≥5 paying tenants, median price ≥ RM299, ≥60% unaided setup — hit → scale; miss → reprice/reposition/stop.**
