"use client";

import { useRef } from "react";
import { projects } from "@/config/projects";
import { skillCategories, skillById } from "@/config/skills";
import { chooseProject, chooseSkill, scrollToSection } from "@/lib/journey";
import { projectsUsing } from "@/lib/skillContext";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { useNavigationStore } from "@/store/navigationStore";
import { Eyebrow, MaskHeading } from "./shared";

/** Scene 03: the container terminal. Six containers, each opening one manifest of tools. */
export function SkillsSection() {
  const ref = useRef<HTMLElement>(null);
  useSectionReveal(ref);
  const selected = useNavigationStore((s) => s.selectedSkill);
  const cat = skillById(selected) ?? skillCategories[0];
  const hovered = useNavigationStore((s) => s.hovered);
  const setHovered = useNavigationStore((s) => s.setHovered);

  const openProject = (id: string) => { scrollToSection("projects"); chooseProject(id, { push: false }); };

  const onKey = (e: React.KeyboardEvent) => {
    const i = skillCategories.findIndex((c) => c.id === cat.id);
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = skillCategories[(i + step + skillCategories.length) % skillCategories.length];
    chooseSkill(next.id);
    (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-cat="${next.id}"]`)?.focus();
  };

  return (
    <section id="skills" ref={ref} aria-labelledby="skills-title" className="relative pt-[46svh] pb-16 lg:min-h-[140svh] lg:pt-0 lg:pb-0">
      <div className="px-4 sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:justify-end lg:px-24 xl:pr-32">
        <div className="surface pointer-events-auto w-full p-6 sm:p-8 lg:max-h-[calc(100svh-8rem)] lg:max-w-[34rem] lg:overflow-y-auto slim-scroll">
          <Eyebrow num="03">Container terminal</Eyebrow>
          <MaskHeading id="skills-title" lines={["Six containers.", "One toolkit."]} />
          <p data-reveal="up" className="copy mt-3 text-sm">Pick a container on the quay, or here, to open its manifest. Descriptions define each tool; no ratings.</p>

          <div data-reveal="group" role="tablist" aria-label="Skill containers" aria-orientation="vertical" onKeyDown={onKey} className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {skillCategories.map((c) => {
              const on = c.id === cat.id;
              return (
                <button
                  key={c.id}
                  data-item
                  data-cat={c.id}
                  role="tab"
                  type="button"
                  id={`tab-${c.id}`}
                  aria-selected={on}
                  aria-controls="skill-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => chooseSkill(c.id)}
                  onMouseEnter={() => setHovered(`skill:${c.id}`)}
                  onMouseLeave={() => setHovered(null)}
                  className={`min-h-[4.2rem] rounded-[var(--radius-ui)] border px-3 py-2.5 text-left transition-colors duration-300 ${on ? "border-sunset-amber bg-sunset-amber/10" : hovered === `skill:${c.id}` ? "border-sunset-amber/60 bg-sunset-amber/[0.05]" : "border-warm-ivory/12 hover:border-warm-ivory/30"}`}
                >
                  <span className={`block font-mono text-[0.62rem] tracking-[0.2em] ${on ? "text-sunset-amber" : "text-muted-grey"}`}>{c.code}</span>
                  <span className="mt-1 block text-[0.82rem] leading-snug text-warm-ivory">{c.label}</span>
                </button>
              );
            })}
          </div>

          <div key={cat.id} id="skill-panel" role="tabpanel" aria-labelledby={`tab-${cat.id}`} tabIndex={0} className="mt-6">
            <div className="rise">
              <p className="meta">{cat.code} · {cat.items.length} items</p>
              <p className="mt-1 text-sm text-muted-grey">{cat.blurb}</p>
            </div>
            <ul className="mt-4 divide-y divide-warm-ivory/10 border-y border-warm-ivory/10">
              {cat.items.map((it, i) => {
                const used = projectsUsing(it.name);
                return (
                  <li key={it.name} className="rise py-2.5" style={{ "--i": i + 1 } as React.CSSProperties}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-warm-ivory">{it.name}</p>
                      {used.length > 0 && (
                        <p className="flex flex-wrap gap-x-2">
                          {used.map((p) => (
                            <button key={p.id} type="button" onClick={() => openProject(p.id)} title={`Used in ${p.title}`} className="font-mono text-[0.64rem] tracking-[0.14em] text-sunset-amber/90 transition-colors hover:text-golden-sand">{p.code}</button>
                          ))}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-grey">{it.description}</p>
                  </li>
                );
              })}
            </ul>
            {used(cat) && <p className="meta mt-3">Project codes link to the cargo manifest.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

const used = (c: (typeof skillCategories)[number]) => c.items.some((i) => projectsUsing(i.name).length > 0 && projects.length > 0);
