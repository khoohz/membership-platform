import { cookies } from "next/headers";
import { getTenantBySlug, earningRuleOf } from "@/lib/tenants";
import { getMemberById, getMemberBalance } from "@/lib/members";
import { requireStaffSession, STAFF_COOKIE } from "@/lib/staff-auth";
import { loginWithPin, lookupByPhone, awardToMember } from "./actions";
import Scanner from "./Scanner";
import RmAmountField from "./RmAmountField";

function maskPhone(phone: string): string {
  return `•••• ${phone.slice(-4)}`;
}

const ERROR_MESSAGES: Record<string, string> = {
  wrong_pin: "Wrong PIN.",
  locked: "Too many wrong attempts — locked for 5 minutes.",
  no_pin_set: "No PIN is set for this outlet. Ask the owner to provision one.",
  session: "Session expired — enter the PIN again.",
  member_not_found: "No member found for that phone number.",
  bad_amount: "Enter a valid amount in RM.",
  amount_too_small: "Amount too small to earn any points.",
};

export default async function StaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ member?: string; src?: string; awarded?: string; error?: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const { member: memberId, src, awarded, error } = await searchParams;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return <p>Unknown tenant &quot;{tenantSlug}&quot;.</p>;
  }

  const cookieStore = await cookies();
  const session = requireStaffSession(cookieStore.get(STAFF_COOKIE)?.value, tenant.id);
  const errorMessage = error ? ERROR_MESSAGES[error] ?? null : null;

  if (!session) {
    const loginAction = loginWithPin.bind(null, tenantSlug);
    return (
      <main>
        <h1>{tenant.name} — Staff</h1>
        <form action={loginAction}>
          <label>
            Outlet PIN
            <br />
            <input
              type="password"
              name="pin"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              autoComplete="off"
              required
            />
          </label>{" "}
          <button type="submit">Enter</button>
        </form>
        {errorMessage && <p>{errorMessage}</p>}
      </main>
    );
  }

  const rule = earningRuleOf(tenant);
  const lookupAction = lookupByPhone.bind(null, tenantSlug);
  const awardAction = awardToMember.bind(null, tenantSlug);

  let member = null;
  let balance: number | null = null;
  if (memberId) {
    member = await getMemberById(tenant.id, memberId);
    if (member) balance = await getMemberBalance(tenant.id, member.id);
  }

  return (
    <main>
      <h1>{tenant.name} — Staff</h1>
      <p>
        Rule: {rule.type === "per_visit"
          ? `${rule.n} points per visit`
          : `${rule.n} point${rule.n === 1 ? "" : "s"} per RM1 (round down)`}
      </p>

      {errorMessage && <p>{errorMessage}</p>}
      {awarded && <p><strong>Awarded +{awarded} points.</strong></p>}

      {member ? (
        <>
          <h2>Member {maskPhone(member.phone)}</h2>
          <p>Current balance: {balance}</p>
          {!awarded && (
            <form action={awardAction}>
              <input type="hidden" name="memberId" value={member.id} />
              <input type="hidden" name="src" value={src ?? "scan"} />
              {rule.type === "per_visit" ? (
                <button type="submit">Award +{rule.n}</button>
              ) : (
                <RmAmountField n={rule.n} />
              )}
            </form>
          )}
          <p>
            <a href={`/${tenantSlug}/staff`}>← Back to scan</a>
          </p>
        </>
      ) : (
        <>
          <h2>Scan</h2>
          <Scanner tenantSlug={tenantSlug} />
          <h2>Or find by phone</h2>
          <form action={lookupAction}>
            <label>
              Member phone number
              <br />
              <input type="tel" name="phone" required />
            </label>{" "}
            <button type="submit">Find member</button>
          </form>
        </>
      )}
    </main>
  );
}
