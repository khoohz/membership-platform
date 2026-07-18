// The member's personal QR encodes `mem:<member_uuid>` -- an opaque random id, no
// PII. A photographed QR leaks nothing and can only ever *receive* points, and only
// through a PIN-authenticated staff session, so no signing/rotation at MVP.

const PREFIX = "mem:";

export function memberQrPayload(memberId: string): string {
  return `${PREFIX}${memberId}`;
}

export function parseMemberQrPayload(payload: string): string | null {
  if (!payload.startsWith(PREFIX)) return null;
  const id = payload.slice(PREFIX.length);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ? id
    : null;
}
