"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRedemptionAction } from "./actions";

// Redeem / regenerate as a client action so the voucher drawer opens via a
// scroll-preserving navigation (router.push with scroll:false). A server-action
// redirect would scroll the page to the top as the drawer slides up.

export default function RedeemButton({
  tenantSlug,
  phone,
  rewardId,
  disabled,
  label,
  className,
}: {
  tenantSlug: string;
  phone: string;
  rewardId: string;
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const base = `/${tenantSlug}/portal?phone=${encodeURIComponent(phone)}`;

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const res = await createRedemptionAction(tenantSlug, phone, rewardId);
          const target = res.ok
            ? `${base}&voucher=${res.id}`
            : `${base}&error=${res.error}`;
          router.push(target, { scroll: false });
        })
      }
    >
      {label}
    </button>
  );
}
