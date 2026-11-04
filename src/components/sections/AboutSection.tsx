"use client";

import { useRef } from "react";
import { portfolio } from "@/config/portfolio";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { Field, MaskHeading } from "./shared";

/** About: short introduction, education, certification. */
export function AboutSection() {
  const ref = useRef<HTMLElement>(null);
  useSectionReveal(ref);
  const btech = portfolio.education.find((e) => e.id === "btech")!;

  return (
    <section id="about" ref={ref} aria-labelledby="about-title" className="relative pt-[48svh] lg:min-h-[120svh] lg:pt-0">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:justify-end lg:px-24 xl:pr-36">
        <div className="panel pointer-events-auto">
          <MaskHeading id="about-title" lines={["Hi, I'm Harish."]} />
          <p data-reveal="up" className="copy mt-3">{portfolio.intro[1]}</p>
          <Field label="Education">
            <p>{btech.title}</p>
            <p className="text-sm text-muted-grey">{btech.organization} · {btech.period}</p>
          </Field>
          <Field label="Certification">
            <p>{portfolio.certifications[0].title}</p>
          </Field>
        </div>
      </div>
    </section>
  );
}
