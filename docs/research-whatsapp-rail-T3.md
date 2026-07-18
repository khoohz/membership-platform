# Research: Utility-Message Rail Economics & Provider Selection (Wayfinder T3)

**Date:** 10 July 2026 · **Resolves:** T3 on WAYFINDER-MAP.md
**Question:** With marketing broadcasts deferred, what does the WhatsApp utility rail cost, and should it run through a BSP or not?

## Answer in one line

**Skip BSPs entirely: integrate Meta's Cloud API directly and become a Meta Tech Provider — the rail costs the platform ~RM0/month because Meta bills each tenant's card directly for their own messages, and a wa.me deep-link enrolment design makes most messaging free anyway.**

## 1. The BSP layer is optional — and for this founder, unnecessary

Since May 2022, Meta's Cloud API lets businesses of any size connect to WhatsApp without intermediaries, hosted entirely on Meta's infrastructure, and it is free at the BSP layer — you pay only Meta's per-message rate with no markup. BSPs (Twilio, Vonage, Infobip, 360dialog, SleekFlow…) exist for teams that want dashboards and no-code tooling; they charge roughly $0.002–0.005 per message on top of Meta's rate, and some add monthly number-hosting fees. A developer who can write webhook handlers — this founder — gets nothing from a BSP that justifies a perpetual markup on every tenant's traffic.

## 2. The multi-tenant architecture: Tech Provider + Embedded Signup

The platform doesn't send messages *for* tenants from one number — each SME connects **their own** WhatsApp number via a "Connect WhatsApp" button inside the wizard, powered by Meta's **Embedded Signup** (a hosted popup: Facebook login → business portfolio → WABA + phone → permission grant; ~90 seconds for the tenant). Requirements to offer this:

- Register the platform as a **Meta Tech Provider**: a Meta Business App with `whatsapp_business_management` + `whatsapp_business_messaging`, **App Review** (requires demo videos of sending a message and creating a template from the app), Business Verification (typically 2–10 business days), and Access Verification.
- Once Business Verification, App Review, and Access Verification are complete, the onboarding limit rises automatically to 200 new business customers per rolling 7-day window — far beyond MVP needs.
- Webhooks: all onboarded WABAs post to the app's callback URL by default; per-number overrides exist but are the more complex path — a known gotcha where a second number's verify token can silently break the first if done naively.
- Tenants already using the WhatsApp Business app on their number can be onboarded with that existing number via a customized flow (important — most Malaysian SMEs already run their business on it).

## 3. Who pays for messages: the tenant, directly — this is the headline

Business customers onboarded by a Tech Provider must add their own payment method to their WhatsApp Business account. Meta bills the SME's card for the SME's messages. Consequences:

- **The platform's message cost is ~RM0.** No pass-through billing to build, no message quotas to police in pricing tiers at MVP, no margin erosion.
- Malaysia rates land on the tenant: utility ≈ RM0.056/msg, service replies free within the 24-hour window, marketing ≈ RM0.35/msg (irrelevant at MVP — deferred).
- New numbers start on standard messaging tiers (~1,000 business-initiated conversations/24h, auto-growing) — no constraint for a loyalty program's transactional volume.

## 4. Design insight: make enrolment free by having the customer message first

If the table QR encodes a **wa.me deep link** (customer scans → WhatsApp opens → sends pre-filled "JOIN" to the cafe's number), the *customer* initiates the conversation — opening the free 24-hour service window. The enrolment confirmation, portal link, and welcome message then cost **RM0**. Only out-of-window nudges (e.g., a points update days later) are paid utility messages at ~RM0.056. A 300-member cafe sending one monthly out-of-window utility touch ≈ **RM17/month, on the tenant's own Meta bill**. This should shape the QR flow in the MVP spec (T6).

## 5. Risks and mitigations

- **App Review effort and Meta platform churn** — Embedded Signup is not a one-time integration; Meta ships breaking-ish changes on a continuous schedule. Mitigation: isolate messaging behind one internal interface so a BSP could be swapped in later without touching product code; budget the App Review (demo videos, verified business) as a launch-critical path item — start it early, it gates the "Connect WhatsApp" button.
- **Tenant friction**: each SME must have (or create) a Meta Business portfolio and add a card. This is a real step in the 15-minute promise — the wizard should treat "Connect WhatsApp" as skippable at setup and completable later, so it never blocks going live.
- **Tenant refuses WhatsApp**: portal remains reachable via the QR (plain URL variant) and "add to home screen" prompt; degraded but functional. No SMS fallback at MVP (SMS costs money and adds a provider).

## Cost summary

| Item | Cost to platform | Cost to tenant |
|---|---|---|
| API access / hosting | RM0 (Cloud API, Meta-hosted) | RM0 |
| Enrolment + welcome (customer-initiated) | RM0 | RM0 (service window) |
| Out-of-window utility touch | RM0 | ~RM0.056/msg on own Meta bill |
| Marketing broadcasts (deferred) | RM0 | ~RM0.35/msg when launched as add-on |
| One-time: Tech Provider setup | founder time (App Review, verification, 2–10 biz days + review cycles) | ~2 min in wizard |

### Sources
Meta for Developers — Cloud API Get Started, About the Platform, Embedded Signup overview, Become a Tech Provider; Twilio & Vonage & Infobip Tech Provider integration guides; Dualhook Embedded Signup for SaaS guide (2026); wexio.io free WhatsApp API guide (2026); gurusup Cloud API guide (2026). Malaysia per-message rates cross-checked in the earlier verification note (`research-feasibility-verification.md`).
