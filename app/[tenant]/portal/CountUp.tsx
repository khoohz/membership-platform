"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Count-up on the hero balance. SSR (and JS-off) renders the final number, so there is
// no layout shift and the fallback is correct; on mount we drop to 0 and animate up.
// useLayoutEffect resets to 0 BEFORE the browser paints, so the member never sees the
// final value flash first. Honours prefers-reduced-motion (snaps straight to final).

// useLayoutEffect on the server warns; fall back to useEffect there (this only runs its
// body in the browser anyway).
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

export default function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(0);

  useIsoLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || value <= 0) {
      setDisplay(value);
      return;
    }

    // Longer count for bigger balances, capped so it never drags.
    const duration = Math.min(1100, 400 + value * 4);
    const start = performance.now();
    setDisplay(0);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(easeOutCubic(progress) * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{display}</>;
}
