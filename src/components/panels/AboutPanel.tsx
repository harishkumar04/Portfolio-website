"use client";

import { portfolio } from "@/config/portfolio";
import { useNavigationStore } from "@/store/navigationStore";
import { Chip, ExternalLink, Panel, SectionLabel } from "./Panel";

export function AboutPanel() {
  const go = useNavigationStore((s) => s.go);
  const [first, ...rest] = portfolio.intro;
  const edu = portfolio.education[0];
  const now = portfolio.experience[0];
  const cert = portfolio.certifications[0];
  return (
    <Panel id="about">
      <p className="text-xl text-cream">{first}</p>
      {rest.map((l) => <p key={l} className="mt-3 leading-relaxed text-cream/80">{l}</p>)}
      <SectionLabel>Focus</SectionLabel>
      <div className="flex flex-wrap gap-2">{portfolio.interests.map((i) => <Chip key={i}>{i}</Chip>)}</div>
      <SectionLabel>Summary</SectionLabel>
      <p className="leading-relaxed text-cream/80">{portfolio.summary}</p>
      <SectionLabel>At a glance</SectionLabel>
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
        <dt className="text-cream/50">Now</dt><dd className="text-cream/90">{now.title}, {now.organization} <span className="text-cream/50">({now.period})</span></dd>
        <dt className="text-cream/50">Study</dt><dd className="text-cream/90">{edu.title}, {edu.organization} <span className="text-cream/50">({edu.period})</span></dd>
        <dt className="text-cream/50">Certified</dt><dd className="text-cream/90">{cert.title}</dd>
        <dt className="text-cream/50">Based in</dt><dd className="text-cream/90">{portfolio.contact.location}</dd>
      </dl>
      <div className="mt-7 flex flex-wrap gap-2">
        <ExternalLink href={portfolio.links.github.href}>{portfolio.links.github.label}</ExternalLink>
        <ExternalLink href={portfolio.links.linkedin.href}>{portfolio.links.linkedin.label}</ExternalLink>
        <button type="button" onClick={() => go("projects")} className="rounded-full bg-amber-400/90 px-4 py-1.5 text-sm font-medium text-navy-950 transition hover:bg-amber-300">See the projects</button>
      </div>
    </Panel>
  );
}
