"use client";

import { useEffect, useMemo } from "react";
import { CatmullRomCurve3, MeshStandardMaterial, TubeGeometry, Vector3 } from "three";

interface Props {
  from: [number, number, number];
  to: [number, number, number];
  /** Downward sag at mid-span (metres) */
  sag?: number;
  radius?: number;
  color?: string;
}

/** A thin rope / stay / mooring line with optional catenary sag. */
export function Rope({ from, to, sag = 0, radius = 0.09, color = "#2b261f" }: Props) {
  const geo = useMemo(() => {
    const a = new Vector3(...from), b = new Vector3(...to);
    const pts = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const p = a.clone().lerp(b, f);
      p.y -= sag * 4 * f * (1 - f);
      return p;
    });
    return new TubeGeometry(new CatmullRomCurve3(pts), 16, radius, 5, false);
  }, [from, to, sag, radius]);
  const mat = useMemo(() => new MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.1 }), [color]);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  return <mesh geometry={geo} material={mat} castShadow />;
}
