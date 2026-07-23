import "server-only";
import { cookies } from "next/headers";

// Ticket 5 — long-lived DEVICE session (the convenience half of it).
//
// This cookie remembers which member last used the portal on this device so a
// returning visitor lands on their card instead of the phone form. It is NOT
// authentication: it carries no signature and grants no trust — anyone holding the
// device, or anyone who types a phone number, is shown that portal, exactly as before.
//
// BOUNDARY WITH TICKET 8: ticket 8 (WhatsApp phone-login) replaces this with a signed,
// single-use login link that opens a *verified* session, and adds ghost-member
// capture. Do not add signing, verification, or auth checks to this cookie here — that
// is ticket 8's scope. Until it ships, the portal stays open to anyone who knows a
// phone (acceptable for demo tenants only; see ticket 8's security note).
//
// Path-scoping to /<tenant>/portal means the browser only sends each tenant's cookie
// on that tenant's portal, so one device can hold a separate remembered member per
// tenant with no cross-tenant leakage.

export const MEMBER_COOKIE = "portal_member";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function portalPath(tenantSlug: string) {
  return `/${tenantSlug}/portal`;
}

export async function rememberMember(tenantSlug: string, phone: string): Promise<void> {
  const store = await cookies();
  store.set(MEMBER_COOKIE, phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: portalPath(tenantSlug),
    maxAge: ONE_YEAR_SECONDS,
  });
}

export async function rememberedMember(): Promise<string | null> {
  const store = await cookies();
  return store.get(MEMBER_COOKIE)?.value ?? null;
}

export async function forgetMember(tenantSlug: string): Promise<void> {
  const store = await cookies();
  store.set(MEMBER_COOKIE, "", { path: portalPath(tenantSlug), maxAge: 0 });
}
