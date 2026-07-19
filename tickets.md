# Tickets: Membership Platform MVP Build

Tracer-bullet build roadmap for the Malaysia self-serve membership SaaS. Source spec: `docs/MVP-SPEC.md` (decisions and reasoning: `docs/WAYFINDER-MAP.md`). Each ticket is a complete, demoable vertical slice sized for one focused session.

Work the **frontier**: any ticket whose blockers are all done. Clear context between tickets.

**External clocks (revised 18 Jul 2026).** Ticket 7 builds against **Meta's free test number, unverified** — no business verification needed to develop and demo the WhatsApp rail (test numbers send to a small allowlist of recipient numbers). The registration chain — **SSM business registration → Meta business verification → Stripe account activation** — is deferred as a single **"launch decision" gate that must clear before ticket 14** (production WhatsApp number + Stripe live mode both need a registered business). Remaining independent clock:

- [ ] Lawyer engaged for DPA + bilingual notices review (~RM2–5k, the only planned cash spend) — gates ticket 9's final copy
- [ ] **Launch decision gate (before ticket 14):** SSM registration → Meta business verification → Stripe activation, fired together when committing to launch

## 1. Walking skeleton: one tenant, one member, one point

**What to build:** A deployed app (Next.js + Supabase Singapore region + Vercel) where a seeded tenant exists, a visitor can enter a phone number on an ugly portal page and become a member, an ugly staff page can award +10 points to that member, and the portal shows the updated balance. Multi-tenant RLS on from the first migration. Ugly on purpose — this proves the whole loop before any polish.

**Blocked by:** None — can start immediately.

- [x] Core schema migrated: tenants, outlets, members, points_ledger, tiers, rewards, themes — every table RLS-protected by tenant
- [x] A second seeded tenant cannot see the first tenant's members (verified by an automated test, not by eyeball)
- [x] Enrol → award → balance loop works end-to-end on the deployed URL
- [x] Points ledger is append-only transactions; balance is derived, never stored as a mutable counter

## 2. Staff mode: scan to award

**What to build:** A PIN-protected mobile web page per outlet where a cashier scans the member's personal QR with the phone camera and awards points under the tenant's earning rule — one tap for "N points per visit," or a numpad amount for "N points per RM1" (always round down). The member's portal balance updates.

Includes **phone number normalization** — phone is the identity key (`unique (tenant_id, phone)`), and the walking skeleton stores whatever the user typed. Malaysians write the same number as `012-345 6789`, `0123456789`, or `+60123456789`; without normalizing to one canonical form (E.164, `+60…`) at every entry point, one person becomes two members and WhatsApp sends (tickets 7–8) get malformed numbers. Normalize on the portal enrol form and staff entry here, and backfill/migrate the raw values ticket 1 stored.

**Blocked by:** 1.

- [x] Browser camera QR scan works on iPhone Safari and Android Chrome *(verified on iPhone by founder 18 Jul 2026; Android Chrome pending — re-open if it misbehaves)*
- [x] Both earning-rule types award correctly with tenant-custom N values; per-RM rounds down
- [x] Wrong PIN cannot award; every award is a ledger row with outlet + staff attribution
- [x] Phone numbers normalized to E.164 (+60…) at every entry point — `012-345 6789`, `0123456789`, and `+60123456789` all resolve to the same member (tested); existing raw rows migrated

## 3. Redemption loop

**What to build:** A member with enough points taps Redeem on a reward, gets a one-time QR with the reward name in large text and a 60-second validity; the cashier scans it in staff mode, sees a confirm screen, and confirms — points deducted, voucher marked used, logged. Insufficient points shows a disabled state.

**Blocked by:** 2.

- [x] Redemption QR is single-use: a screenshot scanned twice fails the second time
- [x] Expired (60s) codes fail with a clear message; member can regenerate
- [x] Deduction is one atomic ledger transaction; history shows the redemption

## 4. Theme engine + Atelier

**What to build:** A theme architecture (design tokens + 2–3 layout slots per theme) applied to the member portal, with Atelier as the first real theme rendering the tenant's logo, brand color, and cover material. Changing the tenant's theme or brand inputs restyles the portal with no code change. Visual reference: `docs/prototypes/prototype-member-portal-atelier.html`.

