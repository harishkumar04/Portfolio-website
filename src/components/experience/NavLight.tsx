"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, MeshBasicMaterial, Sprite, SpriteMaterial } from "three";
import { glowTexture } from "@/lib/textures";
import { sceneClock } from "@/lib/clock";

interface Props {
  position: [number, number, number];
  color: string;
  size?: number;
  glow?: number;
  /** 0 = steady, otherwise gentle breathing amount */
  pulse?: number;
  phase?: number;
}

/** Emissive lamp with a soft additive halo. The halo breathes very subtly. */
export function NavLight({ position, color, size = 0.4, glow = 6, pulse = 0.18, phase = 0 }: Props) {
  const sprite = useRef<Sprite>(null);
  const core = useMemo(() => new MeshBasicMaterial({ color: new Color(color).multiplyScalar(2.2), toneMapped: false }), [color]);
  const halo = useMemo(
    () => new SpriteMaterial({ map: glowTexture(), color, blending: AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0.8 }),
    [color],
  );
  useFrame(() => {
    const k = 1 - pulse * (0.5 + 0.5 * Math.sin(sceneClock.t * 1.7 + phase));
    halo.opacity = 0.85 * k;
    sprite.current?.scale.setScalar(glow * (0.92 + 0.08 * k));
  });
  return (
    <group position={position}>
      <mesh material={core}><sphereGeometry args={[size, 10, 8]} /></mesh>
      <sprite ref={sprite} material={halo} scale={glow} />
    </group>
  );
}
