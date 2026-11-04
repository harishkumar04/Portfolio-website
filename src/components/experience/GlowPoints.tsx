"use client";

import { useEffect, useMemo } from "react";
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, PointsMaterial } from "three";
import { glowTexture } from "@/lib/textures";

interface Props {
  positions: number[];
  color?: string;
  size?: number;
  opacity?: number;
}

/** Many warm lamp halos in a single draw call (additive, camera-facing). */
export function GlowPoints({ positions, color = "#ffae5a", size = 3.2, opacity = 0.85 }: Props) {
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  const mat = useMemo(
    () => new PointsMaterial({ map: glowTexture(), color, size, sizeAttenuation: true, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false }),
    [color, size, opacity],
  );
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  if (!positions.length) return null;
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}
