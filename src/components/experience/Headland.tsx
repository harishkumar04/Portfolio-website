"use client";

import { useEffect, useMemo } from "react";
import { BufferGeometry, DoubleSide, Float32BufferAttribute } from "three";
import { mulberry32 } from "@/lib/rng";

function ridge(width: number, height: number, seed: number, top: [number, number, number], base: [number, number, number]) {
  const rnd = mulberry32(seed);
  const n = 90;
  const phase = [rnd() * 6, rnd() * 6, rnd() * 6];
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const env = Math.pow(Math.sin(Math.PI * t), 0.8);
    const h = height * env * (0.55 + 0.3 * Math.sin(t * 9 + phase[0]) + 0.15 * Math.sin(t * 23 + phase[1]) + 0.08 * Math.sin(t * 57 + phase[2]));
    const x = (t - 0.5) * width;
    pos.push(x, -20, 0, x, Math.max(h, 0), 0);
    col.push(...base, ...top);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

/** Distant misty headlands anchoring the horizon with atmospheric perspective. */
export default function Headland() {
  const layers = useMemo(() => {
    const R = 2500;
    const def: [number, number, number, number, [number, number, number], [number, number, number]][] = [
      [14, 1500, 150, 4, [0.20, 0.10, 0.22], [0.70, 0.30, 0.30]],
      [27, 1000, 115, 9, [0.24, 0.11, 0.24], [0.80, 0.36, 0.30]],
      [46, 1000, 95, 17, [0.22, 0.10, 0.24], [0.78, 0.34, 0.32]],
      [60, 700, 70, 21, [0.28, 0.14, 0.28], [0.85, 0.40, 0.34]],
      [78, 900, 80, 31, [0.26, 0.13, 0.28], [0.82, 0.38, 0.34]],
    ];
    return def.map(([deg, w, h, seed, top, base]) => {
      const a = (deg * Math.PI) / 180;
      const px = -Math.cos(a) * R, pz = -Math.sin(a) * R;
      return { g: ridge(w, h, seed, top, base), p: [px, 0, pz] as [number, number, number], ry: Math.atan2(-px, -pz) };
    });
  }, []);
  useEffect(() => () => layers.forEach((l) => l.g.dispose()), [layers]);
  return (
    <group>
      {layers.map((l, i) => (
        <mesh key={i} geometry={l.g} position={l.p} rotation={[0, l.ry, 0]} renderOrder={-5}>
          <meshBasicMaterial vertexColors side={DoubleSide} fog={false} />
        </mesh>
      ))}
    </group>
  );
}
