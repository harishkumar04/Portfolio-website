"use client";

import { useRef } from "react";
import { portfolio } from "@/config/portfolio";
import { scrollToSection } from "@/lib/journey";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { Arrow, MaskHeading } from "./shared";

/** Contact: the open sea. A short closing message and four ways to reach me. */
export function ContactSection() {
  const ref = useRef<HTMLElement>(null);
  useSectionReveal(ref);
  const { email } = portfolio.contact;
  return (
    <section id="contact" ref={ref} aria-labelledby="contact-title" className="relative pt-[44svh] pb-24 lg:min-h-[130svh] lg:pt-0 lg:pb-0">
      <div className="pointer-events-none absolute inset-x-0 top-[30svh] bottom-0 bg-gradient-to-r from-midnight/65 via-midnight/25 to-transparent" aria-hidden />
      <div className="relative px-5 sm:px-12 lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:px-24">
        <div className="max-w-[36rem]">
          <MaskHeading id="contact-title" className="display on-art text-[clamp(1.9rem,1.3rem+2.4vw,3.3rem)] text-warm-ivory" lines={["Every great journey", "starts with a connection."]} />
          <p data-reveal="up" className="on-art mt-4 text-[1.1rem] text-warm-ivory/90">{portfolio.closingLine}</p>
          <div data-reveal="up" className="pointer-events-auto mt-7 flex flex-wrap gap-2.5">
            <a href={`mailto:${email}`} className="btn btn-primary">Email <Arrow /></a>
            <a href={portfolio.links.github.href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary !px-4">GitHub <Arrow /></a>
            <a href={portfolio.links.linkedin.href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary !px-4">LinkedIn <Arrow /></a>
            <a href={portfolio.resume.href} download={portfolio.resume.filename} className="btn btn-secondary !px-4">Resume <span className="arrow" aria-hidden>↓</span></a>
          </div>
          <p data-reveal="up" className="on-art mt-4 text-sm text-warm-ivory/80">{email}</p>
        </div>
      </div>
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex justify-end px-5 py-4 sm:px-12 lg:px-24">
        <button type="button" onClick={() => scrollToSection("home")} className="on-art text-sm text-warm-ivory/80 transition-colors hover:text-golden-sand">Back to top ↑</button>
      </div>
    </section>
  );
}
