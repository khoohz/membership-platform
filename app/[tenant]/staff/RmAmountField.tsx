"use client";

import { useState } from "react";
import { parseRmToSen, pointsForSpend } from "@/lib/earning";

// Numpad entry for the per-RM rule: inputmode="decimal" raises the phone's numeric
// keypad. The preview uses the same parse/floor functions the server action uses;
// the form submits amountSen only -- the server recomputes points itself.

export default function RmAmountField({ n }: { n: number }) {
  const [value, setValue] = useState("");

  const amountSen = value ? parseRmToSen(value) : null;
  const points = amountSen === null ? null : pointsForSpend({ type: "per_rm", n }, amountSen);

  return (
    <div>
      <label>
        Amount spent (RM)
        <br />
        <input
          type="text"
          inputMode="decimal"
          placeholder="12.50"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </label>
      <input type="hidden" name="amountSen" value={amountSen ?? ""} />
      <p>
        {points === null
          ? `Enter an amount — ${n} point${n === 1 ? "" : "s"} per RM1, rounded down.`
          : `= ${points} points`}
      </p>
      <button type="submit" disabled={points === null || points <= 0}>
        Award {points !== null && points > 0 ? `+${points}` : ""}
      </button>
    </div>
  );
}
