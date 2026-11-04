/**
 * The container-loading cycle as a pure function of time, shared by the procedural crane and
 * any GLB crane. Crane-local frame: y up from the quay top, -Z towards the ship (screen-right).
 *
 *  0-8    spreader returns empty to the truck lane while a loaded truck arrives
 *  8-13   lower onto the truck's container        13-14.5 lock
 *  14.5-19.5 hoist                                 19.5-31 trolley travels out over the ship
 *  31-38  lower into the hold well                 38-39.5 release
 *  39.5-44 hoist empty, wait, repeat
 */
export const CYCLE_T = 48;
export const CT_UP = 37;
export const CT_TRUCK = 3.9;
export const WELL_DEPTH = 3;
export const CONTAINER_HEIGHT = 2.591;

export interface CraneCycleConfig {
  mode: "cycle" | "idle";
  phase: number;
  /** idle: trolley oscillates around this boom position */
  zWork: number;
  /** cycle: boom position above the loading well */
  slotZ: number;
  /** cycle: crane-local height of the well floor */
  wellFloor: number;
  /** boom position above the truck lane */
  lane: number;
}

export interface CraneFrame {
  /** trolley position along the boom */
  z: number;
  /** container-top height under the spreader */
  ct: number;
  hasBox: boolean;
  /** containers that should be visible in the well (cycle mode) */
  wellShown: number;
  truckX: number;
  truckVisible: boolean;
  truckCargo: boolean;
}

const ease = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function craneFrame(sceneTime: number, c: CraneCycleConfig): CraneFrame {
  const clock = sceneTime + c.phase;
  if (c.mode === "idle") {
    return {
      z: c.zWork + Math.sin(clock * 0.09) * 7, ct: 33 + Math.sin(clock * 0.13 + 1) * 3.2,
      hasBox: true, wellShown: 0, truckX: 0, truckVisible: false, truckCargo: false,
    };
  }
  const t = clock % CYCLE_T;
  const cycle = Math.floor(clock / CYCLE_T);
  const k = cycle % WELL_DEPTH;
  const ctWell = c.wellFloor + (k + 1) * CONTAINER_HEIGHT;
  let z: number, ct: number;
  if (t < 8) { z = lerp(c.slotZ, c.lane, seg(t, 0, 8)); ct = CT_UP; }
  else if (t < 13) { z = c.lane; ct = lerp(CT_UP, CT_TRUCK, seg(t, 8, 13)); }
  else if (t < 14.5) { z = c.lane; ct = CT_TRUCK; }
  else if (t < 19.5) { z = c.lane; ct = lerp(CT_TRUCK, CT_UP, seg(t, 14.5, 19.5)); }
  else if (t < 31) { z = lerp(c.lane, c.slotZ, seg(t, 19.5, 31)); ct = CT_UP; }
  else if (t < 38) { z = c.slotZ; ct = lerp(CT_UP, ctWell, seg(t, 31, 38)); }
  else if (t < 39.5) { z = c.slotZ; ct = ctWell; }
  else if (t < 44) { z = c.slotZ; ct = lerp(ctWell, CT_UP, seg(t, 39.5, 44)); }
  else { z = c.slotZ; ct = CT_UP; }
  const wellShown = t < 8 && k === 0 && cycle > 0 ? WELL_DEPTH : t < 39.5 ? k : k + 1;
  return {
    z, ct, hasBox: t >= 14.5 && t < 39.5, wellShown,
    truckX: t < 10 ? lerp(75, 0, seg(t, 0, 10)) : t < 20 ? 0 : lerp(0, -75, seg(t, 20, 32)),
    truckVisible: t < 32, truckCargo: t < 14.5,
  };
}
