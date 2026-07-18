// Phone is the identity key (unique tenant_id + phone), so every entry point must
// normalize to one canonical form: E.164, +60. Malaysians write the same number as
// "012-345 6789", "0123456789", or "+60123456789" -- without this, one person
// becomes several members and WhatsApp sends (tickets 7-8) get malformed numbers.
// Mirrored by the SQL backfill in migration 20260718083224_normalize_member_phones.

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  // Local mobile format: 01x xxxx xxxx(x)
  if (/^01[0-9]{8,9}$/.test(digits)) return `+6${digits}`;
  // Country code without plus: 601x...
  if (/^601[0-9]{8,9}$/.test(digits)) return `+${digits}`;

  return null;
}
