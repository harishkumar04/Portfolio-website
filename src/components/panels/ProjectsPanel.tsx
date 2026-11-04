"use client";

import { projects } from "@/config/projects";
import { useNavigationStore } from "@/store/navigationStore";
import { Chip, ExternalLink, Panel, SectionLabel } from "./Panel";

export function ProjectsPanel() {
  const selected = useNavigationStore((s) => s.selectedProject);
  const setSelected = useNavigationStore((s) => s.setSelectedProject);
  const p = projects.find((x) => x.id === selected);
  return (
    <Panel id="projects">
      {!p ? (
        <>
          <p className="text-sm leading-relaxed text-cream/70">Every ship in the fleet is a project that left the harbor. Choose one to see how it was built.</p>
          <ul className="mt-5 space-y-2.5">
            {projects.map((x, i) => (
              <li key={x.id}>
                <button type="button" onClick={() => setSelected(x.id)} className="group w-full rounded-2xl border border-cream/10 bg-cream/[0.03] px-4 py-3.5 text-left transition hover:border-amber-300/40 hover:bg-amber-400/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
                  <p className="font-mono text-[10px] tracking-[0.25em] text-amber-300/80 uppercase">Vessel {String(i + 1).padStart(2, "0")} · {x.category}</p>
                  <p className="mt-1 text-cream">{x.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-cream/60">{x.overview}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <article aria-labelledby={`project-${p.id}`}>
          <button type="button" onClick={() => setSelected(null)} className="text-xs text-cream/60 transition hover:text-amber-200">← All projects</button>
          <p className="mt-4 font-mono text-[10px] tracking-[0.25em] text-amber-300/80 uppercase">{p.category}</p>
          <h3 id={`project-${p.id}`} className="mt-1 text-xl text-cream">{p.title}</h3>
          <SectionLabel>Overview</SectionLabel>
          <p className="leading-relaxed text-cream/80">{p.overview}</p>
          <SectionLabel>Problem</SectionLabel>
          <p className="leading-relaxed text-cream/80">{p.problem}</p>
          <SectionLabel>Architecture</SectionLabel>
          <p className="leading-relaxed text-cream/80">{p.architecture}</p>
          <SectionLabel>Stack</SectionLabel>
          <div className="flex flex-wrap gap-2">{p.stack.map((t) => <Chip key={t}>{t}</Chip>)}</div>
          <SectionLabel>Key decisions</SectionLabel>
          <ul className="list-disc space-y-1.5 pl-5 text-cream/80 marker:text-amber-400/70">{p.decisions.map((d) => <li key={d}>{d}</li>)}</ul>
          <div className="mt-7"><ExternalLink href={p.repo}>View repository on GitHub</ExternalLink></div>
        </article>
      )}
    </Panel>
  );
}
