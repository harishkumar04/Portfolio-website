"use client";

import { useEffect, useRef } from "react";
import { portfolio } from "@/config/portfolio";
import { scrollToSection } from "@/lib/journey";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { useNavigationStore } from "@/store/navigationStore";
import { Arrow, MaskHeading } from "./shared";

/** Home: the title, my name, one line, one button. The title sequence plays after the loading screen. */
export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const entered = useNavigationStore((s) => s.entered);
  useSectionReveal(ref, { manual: true });

  useEffect(() => {
    if (!entered) return;
    const tl = (ref.current as (HTMLElement & { __reveal?: gsap.core.Timeline }) | null)?.__reveal;
    const delay = useNavigationStore.getState().reducedMotion ? 0 : 1100; // let the camera begin its move first
    const t = setTimeout(() => tl?.play(), delay);
    // fail-safe: never leave the title hidden
    const g = setTimeout(() => { if (tl && tl.progress() === 0) tl.progress(1); }, delay + 2500);
    return () => { clearTimeout(t); clearTimeout(g); };
  }, [entered]);

  return (
    <section id="home" ref={ref} aria-labelledby="hero-title" className="relative min-h-svh">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-midnight/80 via-midnight/35 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-midnight/45 to-transparent max-sm:hidden" aria-hidden />
      <div className="relative flex min-h-svh flex-col justify-end px-5 pb-16 sm:px-12 sm:pb-20 lg:px-20">
        <div className="max-w-[44rem]">
          <MaskHeading as="h1" id="hero-title" className="display on-art text-[clamp(2.5rem,6.6vw,5.4rem)] text-warm-ivory" lines={["BEYOND", "THE HORIZON"]} />
          <p data-reveal="up" className="on-art mt-5 font-display text-[clamp(1.2rem,1rem+0.8vw,1.6rem)] text-golden-sand">{portfolio.name}</p>
          <p data-reveal="up" className="on-art mt-2 max-w-[30rem] text-[clamp(1rem,0.95rem+0.25vw,1.15rem)] text-warm-ivory">{portfolio.tagline}</p>
          <div data-reveal="up" className="pointer-events-auto mt-7">
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection("about"); }} className="btn btn-primary">Explore <Arrow /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
