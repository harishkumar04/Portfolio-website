import { mulberry32 } from "./rng";
import { CONTAINER_COLORS, CONTAINER_W, LEN_20, LEN_40, type ContainerDetail, type ContainerInstance } from "@/components/experience/Container";
import type { ShipSpec } from "./shipLayout";
import { QUAY_Y, SUN_DIR } from "./scene";
import type { QualityTier } from "@/store/navigationStore";

/** World layout. Quay edge runs along X at z = 0, land is +Z, open sea is -Z. */
export const HARBOR = {
  quayY: QUAY_Y,
  landX: [-620, 330] as const,
  landZ: 420,
  mainShip: { x: -120, z: -18.5 },
  craneXs: [-45, 0, 45],
  tower: { x: -215, z: 46 },
};

export const MAIN_SHIP: ShipSpec = { name: "Horizon", length: 200, beam: 30, draft: 9, freeboard: 12, seed: 11, bridgeU: 0.2, maxStack: 7 };
export const DEPARTING_SHIP: ShipSpec = { name: "Meridian", length: 160, beam: 26, draft: 8, freeboard: 11, seed: 23, bridgeU: 0.18, maxStack: 6 };
export const DISTANT_SHIPS: { spec: ShipSpec; pos: [number, number]; yaw: number; speed: number }[] = [
  { spec: { name: "Atlas", length: 230, beam: 34, draft: 10, freeboard: 12, seed: 5, bridgeU: 0.22, maxStack: 7 }, pos: [-804, -320], yaw: 0.02, speed: 1.3 },
  { spec: { name: "Northstar", length: 180, beam: 28, draft: 9, freeboard: 11, seed: 8, bridgeU: 0.2, maxStack: 6 }, pos: [-576, -333], yaw: -0.04, speed: 1.0 },
  { spec: { name: "Vega", length: 260, beam: 38, draft: 11, freeboard: 13, seed: 9, bridgeU: 0.24, maxStack: 7 }, pos: [-934, -1132], yaw: 0.03, speed: 0.9 },
  { spec: { name: "Orion", length: 150, beam: 24, draft: 8, freeboard: 10, seed: 3, bridgeU: 0.2, maxStack: 5 }, pos: [-689, -678], yaw: 0.05, speed: 0.8 },
];

/** Horizontal sun-ward heading shared by ships leaving the harbor. */
export const SEAWARD = (() => {
  const n = Math.hypot(SUN_DIR.x, SUN_DIR.z);
  return { dx: SUN_DIR.x / n, dz: SUN_DIR.z / n };
})();
export const headingFor = (dx: number, dz: number) => Math.atan2(-dz, dx);

export interface YardBatch {
  key: string;
  detail: ContainerDetail;
  length: number;
  items: ContainerInstance[];
}

/** Rows of stacked containers split into detail tiers so far blocks stay cheap. */
export function buildYard(quality: QualityTier): YardBatch[] {
  const rnd = mulberry32(2024);
  const batches = new Map<string, YardBatch>();
  const add = (detail: ContainerDetail, length: number, it: ContainerInstance) => {
    const key = `${detail}|${length}`;
    let b = batches.get(key);
    if (!b) { b = { key, detail, length, items: [] }; batches.set(key, b); }
    b.items.push(it);
  };
  const nBlocks = quality === "low" ? 9 : 18;
  const colPitch = CONTAINER_W + 0.3, rowPitch = LEN_40 + 0.55;
  const cols = 6, rowsPer = 5;
  const groups = quality === "low" ? [62] : [62, 140];
  groups.forEach((z0, gi) => {
    for (let bi = 0; bi < nBlocks; bi++) {
      const bx = -40 - bi * 30 * (quality === "low" ? 2 : 1);
      const near = bx > -250 && gi === 0;
      const detail: ContainerDetail =
        near ? (quality === "high" ? "full" : "coarse")
          : gi === 0 && quality === "high" ? "coarse"
            : "simple";
      const base = 1 + rnd() * 3;
      const pal = [CONTAINER_COLORS[Math.floor(rnd() * CONTAINER_COLORS.length)], CONTAINER_COLORS[Math.floor(rnd() * CONTAINER_COLORS.length)]];
      for (let c = 0; c < cols; c++) for (let r = 0; r < rowsPer; r++) {
        if (rnd() < 0.06) continue;
        const h = Math.max(1, Math.min(5, Math.round(base + (rnd() - 0.35) * 2.6)));
        const x = bx - c * colPitch;
        const z = z0 + r * rowPitch;
        const twenty = rnd() < 0.18;
        for (let l = 0; l < h; l++) {
          const color = rnd() < 0.55 ? pal[c % 2] : CONTAINER_COLORS[Math.floor(rnd() * CONTAINER_COLORS.length)];
          const y = QUAY_Y + 1.2955 + l * 2.591;
          if (twenty) {
            const d = detail === "full" ? "coarse" : detail;
            add(d, LEN_20, { position: [x, y, z - 3.3], rotationY: Math.PI / 2, color });
            add(d, LEN_20, { position: [x, y, z + 3.3], rotationY: Math.PI / 2, color: rnd() < 0.5 ? color : CONTAINER_COLORS[Math.floor(rnd() * CONTAINER_COLORS.length)] });
          } else add(detail, LEN_40, { position: [x, y, z], rotationY: Math.PI / 2, color });
        }
      }
    }
  });
  return [...batches.values()];
}
