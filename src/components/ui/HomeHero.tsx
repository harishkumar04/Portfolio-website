"use client";

import { portfolio } from "@/config/portfolio";
import { useNavigationStore } from "@/store/navigationStore";

/** Title and guidance shown at the home view. */
export function HomeHero() {
  const current = useNavigationStore((s) => s.current);
  const entered = useNavigationStore((s) => s.entered);
  const visible = entered && current === "home";
  return (
    <section
      aria-label="Introduction"
      className={`pointer-events-none fixed bottom-4 left-3 z-30 max-w-[min(94vw,31rem)] transition-all duration-700 sm:bottom-7 sm:left-7 ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
    >
      <div className="rounded-3xl bg-navy-950/60 px-5 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
        <p className="font-mono text-[10px] tracking-[0.35em] text-amber-300 uppercase">{portfolio.tagline}</p>
        <h2 className="mt-2 text-3xl font-light text-cream drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-5xl">{portfolio.name}</h2>
        <p className="mt-3 text-sm leading-relaxed text-cream/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)] sm:text-base">
          Every project is a journey. Every deployment moves something forward. The journey never stops.
        </p>
        <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-cream/60 uppercase">
          <span className="hidden md:inline">Select the tower, containers, ship or sea · keys 1–5</span>
          <span className="md:hidden">Tap a beacon or open the menu</span>
        </p>
      </div>
    </section>
  );
}
