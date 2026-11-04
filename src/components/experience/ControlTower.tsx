"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, DoubleSide, Group, MeshStandardMaterial } from "three";
import { facadeTextures } from "@/lib/textures";
import { GlowPoints } from "./GlowPoints";
import { NavLight } from "./NavLight";
import { InstancedBoxes } from "./InstancedBoxes";
import { HARBOR } from "@/lib/harbor";
import { sceneClock } from "@/lib/clock";

/** Harbor control tower: concrete shaft, glazed watch room, balcony, radar and beacon. */
export function ControlTower() {
  const radar = useRef<Group>(null);
  const m = useMemo(() => ({
    concrete: new MeshStandardMaterial({ color: "#b9b3aa", roughness: 0.85, metalness: 0.05 }),
    dark: new MeshStandardMaterial({ color: "#23262c", roughness: 0.6, metalness: 0.6 }),
    glass: new MeshStandardMaterial({ color: "#1a2238", roughness: 0.12, metalness: 0.7, emissive: "#ffb066", emissiveIntensity: 0.7 }),
    white: new MeshStandardMaterial({ color: "#d8d4cc", roughness: 0.6, metalness: 0.2 }),
    stripe: new MeshStandardMaterial({ color: "#c4502a", roughness: 0.6, metalness: 0.1 }),
  }), []);
  useFrame(() => { if (radar.current) radar.current.rotation.y = sceneClock.t * 1.4; });
  const ribs = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { p: [Math.cos(a) * 7.55, 0, Math.sin(a) * 7.55] as [number, number, number], s: [0.3, 3.3, 0.3] as [number, number, number], ry: -a };
  }), []);
  const balcony = useMemo(() => ({
    posts: Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return { p: [Math.cos(a) * 9.0, 37.65, Math.sin(a) * 9.0] as [number, number, number], s: [0.07, 1.1, 0.07] as [number, number, number] }; }),
  }), []);
  const slits = useMemo(() => {
    const o: { p: [number, number, number]; s: [number, number, number]; ry: number }[] = [];
    for (const y of [14, 20, 26, 32]) for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; const r = 3.45 - y * 0.012; o.push({ p: [Math.cos(a) * r, y, Math.sin(a) * r], s: [0.15, 1.6, 0.9], ry: -a }); }
    return o;
  }, []);
  const towerGlow = useMemo(() => {
    const g: number[] = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.push(Math.cos(a) * 9.2, 38.6, Math.sin(a) * 9.2); }
    g.push(0, 38.7, 0, 0, 36, 0, 0, 12, 7.1);
    return g;
  }, []);
  const ribItems = ribs.map((r) => ({ ...r, p: [r.p[0], 38.8, r.p[2]] as [number, number, number] }));
  return (
    <group position={[HARBOR.tower.x, HARBOR.quayY, HARBOR.tower.z]}>
      {/* base building */}
      <mesh position={[0, 3.5, 0]} material={m.concrete} castShadow receiveShadow><boxGeometry args={[16, 7, 13]} /></mesh>
      <mesh position={[0, 7.2, 0]} material={m.dark}><boxGeometry args={[16.6, 0.5, 13.6]} /></mesh>
      <mesh position={[0, 3.2, 6.52]} material={m.glass}><boxGeometry args={[10, 2.2, 0.1]} /></mesh>
      {/* shaft */}
      <mesh position={[0, 24, 0]} material={m.concrete} castShadow receiveShadow><cylinderGeometry args={[2.9, 3.6, 34, 10]} /></mesh>
      {[12, 22, 32].map((y) => <mesh key={y} position={[0, y, 0]} material={m.stripe}><cylinderGeometry args={[3.2 - y * 0.012, 3.3 - y * 0.012, 0.9, 10]} /></mesh>)}
      {/* watch room */}
      <mesh position={[0, 41.2, 0]} material={m.dark} castShadow><cylinderGeometry args={[8.6, 4.4, 2.4, 12]} /></mesh>
      {/* sloped glazing, lit interior, balcony with handrail */}
      <mesh position={[0, 38.8, 0]}><cylinderGeometry args={[8.2, 7.0, 3.6, 12, 1, true]} /><meshStandardMaterial color="#0d1224" transparent opacity={0.55} roughness={0.1} metalness={0.8} side={DoubleSide} /></mesh>
      <mesh position={[0, 38.7, 0]}><cylinderGeometry args={[6.9, 6.7, 3.2, 12]} /><meshStandardMaterial color="#1a1208" emissive="#ff9a3c" emissiveIntensity={1.3} roughness={0.6} /></mesh>
      <mesh position={[0, 37.6, 0]} material={m.dark}><boxGeometry args={[5, 1.0, 1.4]} /></mesh>
      <mesh position={[0, 38.6, -2]} material={m.dark}><boxGeometry args={[3.2, 0.9, 1.2]} /></mesh>
      <InstancedBoxes items={ribItems} color="#2b2d33" roughness={0.5} metalness={0.8} castShadow />
      <mesh position={[0, 37.0, 0]} material={m.white}><cylinderGeometry args={[9.2, 8.9, 0.45, 12]} /></mesh>
      <InstancedBoxes items={balcony.posts} color="#cfcfcb" roughness={0.5} metalness={0.5} />
      <mesh position={[0, 38.1, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[9.0, 0.06, 6, 36]} /><meshStandardMaterial color="#cfcfcb" roughness={0.5} metalness={0.5} /></mesh>
      <mesh position={[0, 37.6, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[9.0, 0.05, 6, 36]} /><meshStandardMaterial color="#cfcfcb" roughness={0.5} metalness={0.5} /></mesh>
      <mesh position={[0, 40.65, 0]} material={m.white} castShadow><cylinderGeometry args={[9.0, 8.6, 0.5, 12]} /></mesh>
      <mesh position={[0, 41.5, 0]} material={m.dark} castShadow><cylinderGeometry args={[7.6, 8.0, 1.3, 12]} /></mesh>
      <InstancedBoxes items={slits} color="#fff0d0" emissive="#ffae5a" emissiveIntensity={4} toneMapped={false} />
      <GlowPoints positions={towerGlow} size={5} />
      {/* roof equipment */}
      <mesh position={[0, 42.6, 0]} material={m.white}><cylinderGeometry args={[4.2, 5.8, 1.0, 12]} /></mesh>
      <mesh position={[0, 43.8, 0]} material={m.dark}><cylinderGeometry args={[0.35, 0.5, 4, 8]} /></mesh>
      <group ref={radar} position={[0, 46.2, 0]}>
        <mesh material={m.white}><boxGeometry args={[0.5, 0.35, 6]} /></mesh>
        <mesh position={[0, -0.4, 0]} material={m.dark}><cylinderGeometry args={[0.4, 0.4, 0.6, 8]} /></mesh>
      </group>
      <mesh position={[-3, 46, 2.5]} material={m.dark}><cylinderGeometry args={[0.07, 0.07, 9, 5]} /></mesh>
      <mesh position={[3, 45, -2.5]} material={m.dark}><cylinderGeometry args={[0.07, 0.07, 7, 5]} /></mesh>
      <NavLight position={[0, 50.2, 0]} color="#ff3a22" size={0.5} glow={11} pulse={0.75} phase={0.5} />
    </group>
  );
}

/** Harbor master's office: low glazed administration block beside the tower. */
export function HarborOffice() {
  const f = useMemo(() => facadeTextures(), []);
  const geo = useMemo(() => {
    const g = new BoxGeometry(42, 9.5, 16);
    const uv = g.attributes.uv;
    const faces: [number, number][] = [[16, 9.5], [16, 9.5], [42, 16], [42, 16], [42, 9.5], [42, 9.5]];
    for (let fi = 0; fi < 6; fi++) for (let i = 0; i < 4; i++) { const k = fi * 4 + i; uv.setXY(k, (uv.getX(k) * faces[fi][0]) / 4, (uv.getY(k) * faces[fi][1]) / 3.2); }
    return g;
  }, []);
  const mats = useMemo(() => {
    const facade = new MeshStandardMaterial({ map: f.map, emissiveMap: f.emissive, emissive: "#ffb066", emissiveIntensity: 1.4, roughness: 0.6, metalness: 0.1 });
    const roof = new MeshStandardMaterial({ color: "#8d8a85", roughness: 0.85 });
    return { arr: [facade, facade, roof, roof, facade, facade], roof };
  }, [f]);
  return (
    <group position={[HARBOR.tower.x + 42, HARBOR.quayY, HARBOR.tower.z + 2]}>
      <mesh geometry={geo} material={mats.arr} position={[0, 4.75, 0]} castShadow receiveShadow />
      <mesh position={[0, 9.8, 0]} material={mats.roof}><boxGeometry args={[43, 0.6, 17]} /></mesh>
      {[-12, 0, 12].map((x) => <mesh key={x} position={[x, 10.9, 2]} material={mats.roof} castShadow><boxGeometry args={[5, 1.8, 4]} /></mesh>)}
      <mesh position={[18, 15.5, -4]}><cylinderGeometry args={[0.12, 0.12, 12, 6]} /><meshStandardMaterial color="#c9c9c9" metalness={0.8} roughness={0.4} /></mesh>
      <mesh position={[19.6, 19.8, -4]}><boxGeometry args={[3, 1.8, 0.05]} /><meshStandardMaterial color="#c4502a" roughness={0.7} /></mesh>
    </group>
  );
}
