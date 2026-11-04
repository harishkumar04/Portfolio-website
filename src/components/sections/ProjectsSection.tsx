"use client";

import { useEffect, useRef } from "react";
import { projectById, projects } from "@/config/projects";
import { chooseProject, stepProject } from "@/lib/journey";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { useNavigationStore } from "@/store/navigationStore";
import type { Project } from "@/types";
import { Arrow, Eyebrow, MaskHeading } from "./shared";

/** Scene 04: the cargo ship. Each project is a shipment with its own manifest. */
export function ProjectsSection() {
  const ref = useRef<HTMLElement>(null);
  useSectionReveal(ref);
  const selectedId = useNavigationStore((s) => s.selectedProject);
  const hovered = useNavigationStore((s) => s.hovered);
  const setHovered = useNavigationStore((s) => s.setHovered);
  const project = projectById(selectedId);

  // focus follows the interaction: into the manifest when one opens, back to its row when it closes
  const heading = useRef<HTMLHeadingElement>(null);
  const lastId = useRef<string | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (selectedId) { heading.current?.focus({ preventScroll: true }); lastId.current = selectedId; }
    else if (lastId.current) document.getElementById(`row-${lastId.current}`)?.focus({ preventScroll: true });
  }, [selectedId]);

  return (
    <section id="projects" ref={ref} aria-labelledby="projects-title" className="relative pt-[46svh] pb-16 lg:min-h-[160svh] lg:pt-0 lg:pb-0">
      <div className="px-4 sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:justify-start lg:px-24 xl:pl-32">
        <div className="surface pointer-events-auto w-full p-6 sm:p-8 lg:max-h-[calc(100svh-8rem)] lg:max-w-[35rem] lg:overflow-y-auto slim-scroll">
          {!project ? (
            <>
              <Eyebrow num="04">Project manifest</Eyebrow>
              <MaskHeading id="projects-title" lines={["Engineering ideas.", "Built into reality."]} />
              <p data-reveal="up" className="copy mt-3 text-sm">Every project is a shipment. Open one here, on the ship, or on the container the crane is carrying.</p>
              <ol data-reveal="group" className="mt-5 border-t border-warm-ivory/10">
                {projects.map((p) => {
                  const hot = hovered === `project:${p.id}`;
                  return (
                    <li key={p.id} data-item className="border-b border-warm-ivory/10">
                      <button
                        id={`row-${p.id}`}
                        type="button"
                        onClick={() => chooseProject(p.id)}
                        onMouseEnter={() => setHovered(`project:${p.id}`)}
                        onMouseLeave={() => setHovered(null)}
                        className="group grid w-full min-h-[4rem] grid-cols-[4.2rem_1fr_auto] items-center gap-3 py-3 text-left"
                      >
                        <span className={`font-mono text-[0.68rem] tracking-[0.18em] transition-colors ${hot ? "text-golden-sand" : "text-sunset-amber"}`}>{p.code}</span>
                        <span>
                          <span className={`block transition-colors ${hot ? "text-golden-sand" : "text-warm-ivory"}`}>{p.title}</span>
                          <span className="meta mt-0.5 block">{p.category}</span>
                        </span>
                        <span className="arrow text-sunset-amber opacity-60 transition-all group-hover:translate-x-1 group-hover:opacity-100" aria-hidden>→</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : (
            <Manifest key={project.id} p={project} headingRef={heading} />
          )}
        </div>
      </div>
    </section>
  );
}

function Manifest({ p, headingRef }: { p: Project; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const i = projects.findIndex((x) => x.id === p.id);
  let n = 0;
  const r = () => ({ "--i": n++ } as React.CSSProperties);
  return (
    <article aria-labelledby="manifest-title">
      <div className="rise flex items-center justify-between gap-3" style={r()}>
        <button type="button" onClick={() => chooseProject(null)} className="btn btn-quiet"><span aria-hidden>←</span> Manifest</button>
        <div className="flex items-center gap-2">
          <span className="meta mr-1" aria-live="polite">{i + 1} / {projects.length}</span>
          <button type="button" onClick={() => stepProject(-1)} className="btn btn-quiet !px-3" aria-label="Previous project">←</button>
          <button type="button" onClick={() => stepProject(1)} className="btn btn-quiet !px-3" aria-label="Next project">→</button>
        </div>
      </div>

      <p className="eyebrow rise mt-6" style={r()}>{p.code} · {p.category}</p>
      <h2 id="manifest-title" ref={headingRef} tabIndex={-1} className="h-section rise mt-2 text-[clamp(1.7rem,1.3rem+1.6vw,2.4rem)] outline-none" style={r()}>{p.title}</h2>
      <p className="lede rise mt-3" style={r()}>{p.summary}</p>

      {p.problem && <Part label="The problem" style={r()}>{p.problem}</Part>}
      {p.solution && <Part label="The solution" style={r()}>{p.solution}</Part>}

      {p.layers && (
        <div className="rise mt-6" style={r()}>
          <p className="meta">Architecture</p>
          <div className="rule mt-2 mb-3" />
          <ol className="relative ml-1 border-l border-sunset-amber/45 pl-5">
            {p.layers.map((l, k) => (
              <li key={l.label} className="rise relative pb-3 last:pb-0" style={{ "--i": n + k } as React.CSSProperties}>
                <span className="absolute top-[0.5rem] -left-[1.62rem] h-2 w-2 rounded-full bg-sunset-amber" aria-hidden />
                <p className="meta !text-sunset-amber/90">{l.label}</p>
                <p className="mt-1 flex flex-wrap gap-1.5">{l.items.map((it) => <span key={it} className="chip">{it}</span>)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
      {p.layers && (n += p.layers.length) && null}

      <div className="rise mt-6" style={r()}>
        <p className="meta">Technology stack</p>
        <div className="rule mt-2 mb-3" />
        <p className="flex flex-wrap gap-1.5">{p.stack.map((t, k) => <span key={t} className="chip rise" style={{ "--i": n + k } as React.CSSProperties}>{t}</span>)}</p>
      </div>

      {p.contribution && <Part label="My contribution" style={r()}>{p.contribution}</Part>}
      {p.decisions && p.decisions.length > 0 && (
        <Part label="Key decisions" style={r()}>
          <ul className="list-disc space-y-1 pl-5 marker:text-sunset-amber/70">{p.decisions.map((d) => <li key={d}>{d}</li>)}</ul>
        </Part>
      )}
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt={`${p.title} architecture`} loading="lazy" className="rise mt-6 w-full rounded-[var(--radius-ui)] border border-warm-ivory/10" style={r()} />
      )}

      {(p.repo || p.demo) && (
        <div className="rise mt-7 flex flex-wrap gap-3" style={r()}>
          {p.repo && <a href={p.repo} target="_blank" rel="noopener noreferrer" className="btn btn-primary">GitHub repository <Arrow /></a>}
          {p.demo && <a href={p.demo} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Live demo <Arrow /></a>}
        </div>
      )}
    </article>
  );
}

function Part({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="rise mt-6" style={style}>
      <p className="meta">{label}</p>
      <div className="rule mt-2 mb-3" />
      <div className="copy text-[0.95rem]">{children}</div>
    </div>
  );
}
