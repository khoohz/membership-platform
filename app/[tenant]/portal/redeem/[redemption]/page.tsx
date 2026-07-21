import { redirect } from "next/navigation";

// Vouchers now render as a bottom drawer over the portal (?voucher=<id>) so the member
// keeps their card and balance in view. This route survives only to keep older links
// (and any bookmarked voucher URL) working -- it forwards to the drawer.

export default async function RedeemRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string; redemption: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { tenant: tenantSlug, redemption } = await params;
  const { phone } = await searchParams;

  const query = new URLSearchParams();
  if (phone) query.set("phone", phone);
  query.set("voucher", redemption);
  redirect(`/${tenantSlug}/portal?${query.toString()}`);
}
