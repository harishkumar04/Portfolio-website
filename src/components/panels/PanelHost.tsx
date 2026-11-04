"use client";

import { useNavigationStore } from "@/store/navigationStore";
import { AboutPanel } from "./AboutPanel";
import { SkillsPanel } from "./SkillsPanel";
import { ProjectsPanel } from "./ProjectsPanel";
import { ExperiencePanel } from "./ExperiencePanel";
import { ContactPanel } from "./ContactPanel";

const PANELS = { about: AboutPanel, skills: SkillsPanel, projects: ProjectsPanel, experience: ExperiencePanel, contact: ContactPanel } as const;

/** Shows the content panel for the current destination. */
export function PanelHost() {
  const current = useNavigationStore((s) => s.current);
  const open = useNavigationStore((s) => s.panelOpen);
  const entered = useNavigationStore((s) => s.entered);
  if (!entered || !open || current === "home") return null;
  const P = PANELS[current];
  return <P key={current} />;
}
