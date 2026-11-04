"use client";

import { skillCategories } from "@/config/skills";
import { projects } from "@/config/projects";
import { useNavigationStore } from "@/store/navigationStore";
import { Panel, SectionLabel } from "./Panel";

export function SkillsPanel() {
  const selected = useNavigationStore((s) => s.selectedSkill) ?? skillCategories[0].id;
  const setSelected = useNavigationStore((s) => s.setSelectedSkill);
  const setProject = useNavigationStore((s) => s.setSelectedProject);
  const go = useNavigationStore((s) => s.go);
  const cat = skillCategories.find((c) => c.id === selected) ?? skillCategories[0];
  return (
    <Panel id="skills">
      <p className="text-sm leading-relaxed text-cream/70">Each container in the manifest holds one part of the toolkit. Pick a container to open it.</p>
      <div role="tablist" aria-label="Skill categories" className="mt-5 grid grid-cols-2 gap-2">
        {skillCategories.map((c) => (
          <button
            key={c.id}
            role="tab"
            type="button"
            aria-selected={c.id === cat.id}
            onClick={() => setSelected(c.id)}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition ${c.id === cat.id ? "border-amber-300/50 bg-amber-400/10 text-cream" : "border-cream/10 text-cream/75 hover:border-cream/25"}`}
          >
            <span className="h-6 w-2.5 shrink-0 rounded-[3px]" style={{ background: c.color }} aria-hidden />
            {c.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={cat.label}>
        <SectionLabel>{cat.label}</SectionLabel>
        <p className="text-sm text-cream/70">{cat.blurb}</p>
        <ul className="mt-4 space-y-2.5">
          {cat.items.map((it) => (
            <li key={it.name} className="rounded-xl border border-cream/8 bg-cream/[0.03] px-4 py-3">
              <p className="text-cream">{it.name}</p>
              <p className="mt-0.5 text-sm text-cream/65">{it.description}</p>
            </li>
          ))}
        </ul>
        {cat.relatedProjects.length > 0 && (
          <>
            <SectionLabel>Used in</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {cat.relatedProjects.map((pid) => {
                const pr = projects.find((x) => x.id === pid);
                if (!pr) return null;
                return (
                  <button key={pid} type="button" onClick={() => { setProject(pid); go("projects"); }} className="text-left text-sm text-amber-200/90 transition hover:text-amber-100">
                    {pr.title} →
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
