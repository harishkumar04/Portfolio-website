"use client";

import { portfolio } from "@/config/portfolio";
import type { TimelineEntry } from "@/types";
import { Panel, SectionLabel } from "./Panel";

function Entry({ e }: { e: TimelineEntry }) {
  return (
    <li className="relative pb-5 pl-6 last:pb-0">
      <span className="absolute top-1.5 left-0 h-2.5 w-2.5 rounded-full border border-amber-300/70 bg-navy-950" aria-hidden />
      <span className="absolute top-4 bottom-0 left-[4.5px] w-px bg-cream/12" aria-hidden />
      {e.period && <p className="font-mono text-[10px] tracking-[0.2em] text-amber-300/80 uppercase">{e.period}</p>}
      <p className="mt-0.5 text-cream">{e.title}</p>
      {(e.organization || e.location) && (
        <p className="text-sm text-cream/60">{[e.organization, e.location].filter(Boolean).join(" · ")}</p>
      )}
      {e.details && (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-cream/75 marker:text-amber-400/60">
          {e.details.map((d) => <li key={d}>{d}</li>)}
        </ul>
      )}
    </li>
  );
}

export function ExperiencePanel() {
  return (
    <Panel id="experience">
      <SectionLabel>Experience</SectionLabel>
      <ol>{portfolio.experience.map((e) => <Entry key={e.id} e={e} />)}</ol>
      <SectionLabel>Education</SectionLabel>
      <ol>{portfolio.education.map((e) => <Entry key={e.id} e={e} />)}</ol>
      <SectionLabel>Certifications</SectionLabel>
      <ol>{portfolio.certifications.map((e) => <Entry key={e.id} e={e} />)}</ol>
      <SectionLabel>Milestones</SectionLabel>
      <ol>{portfolio.milestones.map((e) => <Entry key={e.id} e={e} />)}</ol>
    </Panel>
  );
}
