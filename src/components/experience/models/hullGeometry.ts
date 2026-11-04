import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute } from "three";
import { bowMask, deckLevel, halfWidthAt, keelLevel, stemRake, uToX, type ShipSpec } from "@/lib/shipLayout";

type RGB = [number, number, number];
const ANTIFOUL: RGB = [0.30, 0.04, 0.032];
const BOOT: RGB = [0.012, 0.012, 0.015];
const TOPSIDE: RGB = [0.040, 0.066, 0.155];
const STRIPE: RGB = [0.55, 0.30, 0.09];
const DECK: RGB = [0.07, 0.045, 0.04];

const BAND: RGB = [0.16, 0.19, 0.26];
function hullColor(y: number, top = 99): RGB {
  if (y < 1.0) return ANTIFOUL;
  if (y > top - 1.5) return BAND;
  if (y < 1.5) return BOOT;
  if (y > 5.2 && y < 6.0) return STRIPE;
  return TOPSIDE;
}

/**
 * Lofted hull: raked stem, bulwark flare, sheer line, fine bilge, flat transom and deck.
 * Vertex colours carry antifouling / boot-top / topside paint; a plate texture multiplies on top.
 */
export function buildHull(spec: ShipSpec, nu: number, nl: number, nt: number): BufferGeometry {
  const pos: number[] = [], col: number[] = [], uv: number[] = [], idx: number[] = [];
  const rake = stemRake(spec);
  const rows = nl + nt;

  const point = (u: number, j: number, side: number) => {
    let y: number;
    const k = keelLevel(u, spec);
    const top = deckLevel(u, spec);
    if (j <= nl) y = k + (0 - k) * (j / nl);
    else y = 0 + (top - 0) * ((j - nl) / nt);
    const yf = (y - k) / (top - k);
    const z = side * halfWidthAt(u, Math.min(y, top), spec);
    const x = uToX(u, spec) - rake * (1 - yf) * bowMask(u) * 1.0;
    return { x, y, z };
  };

  const base = (side: number) => pos.length / 3 + 0 * side;
  const sideStart: number[] = [];
  for (const side of [-1, 1]) {
    sideStart.push(base(side));
    for (let i = 0; i <= nu; i++) {
      // denser sampling towards the bow
      const t = i / nu;
      const u = t < 0.7 ? (t / 0.7) * 0.66 : 0.66 + ((t - 0.7) / 0.3) * 0.34;
      for (let j = 0; j <= rows; j++) {
        const p = point(u, j, side);
        pos.push(p.x, p.y, p.z);
        const c = hullColor(p.y, deckLevel(u, spec));
        col.push(...c);
        uv.push(p.x / 26, p.y / 13);
      }
    }
    const s0 = sideStart[sideStart.length - 1];
    for (let i = 0; i < nu; i++) for (let j = 0; j < rows; j++) {
      const a = s0 + i * (rows + 1) + j, b = a + 1, c = a + rows + 1, d = c + 1;
      if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
  }

  // deck surface
  const dStart = pos.length / 3;
  for (let i = 0; i <= nu; i++) {
    const t = i / nu;
    const u = t < 0.7 ? (t / 0.7) * 0.66 : 0.66 + ((t - 0.7) / 0.3) * 0.34;
    for (const side of [-1, 1]) {
      const p = point(u, rows, side);
      pos.push(p.x, p.y, p.z); col.push(...DECK); uv.push(p.x / 20, side * 0.5);
    }
  }
  for (let i = 0; i < nu; i++) {
    const a = dStart + i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, c, b, b, c, d);
  }

  // transom
  const tStart = pos.length / 3;
  for (const side of [-1, 1]) for (let j = 0; j <= rows; j++) {
    const p = point(0, j, side);
    pos.push(p.x, p.y, p.z); col.push(...hullColor(p.y)); uv.push(p.z / 26, p.y / 13);
  }
  for (let j = 0; j < rows; j++) {
    const a = tStart + j, b = a + 1, c = tStart + rows + 1 + j, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }

  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(new Uint32BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}
