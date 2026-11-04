"use client";

import { useRef } from "react";
import { projects, projectById } from "@/config/projects";
import { chooseProject, stepProject } from "@/lib/journey";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { useNavigationStore } from "@/store/navigationStore";
import { Arrow } from "./shared";

/** Projects: one selected project at a time (the first on arrival), highlighted on the ship. */
export function ProjectsSection() {
  const ref = useRef<HTMLElement>(null);
  useSectionReveal(ref);
  const selectedId = useNavigationStore((s) => s.selectedProject);
  const p = projectById(selectedId) ?? projects[0];
  const i = projects.findIndex((x) => x.id === p.id);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section id="projects" ref={ref} aria-label="Projects" className="relative pt-[48svh] lg:min-h-[130svh] lg:pt-0">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:justify-start lg:px-24 xl:pl-36">
        <div className="panel panel-wide pointer-events-auto" data-reveal="up">
          <div className="flex items-center justify-between">
            <p className="label" aria-live="polite">{pad(i + 1)} / {pad(projects.length)}</p>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => stepProject(-1)} className="btn-icon" aria-label="Previous project"><span aria-hidden>←</span></button>
              <button type="button" onClick={() => stepProject(1)} className="btn-icon" aria-label="Next project"><span aria-hidden>→</span></button>
            </div>
          </div>

          <article key={p.id} className="mt-3">
            <h2 className="h-panel rise">{p.title}</h2>
            <p className="copy rise mt-2.5" style={{ "--i": 1 } as React.CSSProperties}>{p.summary}</p>
            <p className="rise mt-4 flex flex-wrap gap-1.5" style={{ "--i": 2 } as React.CSSProperties}>
              {p.tags.map((t) => <span key={t} className="tag">{t}</span>)}
            </p>
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt={`${p.title}`} loading="lazy" className="rise mt-4 w-full rounded-[6px] border border-warm-ivory/12" style={{ "--i": 3 } as React.CSSProperties} />
            )}
            {(p.repo || p.demo) && (
              <p className="rise mt-5 flex flex-wrap gap-2" style={{ "--i": 3 } as React.CSSProperties}>
                {p.repo && <a href={p.repo} target="_blank" rel="noopener noreferrer" className="btn btn-primary">GitHub <Arrow /></a>}
                {p.demo && <a href={p.demo} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Live demo <Arrow /></a>}
              </p>
            )}
          </article>

          <div className="mt-5 flex gap-1.5 border-t border-warm-ivory/12 pt-4" role="group" aria-label="Choose a project">
            {projects.map((x, k) => (
              <button key={x.id} type="button" onClick={() => chooseProject(x.id)} aria-label={x.title} aria-current={x.id === p.id ? "true" : undefined} title={x.title}
                className={`grid h-9 flex-1 place-items-center rounded-[6px] border font-mono text-[0.72rem] transition-colors ${x.id === p.id ? "border-sunset-amber bg-sunset-amber text-midnight" : "border-warm-ivory/20 text-warm-ivory hover:border-sunset-amber/70"}`}>
                {k + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
