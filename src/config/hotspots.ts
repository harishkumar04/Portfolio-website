import { projects } from "@/config/projects";
import { skillCategories } from "@/config/skills";
import { destinationById } from "@/config/navigation";
import type { DestinationId } from "@/types";

/**
 * Clickable regions of the harbor painting (1672 x 941 source pixels), shared by the WebGL scene
 * and the no-WebGL fallback.
 *  - nav:     parts of the harbor that jump to a section (always available)
 *  - skill:   the six foreground containers (active in Skills)
 *  - project: six container columns on the ship (active in Projects)
 * `layer` is the painted layer a region belongs to (its depth is used for the 3D hit area).
 */
export type HotspotKind = "nav" | "skill" | "project";

export interface Hotspot {
  key: string;
  kind: HotspotKind;
  /** Section id (nav), skill category id, or project id */
  target: string;
  layer: string;
  marker: [number, number];
  polygons: [number, number][][];
  /** Shown in the hover label */
  label: string;
}

const rect = (x0: number, y0: number, x1: number, y1: number): [number, number][] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

const nav = (id: DestinationId, layer: string, marker: [number, number], polygons: [number, number][][]): Hotspot => {
  const d = destinationById(id);
  return { key: `nav:${id}`, kind: "nav", target: id, layer, marker, polygons, label: d.title };
};

const navSpots: Hotspot[] = [
  nav("about", "tower", [236, 196], [[[48, 135], [70, 108], [190, 98], [240, 34], [345, 38], [426, 148], [426, 190], [394, 282], [330, 296], [178, 296], [110, 286], [48, 255]]]),
  nav("experience", "tower", [252, 430], [rect(178, 297, 330, 562)]),
  nav("skills", "foreground", [150, 770], [[[0, 338], [178, 344], [182, 460], [252, 468], [256, 548], [316, 552], [320, 680], [388, 680], [391, 748], [520, 748], [522, 800], [578, 800], [580, 941], [0, 941]]]),
  nav("projects", "ship", [985, 600], [[[598, 545], [700, 500], [700, 455], [752, 428], [770, 398], [790, 398], [815, 428], [885, 455], [885, 482], [1095, 480], [1100, 440], [1112, 440], [1118, 480], [1210, 515], [1228, 570], [1170, 660], [1128, 745], [900, 742], [700, 712], [598, 700]]]),
  nav("contact", "sea", [1400, 690], [[[1232, 400], [1672, 380], [1672, 896], [1360, 830], [1160, 790], [1132, 744], [1176, 650], [1230, 572]]]),
];

/** The six foreground containers, one per skill category, in manifest order. */
const skillShapes: Record<string, { marker: [number, number]; polygons: [number, number][][] }> = {
  cloud: { marker: [90, 420], polygons: [rect(0, 345, 178, 498)] },
  containers: { marker: [90, 600], polygons: [rect(0, 500, 178, 690)] },
  cicd: { marker: [226, 600], polygons: [rect(182, 536, 268, 668)] },
  iac: { marker: [216, 502], polygons: [rect(182, 468, 252, 536)] },
  observability: { marker: [292, 612], polygons: [rect(268, 550, 316, 668)] },
  languages: { marker: [130, 830], polygons: [rect(0, 712, 262, 941), rect(350, 802, 578, 941)] },
};

const skillSpots: Hotspot[] = skillCategories.map((c) => ({
  key: `skill:${c.id}`, kind: "skill", target: c.id, layer: "foreground",
  marker: skillShapes[c.id].marker, polygons: skillShapes[c.id].polygons,
  label: c.label,
}));

/** Container columns along the ship's deck stacks, one per project. */
const PROJECT_X0 = 840, PROJECT_W = 60;
const projectSpots: Hotspot[] = projects.map((p, i) => {
  const x0 = PROJECT_X0 + i * PROJECT_W;
  return {
    key: `project:${p.id}`, kind: "project", target: p.id, layer: "ship",
    marker: [x0 + PROJECT_W / 2, 480], polygons: [rect(x0 + 1, 484, x0 + PROJECT_W - 1, 562)],
    label: p.title,
  };
});

export const hotspots: Hotspot[] = [...navSpots, ...skillSpots, ...projectSpots];
export const hotspotByKey = (key: string | null) => hotspots.find((h) => h.key === key);
