"use client";

import { useRef } from "react";
import { portfolio } from "@/config/portfolio";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { Block, Eyebrow, MaskHeading } from "./shared";

const INTERESTS = ["Cloud Infrastructure", "DevOps Engineering", "Platform Engineering", "Site Reliability Engineering", "Automation and Observability"];

/** Scene 02: the control tower. */
export function AboutSection() {
  const ref = useRef<HTMLElement>(null);
  useSectionReveal(ref);
  const [, lede, copy] = portfolio.intro;
  const btech = portfolio.education.find((e) => e.id === "btech")!;
  const twelfth = portfolio.education.find((e) => e.id === "12th")!;
  const aws = portfolio.certifications[0];
  const otherCerts = portfolio.certifications.slice(1);
  const interns = portfolio.experience.filter((e) => e.kind === "internship");

  return (
    <section id="about" ref={ref} aria-labelledby="about-title" className="relative pt-[46svh] pb-16 lg:min-h-[140svh] lg:pt-0 lg:pb-0">
      <div className="px-4 sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:justify-end lg:px-24 xl:pr-32">
        <div className="surface pointer-events-auto w-full p-6 sm:p-8 lg:max-h-[calc(100svh-8rem)] lg:max-w-[33rem] lg:overflow-y-auto slim-scroll">
          <Eyebrow num="02">About the operator</Eyebrow>
          <MaskHeading id="about-title" lines={["Hi, I'm Harish."]} />
          <p data-reveal="up" className="lede mt-4">{lede}</p>
          <p data-reveal="up" className="copy mt-3">{copy}</p>

          <Block label="Education">
            <p className="text-warm-ivory">{btech.title}</p>
            <p className="text-sm text-muted-grey">{btech.organization} · {btech.period} · {btech.details?.[0]}</p>
            <p className="mt-2 text-sm text-muted-grey">{twelfth.title} · {twelfth.period} · {twelfth.details?.[0]}</p>
          </Block>

          <Block label="Certifications">
            <div className="flex items-center gap-3 rounded-[var(--radius-ui)] border border-sunset-amber/50 bg-sunset-amber/[0.07] px-4 py-3">
              <span className="font-mono text-[0.62rem] tracking-[0.2em] text-sunset-amber uppercase">Certified</span>
              <span className="text-warm-ivory">{aws.title}</span>
            </div>
            <p className="mt-3 text-sm text-muted-grey">{otherCerts.map((c) => `${c.title} (${c.organization})`).join(" · ")}</p>
          </Block>

          <Block label="Internships">
            <ul className="space-y-1.5 text-sm">
              {interns.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="text-warm-ivory">{e.title}, {e.organization}</span>
                  <span className="meta">{e.period}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block label="Current interests">
            <div data-reveal="group" className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => <span key={i} data-item className="chip">{i}</span>)}
            </div>
          </Block>

          <Block label="Where I am heading">
            <p className="copy text-sm">{portfolio.summary.split(". ").slice(-1)[0]}</p>
          </Block>
        </div>
      </div>
    </section>
  );
}
