import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Staff-mode auth: per-outlet 6-digit PIN (bcrypt in outlets.pin_hash, never
// plaintext) minting an HMAC-signed session token carried in an HttpOnly cookie.
// Brute-force guard: per-outlet failed-attempt counter with a lockout, stored in
// the database because serverless instances share no memory.

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;
const SESSION_HOURS = 12; // one shift

export const STAFF_COOKIE = "staff_session";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

type SessionPayload = {
  tenantId: string;
  outletId: string;
  exp: number; // unix seconds
};

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function mintSessionToken(tenantId: string, outletId: string): string {
  const payload: SessionPayload = {
    tenantId,
    outletId,
    exp: Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(body);
  const macBuf = Buffer.from(mac);
  const expectedBuf = Buffer.from(expected);
  if (macBuf.length !== expectedBuf.length || !timingSafeEqual(macBuf, expectedBuf)) {
    return null;
  }
  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
  if (typeof payload.tenantId !== "string" || typeof payload.outletId !== "string") {
    return null;
  }
  return payload;
}

export type PinCheckResult =
  | { ok: true; token: string }
  | { ok: false; reason: "locked" | "wrong_pin" | "no_pin_set" };

export async function checkPinAndMintSession(
  tenantId: string,
  outletId: string,
  pin: string,
): Promise<PinCheckResult> {
  const { data: outlet, error } = await supabaseAdmin
    .from("outlets")
    .select("id, pin_hash, pin_failed_attempts, pin_locked_until")
    .eq("tenant_id", tenantId)
    .eq("id", outletId)
    .maybeSingle();
  if (error) throw error;
  if (!outlet || !outlet.pin_hash) return { ok: false, reason: "no_pin_set" };

  if (outlet.pin_locked_until && new Date(outlet.pin_locked_until) > new Date()) {
    return { ok: false, reason: "locked" };
  }

  const matches = await bcrypt.compare(pin, outlet.pin_hash);

  if (!matches) {
    const attempts = outlet.pin_failed_attempts + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;
    const { error: updateError } = await supabaseAdmin
      .from("outlets")
      .update({
        pin_failed_attempts: lock ? 0 : attempts,
        pin_locked_until: lock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
          : null,
      })
      .eq("id", outlet.id);
    if (updateError) throw updateError;
    return { ok: false, reason: "wrong_pin" };
  }

  const { error: resetError } = await supabaseAdmin
    .from("outlets")
    .update({ pin_failed_attempts: 0, pin_locked_until: null })
    .eq("id", outlet.id);
  if (resetError) throw resetError;

  return { ok: true, token: mintSessionToken(tenantId, outletId) };
}

// Guard for award actions: token must verify AND belong to the tenant in the URL.
export function requireStaffSession(
  token: string | undefined,
  tenantId: string,
): SessionPayload | null {
  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session || session.tenantId !== tenantId) return null;
  return session;
}
