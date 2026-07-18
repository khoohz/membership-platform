# CLAUDE.md — Membership Platform MVP

Self-serve white-label membership SaaS for Malaysian F&B SMEs. Solo founder. Next.js + Supabase (Singapore region) + Vercel + Stripe + Meta WhatsApp Cloud API.

## Source of truth
- `tickets.md` — the build roadmap. Work ONE ticket per session, frontier first. Do not start a ticket whose blockers aren't done.
- `docs/MVP-SPEC.md` — the product contract. If code and spec disagree, stop and ask.
- `docs/WAYFINDER-MAP.md` — why each decision was made. Read the relevant decision before proposing to change one.
- `docs/prototypes/` — visual references (Atelier theme, wizard Variant A). Match their taste rules: no emoji as icons, one stroke-icon set, real type scale, layered depth.

## Hard rules
- Every table is multi-tenant with RLS from its first migration. Any new table without an RLS policy is a bug.
- The points ledger is append-only. Balances are derived. Never mutate a balance column.
- Never put the Supabase service-role key in client code. Secrets live in `.env.local` (git-ignored) and Vercel env vars only.
- Member-facing strings ship in EN + 中文 + BM. Admin is EN-only.
- Show me migrations and RLS policies as a plan before applying them.
- Commit at the end of each ticket with the ticket number in the message. Never push without asking.

## Commands
- `npm run db:start` — start local Supabase (Docker required); run once before `dev` or `test`
- `npm run db:reset` — reapply all migrations + `supabase/seed.sql` to the local db
- `npm run dev` — local dev (Next.js)
- `npm run test` — tests against local Supabase (run before declaring a ticket done)
- `npm run lint` — lint
- `npx tsc --noEmit` — typecheck

## Definition of done (every ticket)
Acceptance boxes in `tickets.md` checked, tests pass, RLS verified for any new table, deployed preview works on a real phone.
