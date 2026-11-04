"use client";

import { useRef } from "react";
import { skillById, skillCategories } from "@/config/skills";
import { chooseSkill } from "@/lib/journey";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { useNavigationStore } from "@/store/navigationStore";
import { MaskHeading, SkillIcon } from "./shared";

/** Skills: six containers, each a category of technologies (names and icons only). */
export function SkillsSection() {
  const ref = useRef<HTMLElement>(null);
  useSectionReveal(ref);
  const selected = useNavigationStore((s) => s.selectedSkill);
  const cat = skillById(selected) ?? skillCategories[0];

  const onKey = (e: React.KeyboardEvent) => {
    const i = skillCategories.findIndex((c) => c.id === cat.id);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = skillCategories[(i + step + skillCategories.length) % skillCategories.length];
    chooseSkill(next.id);
    (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-cat="${next.id}"]`)?.focus();
  };

  return (
    <section id="skills" ref={ref} aria-labelledby="skills-title" className="relative pt-[48svh] lg:min-h-[120svh] lg:pt-0">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:justify-end lg:px-24 xl:pr-36">
        <div className="panel panel-wide pointer-events-auto">
          <MaskHeading id="skills-title" lines={["Skills"]} />
          <div data-reveal="up" role="tablist" aria-label="Skill categories" onKeyDown={onKey} className="mt-4 flex flex-wrap gap-1.5">
            {skillCategories.map((c) => {
              const on = c.id === cat.id;
              return (
                <button key={c.id} data-cat={c.id} role="tab" type="button" id={`tab-${c.id}`} aria-selected={on} aria-controls="skill-panel" tabIndex={on ? 0 : -1} onClick={() => chooseSkill(c.id)}
                  className={`min-h-9 rounded-[6px] border px-2.5 text-[0.85rem] transition-colors ${on ? "border-sunset-amber bg-sunset-amber text-midnight" : "border-warm-ivory/20 text-warm-ivory hover:border-sunset-amber/70"}`}>
                  {c.short}
                </button>
              );
            })}
          </div>
          <ul key={cat.id} id="skill-panel" role="tabpanel" aria-labelledby={`tab-${cat.id}`} className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-warm-ivory/12 pt-4">
            {cat.items.map((name, i) => (
              <li key={name} className="rise flex items-center gap-2.5 text-[0.95rem]" style={{ "--i": i } as React.CSSProperties}>
                <SkillIcon name={name} />
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
