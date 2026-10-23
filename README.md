# Membership Platform

A self-serve, white-label membership platform for Malaysian F&B businesses. Tenants can run a branded loyalty programme with a member-facing portal and a PIN-protected staff surface for awarding points and confirming rewards.

This is an MVP built with Next.js, Supabase (Postgres), and TypeScript. The product contract lives in [docs/MVP-SPEC.md](docs/MVP-SPEC.md); the implementation roadmap is [tickets.md](tickets.md).

## Current status

The core loyalty loop is working for seeded demo tenants:

- Tenant-scoped data model with Row Level Security enabled from the first migration.
- Append-only points ledger with balances derived from the ledger, never stored as mutable counters.
- Malaysian mobile-number normalisation to E.164 (`+60…`).
- Staff mode with a six-digit outlet PIN, browser QR scanning, visit- and spend-based earning rules, and brute-force lockout.
- Member portal with a branded membership card, embedded member QR, tiers, rewards, transaction history, device session, and EN / 中文 / BM UI.
- One-time reward vouchers: a member confirms the redemption, points are deducted atomically, and staff validate the time-limited QR code.
- Data-driven portal theming and tenant brand inputs.

The setup wizard is the current work frontier. WhatsApp login, tenant administration, billing, and production hardening are intentionally not complete yet; see [tickets.md](tickets.md) for the ordered plan.

## Stack

- Next.js 16, React 19, TypeScript
- Supabase CLI and PostgreSQL 17 for local database development
- Vitest and ESLint
- Browser camera scanning via `qr-scanner`; member QR generation via `qrcode`

## Prerequisites

- Node.js 20 or newer
- Docker Desktop, running (required by the Supabase CLI)
- npm

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Start the local Supabase stack:

   ```bash
   npm run db:start
   ```

3. Copy the environment template and add the service-role key printed by the command above:

   ```bash
   cp .env.local.example .env.local
   openssl rand -hex 32
   ```

   Keep `NEXT_PUBLIC_SUPABASE_URL` as `http://127.0.0.1:54321` for local development. Paste the Supabase **service_role** key into `SUPABASE_SERVICE_ROLE_KEY`, and use the generated value as `SESSION_SECRET`. These two values are server-only secrets: never commit `.env.local` or expose either value through a `NEXT_PUBLIC_` variable.

4. Apply every migration and load the demo tenant:

   ```bash
   npm run db:reset
   ```

   This resets the local database. It creates the `demo-cafe` tenant, its `Main Outlet`, sample tiers and rewards, and the portal theme.

5. Run the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), then choose Demo Cafe's portal or staff page.

## Try the demo flow

1. Open `/demo-cafe/portal` and enrol with a valid Malaysian mobile number.
2. Provision a local staff PIN (use a throwaway six-digit value):

   ```bash
   npx tsx scripts/set-outlet-pin.ts demo-cafe 123456
   ```

3. Open `/demo-cafe/staff`, sign in with that PIN, then scan the member QR or look up the member by phone to award points.
4. To make the redemption path immediately testable, append demo points to the member's ledger:

   ```bash
   npx tsx scripts/award-points.ts demo-cafe +60123456789 300 manual_topup
   ```

   Replace the phone number with the normalised number created during enrolment. Return to the portal, redeem a reward, and scan the generated voucher in staff mode to confirm it.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve a production build. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run the Vitest suite against the configured Supabase database. |
| `npx tsc --noEmit` | Type-check without generating output. |
| `npm run db:start` | Start local Supabase services. |
| `npm run db:reset` | Recreate the local schema and seed data. |

Run `npm run db:start` and configure `.env.local` before running the tests.

## Development utilities

The `scripts/` directory provides development-only tools that use the server-side Supabase key:

- `set-outlet-pin.ts` — provision or rotate an outlet's six-digit staff PIN.
- `award-points.ts` — append a ledger adjustment for a member.
- `set-earning-rule.ts` — change a demo tenant's earning rule.
- `set-tiers.ts` — replace a tenant's tier ladder.
- `set-theme.ts` — change a tenant theme or primary brand colour.

Run a script with no arguments (or inspect its header) for usage. Do not use these direct database utilities as a substitute for the future tenant-admin controls.

## Data and security notes

- Each tenant-owned table carries `tenant_id`; RLS is enabled and direct anonymous/authenticated access is denied by default.
- Current application server actions use the Supabase service-role client, so each server query must scope its data explicitly by `tenant_id`.
- Ledger rows cannot be updated or deleted by the service role. Corrections are new offsetting entries.
- The unsigned portal session and redemption model are for demo tenants only. Signed WhatsApp login is a required future milestone before production tenants are onboarded.

## Project layout

```text
app/                    Next.js routes and member/staff UI
lib/                    Domain logic: members, ledger, redemptions, themes, i18n
supabase/migrations/    Ordered schema, RLS, and database-function migrations
supabase/seed.sql       Local demo tenant and fixtures
scripts/                Local development and demo-data utilities
tests/                  Unit and local-Supabase integration tests
docs/                   Product specification, decisions, research, and prototypes
```

## Contributing constraints

Before changing the data model or product behaviour, read [CLAUDE.md](CLAUDE.md). In particular: keep every tenant-scoped table behind RLS, preserve the append-only ledger, keep secrets server-side, and ship member-facing copy in EN, 中文, and BM.
