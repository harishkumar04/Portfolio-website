"use client";

import { useRef } from "react";
import { portfolio } from "@/config/portfolio";
import { scrollToSection } from "@/lib/journey";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { Arrow, Eyebrow, MaskHeading } from "./shared";

/** Scene 06: the open sea. The journey ends on the horizon. */
export function ContactSection() {
  const ref = useRef<HTMLElement>(null);
  useSectionReveal(ref);
  const { email } = portfolio.contact;
  return (
    <section id="contact" ref={ref} aria-labelledby="contact-title" className="relative pt-[40svh] pb-28 lg:min-h-[150svh] lg:pt-0 lg:pb-0">
      <div className="pointer-events-none absolute inset-x-0 top-[20svh] bottom-0 bg-gradient-to-r from-midnight/75 via-midnight/30 to-transparent lg:from-midnight/65" aria-hidden />
      <div className="relative px-5 sm:px-12 lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:px-24">
        <div className="max-w-[34rem]">
          <Eyebrow num="06">Beyond the horizon</Eyebrow>
          <MaskHeading id="contact-title" className="display on-art mt-3 text-[clamp(1.9rem,1.25rem+2.5vw,3.5rem)]" lines={["EVERY GREAT JOURNEY", "STARTS WITH A", "CONNECTION."]} />
          <p data-reveal="up" className="lede on-art mt-5">{portfolio.closingLine}</p>
          <div data-reveal="group" className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <a data-item href={`mailto:${email}?subject=${encodeURIComponent("Hello from your portfolio")}`} className="btn btn-primary">Email me <Arrow /></a>
            <a data-item href={portfolio.links.linkedin.href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">LinkedIn <Arrow /></a>
            <a data-item href={portfolio.links.github.href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">GitHub <Arrow /></a>
            <a data-item href={portfolio.resume.href} download={portfolio.resume.filename} className="btn btn-secondary">Resume <span className="arrow" aria-hidden>↓</span></a>
          </div>
          <p data-reveal="up" className="meta on-art mt-5 !text-warm-ivory/80">{email} · {portfolio.contact.location}</p>
        </div>
      </div>

      <footer className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-warm-ivory/10 bg-midnight/70 px-5 py-4 sm:px-12 lg:px-24">
        <p className="meta">© {portfolio.name}</p>
        <button type="button" onClick={() => scrollToSection("home")} className="btn btn-quiet">Back to the beginning <span aria-hidden>↑</span></button>
      </footer>
    </section>
  );
}
