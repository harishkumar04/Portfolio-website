"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { sceneClock } from "@/lib/clock";
import { useNavigationStore } from "@/store/navigationStore";

/** Advances the shared scene time. Reduced-motion slows the world to a near standstill. */
export function SceneClock() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    // dev-only: expose the scene for debugging / screenshot tooling
    if (process.env.NODE_ENV !== "production") {
      const h = (window as unknown as { __harbor?: Record<string, unknown> }).__harbor;
      if (h) { h.scene = scene; h.gl = gl; }
    }
  }, [scene, gl]);
  useFrame((_, delta) => {
    const reduced = useNavigationStore.getState().reducedMotion;
    sceneClock.t += Math.min(delta, 0.1) * (reduced ? 0.12 : 1);
  }, -100);
  return null;
}