**Blocked by:** 1.

- [ ] Tenant brand inputs (logo, color, cover image with crafted fallback material) render inside the theme
- [ ] A second theme stub proves the architecture (switching themes = data change only)
- [ ] No emoji anywhere in UI; one stroke-icon set; type scale per the Atelier prototype

## 5. Member portal, complete

**What to build:** The full member experience per spec: hero card (name, points count-up, tier chip, embedded member QR), journey progress bar with ritual copy, rewards grid, transaction history — trilingual (EN default / 中文 / BM) with a visible toggle, long-lived device session.

**Phone input (decided 18 Jul 2026, during ticket 2):** member phone fields use a fixed `+60` prefix with local-number entry (user types `12-345 6789` / `11-2345 6789`), `tel` keyboard, and light client-side Malaysian-mobile validation (`01x`, allowing 011's extra digit). Client validation is UX only — server normalization (`lib/phone.ts`) stays authoritative. MVP accepts Malaysian mobiles exclusively; international numbers are on the spec's deferred list (§9).

**Blocked by:** 3, 4.

- [ ] All member-facing strings exist in all three languages; toggle persists per device
- [ ] Layout matches spec §2.5 (hero card → progress → rewards → history)
- [ ] Lighthouse mobile performance ≥ 90 on the portal (it's the most-loaded page in the product)

## 6. Setup wizard

**What to build:** The Variant-A onboarding: checklist steps on the left (business info → branding → earning rule + first tier → first reward → go live), live themed member-card preview updating as the owner types, ending with a printable QR poster (A5/A4 PDF) and the "enrol yourself as member #1" moment with elapsed time shown. Reference: `docs/prototypes/prototype-onboarding-wizard.html` (Variant A).

**Blocked by:** 4.

- [ ] A fresh tenant reaches "member #1 enrolled" using only the wizard — target < 15 minutes, timer visible at the finale
- [ ] Earning rule accepts custom N for both rule types; templates offered for tiers/rewards
- [ ] QR poster PDF downloads with the tenant's branding and portal URL

## 7. WhatsApp rail

**What to build:** Platform-owned WhatsApp number on Meta Cloud API (no BSP): send the login-link template and the ghost-member invite template, receive webhooks, meter per-tenant monthly message counts against plan quotas. All messaging behind one internal interface so a BSP could be swapped in later.

**Blocked by:** 1. (Builds on Meta's free test number, unverified — recipients limited to a small allowlist until the pre-14 launch-decision gate clears business verification; production number swap is part of ticket 14.)

- [ ] Login-link and ghost-invite templates approved and sending to a real Malaysian number
- [ ] Quota meter increments per tenant; over-quota behaviour defined (block + prompt top-up)
- [ ] Zero Meta-specific types outside the messaging module

## 8. Phone login + ghost-member capture

**What to build:** The two identity flows: a returning member types their phone on the portal and receives a WhatsApp login link that opens a signed session; a cashier types a phone number in staff mode at peak hour, points bank to a ghost member, and one WhatsApp invite is sent for later claiming.

**Security note (recorded 18 Jul 2026, during ticket 3):** this ticket closes the **voucher-impersonation gap** — until signed member sessions exist, anyone who knows a phone number can open that member's portal and generate redemption vouchers (claiming still requires an in-person staff PIN scan, so points can't be drained remotely, but a walk-in impersonator is possible). Acceptable for demo tenants only: **this ticket must ship before any real tenant onboards.**

**Blocked by:** 5, 7.

- [ ] Login links are signed, single-use, and expire; session persists long-lived on the device
- [ ] Ghost member converts to full member on claim, keeping banked points
- [ ] No passwords, no SMS OTP anywhere

## 9. PDPA pack

**What to build:** The compliance launch set from `docs/research-pdpa-compliance-T4.md`: DPA baked into tenant ToS acceptance, auto-generated bilingual (BM+EN) privacy notice per tenant shown with a consent checkbox at enrolment (consent recorded with version), member data export (CSV) and delete in admin, retention auto-anonymise job, breach runbook + TIA as documents in the repo.

**Blocked by:** 5, 6. (Final legal copy gated by the day-1 lawyer-review external clock.)

- [ ] Enrolment blocked without consent; consent record stores who/when/notice-version
- [ ] Export and delete work per member and per tenant; delete cascades correctly
- [ ] Notice auto-fills tenant name/purpose from wizard data in both BM and EN

## 10. Stripe: trial to paid

**What to build:** Tenant signup starts a 30-day no-card trial; at conversion, Starter (RM299) / Growth (RM399) checkout with cards + FPX, annual = 2 months free, a founding-tenant RM199-for-life coupon capped at 10 redemptions, basic dunning, and plan gates enforced (outlets, themes, message quota).

**Blocked by:** 6. (Builds entirely in Stripe test mode; live mode gated by the pre-14 launch-decision gate — SSM registration → Stripe activation.)

- [ ] Trial expiry locks admin actions gracefully (data safe, portal stays live) until payment
- [ ] Verify FPX-recurring support during build; if gapped, fall back to card auto-renew + FPX manual annual
- [ ] Plan limits actually enforced, not just displayed

## 11. Admin CMS + retention insights

**What to build:** The tenant's daily home: dashboard, the retention insights panel (repeat-visit rate, 30-day actives, new vs returning monthly, avg visits/member, top redeemed rewards — all derived from the ledger), member management (search by phone, view/adjust with audit trail), rewards & tiers editor, theme picker, WhatsApp-support button, message-quota meter, member-count tracker for the PDPA DPO threshold.

**Rewards editor constraint (recorded 18 Jul 2026, during ticket 3):** rewards must be **archived, never deleted** — redeemed rewards are referenced by `redemptions` with `ON DELETE RESTRICT`, so deleting a reward with redemption history will fail at the database (by design: history integrity). The editor needs an `archived`/`active` flag to hide a reward from the portal instead.

**Blocked by:** 3.

- [ ] All five insight metrics correct against a seeded fixture dataset
- [ ] Manual point adjustments are audited ledger rows, never silent edits
- [ ] Admin is English-only per spec; responsive enough to use on a phone

## 12. Themes two & three

**What to build:** Port the Cream & Stickers direction (from `docs/prototypes/prototype-member-portal.html`, Variant B) as theme two, and build the flagship third theme from the founder's HeyTea-inspired reference screenshots (input required from founder — collect before starting). Each theme exposes its 2–3 layout slots.

**Blocked by:** 4. (Flagship additionally gated on founder reference screenshots.)

- [ ] Three themes selectable in wizard and admin, each surviving arbitrary tenant logo/color combinations
- [ ] Same-theme tenants remain visually distinguishable via brand inputs + layout slots
- [ ] Founder signs off on the flagship against their references

## 13. Marketing site + pricing page

**What to build:** The public wedge: positioning ("launch in 15 minutes, no sales call"), fully transparent pricing (RM299/RM399, founding offer with live remaining-slots count), an interactive demo member card, and signup entry into the wizard.

**Blocked by:** 10.

- [ ] Pricing page shows real numbers — no "contact us" anywhere
- [ ] Founding-offer slot count is live from the coupon's actual redemption count
- [ ] Signup → wizard → trial is one unbroken flow

## 14. Launch hardening + pilot push

**What to build:** Production readiness and the market test: custom domain, error monitoring + uptime alerts, DB backups verified restorable, help-center seed articles (from wizard copy), then the founding-tenant outreach (walk-ins + F&B Facebook groups) using `docs/interview-kit-T2.md` as the script — with the traction gate instrumented: ≥5 paying tenants, median price ≥ RM299, ≥60% unaided setup, within ~3 months.

**Blocked by:** 8, 9, 11, 12, 13.

- [ ] A stranger can sign up, launch, and take payment with zero founder involvement
- [ ] Breach runbook contacts and monitoring alerts tested once for real
- [ ] Traction-gate metrics visible on an internal dashboard from day one of the pilot
