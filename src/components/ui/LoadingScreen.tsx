"use client";

import { useEffect, useRef } from "react";
import { useProgress } from "@react-three/drei";
import { portfolio } from "@/config/portfolio";
import { useNavigationStore } from "@/store/navigationStore";

/** Title card + loading progress. The harbor (and its camera intro) starts when the visitor enters. */
export function LoadingScreen() {
  const ready = useNavigationStore((s) => s.sceneReady);
  const entered = useNavigationStore((s) => s.entered);
  const enter = useNavigationStore((s) => s.enter);
  const { progress } = useProgress();
  const button = useRef<HTMLButtonElement>(null);
  const pct = ready ? 100 : Math.min(99, Math.round(progress));

  useEffect(() => { if (ready) button.current?.focus(); }, [ready]);

  return (
    <div
      className={`intro fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 text-center transition-opacity duration-1000 ${entered ? "pointer-events-none opacity-0" : "opacity-100"}`}
      aria-hidden={entered}
    >
      <p className="font-mono text-[11px] tracking-[0.45em] text-amber-400/90 uppercase">{portfolio.name}</p>
      <h1 className="mt-4 text-4xl font-light tracking-[0.18em] text-cream sm:text-6xl">BEYOND THE HORIZON</h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/75 sm:text-base">
        Every project is a journey. Every deployment moves something forward.
      </p>
      <div className="mt-10 h-[2px] w-56 overflow-hidden rounded bg-cream/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Loading the harbor">
        <div className="h-full bg-amber-400 transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <button
        ref={button}
        type="button"
        onClick={enter}
        disabled={!ready}
        className="mt-8 rounded-full border border-amber-400/60 px-7 py-2.5 font-mono text-xs tracking-[0.3em] text-amber-300 uppercase transition hover:bg-amber-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40"
      >
        {ready ? "Enter the harbor" : `Loading ${pct}%`}
      </button>
      <p className="mt-6 font-mono text-[10px] tracking-[0.25em] text-cream/45 uppercase">{portfolio.tagline}</p>
    </div>
  );
}
