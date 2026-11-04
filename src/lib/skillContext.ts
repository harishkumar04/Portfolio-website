import { projects } from "@/config/projects";
import type { Project } from "@/types";

const norm = (s: string) => s.toLowerCase().replace(/^(aws|amazon)\s+/, "").replace(/\s*\(.*\)/, "").trim();

/** Projects whose documented stack mentions this technology (practical context, never invented). */
export function projectsUsing(skill: string): Project[] {
  const n = norm(skill);
  return projects.filter((p) => p.stack.some((t) => { const m = norm(t); return m === n || m.includes(n) || n.includes(m); }));
}
