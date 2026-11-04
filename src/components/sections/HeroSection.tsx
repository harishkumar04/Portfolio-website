"use client";

import { useEffect, useRef } from "react";
import { portfolio } from "@/config/portfolio";
import { scrollToSection } from "@/lib/journey";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { useNavigationStore } from "@/store/navigationStore";
import { Arrow, MaskHeading } from "./shared";

/** Scene 01: arrival. The title sequence plays once the loading screen has handed over. */
export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const entered = useNavigationStore((s) => s.entered);
  useSectionReveal(ref, { manual: true });

  useEffect(() => {
    if (!entered) return;
    const tl = (ref.current as (HTMLElement & { __reveal?: gsap.core.Timeline }) | null)?.__reveal;
    const delay = useNavigationStore.getState().reducedMotion ? 0 : 1.1; // let the camera begin its move first
    const t = setTimeout(() => tl?.play(), delay * 1000);
    return () => clearTimeout(t);
  }, [entered]);

  const go = (id: "about" | "projects") => (e: React.MouseEvent) => { e.preventDefault(); scrollToSection(id); };

  return (
    <section id="home" ref={ref} aria-labelledby="hero-title" className="relative min-h-svh">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-midnight/85 via-midnight/35 to-transparent" aria-hidden />
      <div className="relative flex min-h-svh flex-col justify-end px-5 pb-20 sm:px-12 sm:pb-16 lg:px-20">
        <div className="max-w-[46rem]">
          <p data-reveal="up" className="eyebrow on-art">{portfolio.name}</p>
          <MaskHeading as="h1" id="hero-title" className="display on-art mt-4 text-[clamp(2.7rem,7.4vw,6.2rem)] text-warm-ivory" lines={["BEYOND", "THE HORIZON"]} />
          <p data-reveal="up" className="lede on-art mt-5 max-w-[34ch]">{portfolio.tagline}</p>
          <p data-reveal="up" className="meta on-art mt-4 !text-warm-ivory/80">
            {portfolio.disciplines.map((d, i) => <span key={d}>{i > 0 && <span className="mx-2 text-sunset-amber">|</span>}{d}</span>)}
          </p>
          <div data-reveal="group" className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <a data-item href="#about" onClick={go("about")} className="btn btn-primary">Explore my journey <Arrow /></a>
            <a data-item href="#projects" onClick={go("projects")} className="btn btn-secondary">View projects</a>
          </div>
        </div>
        <div data-reveal="fade" className="pointer-events-none mt-10 flex items-center gap-4 sm:absolute sm:right-12 sm:bottom-16 lg:right-24">
          <div className="scroll-line" aria-hidden />
          <p className="meta on-art !text-warm-ivory/80">Scroll to explore</p>
        </div>
      </div>
    </section>
  );
}
