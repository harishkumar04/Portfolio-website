import { mulberry32 } from "./rng";
import { CONTAINER_H, CONTAINER_W, LEN_40, CONTAINER_COLORS } from "@/components/experience/Container";
import type { ContainerInstance } from "@/components/experience/Container";

/** Ship local axes: +X bow, +Y up, +Z starboard. Water line at y = 0. */
export interface ShipSpec {
  name: string;
  length: number;
  beam: number;
  draft: number;
  freeboard: number;
  seed: number;
  /** Where the accommodation block sits (0 = stern, 1 = bow). */
  bridgeU: number;
  /** Max container stack height on the first bay (tapers towards the bow). */
  maxStack: number;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function beamFactor(u: number) {
  if (u < 0.24) { const t = u / 0.24; return 0.46 + 0.54 * (1 - Math.pow(1 - t, 2.2)); }
  if (u < 0.68) return 1;
  const t = (u - 0.68) / 0.32;
  return Math.pow(Math.max(0, 1 - t * t), 0.85);
}
export const bowMask = (u: number) => smooth(0.7, 1, u);
export const stemRake = (spec: ShipSpec) => spec.length * 0.05;

export function deckLevel(u: number, spec: ShipSpec) {
  const d = Math.abs(2 * u - 1);
  return spec.freeboard + 1.0 * Math.pow(d, 3) * (u > 0.5 ? 1.5 : 0.5);
}
export function keelLevel(u: number, spec: ShipSpec) {
  return -spec.draft * (1 - 0.55 * smooth(0.8, 1, u) - 0.25 * (1 - smooth(0, 0.1, u)));
}
export function halfWidthAt(u: number, y: number, spec: ShipSpec) {
  const base = beamFactor(u) * spec.beam * 0.5;
  if (y <= 0) {
    const k = keelLevel(u, spec);
    const s = Math.min(1, Math.max(0, (y - k) / (0 - k)));
    return base * 0.985 * Math.pow(1 - Math.pow(1 - s, 3), 1 / 3);
  }
  const t = Math.min(1, y / spec.freeboard);
  return base * (1 + 0.025 * t + 0.11 * bowMask(u) * t);
}
export const uToX = (u: number, spec: ShipSpec) => (u - 0.5) * spec.length;

export interface ShipLayout {
  bayCenters: number[];
  bayUs: number[];
  hatchHeight: number;
  rows: number[];
  heights: number[][];
  stacks: ContainerInstance[];
  /** Ship-local centre of the bottom cell of the open loading well (crane drops containers here). */
  slot: { x: number; y: number; z: number } | null;
}

/** Ships ride light: the red antifouling and bulbous bow show above the water. */
export const SHIP_LIFT = 1.2;
export const HATCH_H = 1.3;
export const BAY_PITCH = LEN_40 + 1.5;

export function computeShipLayout(spec: ShipSpec, slotBay: number | null = null, density = 1): ShipLayout {
  const rnd = mulberry32(spec.seed);
  const start = uToX(spec.bridgeU, spec) + 24 * (spec.length / 200);
  const end = uToX(0.955, spec);
  const nBays = Math.max(2, Math.floor((end - start) / BAY_PITCH));
  const bayCenters: number[] = [], bayUs: number[] = [], rows: number[] = [], heights: number[][] = [];
  const stacks: ContainerInstance[] = [];
  let slot: ShipLayout["slot"] = null;
  const pal = CONTAINER_COLORS;
  let clusterColor = pal[Math.floor(rnd() * pal.length)];

  for (let b = 0; b < nBays; b++) {
    const cx = start + LEN_40 / 2 + b * BAY_PITCH;
    const u = cx / spec.length + 0.5;
    bayCenters.push(cx); bayUs.push(u);
    const avail = halfWidthAt(u, deckLevel(u, spec), spec) * 2 - 1.2;
    let nRows = Math.floor(avail / (CONTAINER_W + 0.12));
    nRows = Math.max(1, Math.min(13, nRows));
    rows.push(nRows);
    const taper = 1 - (b / nBays) * 0.45;
    const hRow: number[] = [];
    const deck = deckLevel(u, spec) + HATCH_H;
    if (rnd() > 0.55) clusterColor = pal[Math.floor(rnd() * pal.length)];
    for (let r = 0; r < nRows; r++) {
      const centre = 1 - Math.abs(r - (nRows - 1) / 2) / (nRows / 2) * 0.28;
      let h = Math.round(spec.maxStack * taper * centre * (0.82 + rnd() * 0.28));
      h = Math.max(2, Math.min(spec.maxStack, h));
      if (rnd() < 0.05 * (1 / density)) h = Math.max(1, h - 2);
      const isSlot = slotBay === b && r === Math.floor(nRows / 2);
      if (slotBay === b && Math.abs(r - Math.floor(nRows / 2)) === 1) h = Math.max(h, 5);
      if (isSlot) h = 0;
      hRow.push(h);
      const z = (r - (nRows - 1) / 2) * (CONTAINER_W + 0.12);
      for (let l = 0; l < h; l++) {
        if (rnd() < 0.02 && l === h - 1) continue;
        const color = rnd() < 0.7 ? clusterColor : pal[Math.floor(rnd() * pal.length)];
        stacks.push({ position: [cx, deck + CONTAINER_H / 2 + l * CONTAINER_H, z], color });
      }
      if (isSlot) slot = { x: cx, y: deck + CONTAINER_H / 2, z };
    }
    heights.push(hRow);
  }
  return { bayCenters, bayUs, hatchHeight: HATCH_H, rows, heights, stacks, slot };
}

const layoutCache = new Map<string, ShipLayout>();
/** Memoised layout so ships and cranes that reference the same ship stay in sync. */
export function getShipLayout(spec: ShipSpec, slotBay: number | null = null, density = 1) {
  const key = `${spec.name}|${slotBay}|${density}`;
  let l = layoutCache.get(key);
  if (!l) { l = computeShipLayout(spec, slotBay, density); layoutCache.set(key, l); }
  return l;
}
