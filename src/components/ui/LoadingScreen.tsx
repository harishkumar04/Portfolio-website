"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useNavigationStore } from "@/store/navigationStore";

const MIN_MS = 1400;

/**
 * Minimal title card while the painted layers initialise. The static painting is already behind
 * it, so this is brief; it hands over automatically as soon as the scene is ready.
 */
export function LoadingScreen() {
  const ready = useNavigationStore((s) => s.sceneReady);
  const entered = useNavigationStore((s) => s.entered);
  const enter = useNavigationStore((s) => s.enter);
  const { progress } = useProgress();
  const [waited, setWaited] = useState(false);
  const [gone, setGone] = useState(false);
  const pct = ready ? 100 : Math.min(99, Math.round(progress));

  useEffect(() => { const t = setTimeout(() => setWaited(true), MIN_MS); return () => clearTimeout(t); }, []);
  useEffect(() => { if (ready && waited) enter(); }, [ready, waited, enter]);
  useEffect(() => { if (entered) { const t = setTimeout(() => setGone(true), 1300); return () => clearTimeout(t); } }, [entered]);
  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[80] flex flex-col justify-between bg-midnight px-6 py-8 transition-opacity duration-[1100ms] ease-out sm:px-12 sm:py-10 ${entered ? "pointer-events-none opacity-0" : "opacity-100"}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading the harbor, ${pct} percent`}
    >
      <span aria-hidden />
      <div>
        <h1 className="display text-[clamp(2.2rem,7vw,5rem)] text-warm-ivory">
          BEYOND<br />THE HORIZON
        </h1>
        <p className="label label-amber mt-6">Harbor system initializing</p>
      </div>
      <div>
        <div className="flex items-end justify-between font-mono text-xs tracking-[0.08em] text-muted-grey uppercase">
          <span>Scene loading</span>
          <span className="tabular-nums text-warm-ivory">{String(pct).padStart(2, "0")}%</span>
        </div>
        <div className="mt-3 h-px w-full bg-warm-ivory/15">
          <div className="h-full origin-left bg-sunset-amber transition-transform duration-500 ease-out" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
      </div>
    </div>
  );
}
