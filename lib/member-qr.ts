// QR payloads scanned in staff mode. Both are opaque random uuids, no PII:
//   mem:<member_uuid>      -- the member's personal earn QR (can only receive points)
//   rdm:<redemption_uuid>  -- a one-time redemption voucher (single-use enforced by
//                             the claim_redemption transaction, never by secrecy)
// Neither is signed at MVP: acting on either requires a PIN-authenticated staff session.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function memberQrPayload(memberId: string): string {
  return `mem:${memberId}`;
}

export function redemptionQrPayload(redemptionId: string): string {
  return `rdm:${redemptionId}`;
}

export type ScannedQr =
  | { type: "member"; id: string }
  | { type: "redemption"; id: string };

export function parseQrPayload(payload: string): ScannedQr | null {
  const match = payload.match(/^(mem|rdm):(.+)$/);
  if (!match || !UUID_RE.test(match[2])) return null;
  return { type: match[1] === "mem" ? "member" : "redemption", id: match[2] };
}

export function parseMemberQrPayload(payload: string): string | null {
  const parsed = parseQrPayload(payload);
  return parsed?.type === "member" ? parsed.id : null;
}
