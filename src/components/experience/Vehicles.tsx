"use client";

import { useMemo, type MutableRefObject } from "react";
import { MeshStandardMaterial, type Group } from "three";
import { ContainerStack } from "./Container";
import { AssetSlot } from "./assets/AssetSlot";

interface TruckProps {
  /** Ref to the group holding the carried container; toggle `.visible` to load/unload */
  cargoRef?: MutableRefObject<Group | null>;
  cargoColor?: number;
  withCargo?: boolean;
}

/**
 * Terminal yard truck: tractor unit (cab, hood, windows, lights) towing a skeletal flatbed
 * chassis. Travels towards -X (cab leads). Origin sits on the ground, trailer centre at x = 0.
 */
export function TerminalTruck({ cargoRef, cargoColor = 0x2b6a9a, withCargo = true }: TruckProps) {
  const m = useMemo(() => ({
    cab: new MeshStandardMaterial({ color: "#d3a21d", roughness: 0.45, metalness: 0.35 }),
    dark: new MeshStandardMaterial({ color: "#1c1d21", roughness: 0.65, metalness: 0.5 }),
    glass: new MeshStandardMaterial({ color: "#161c2c", roughness: 0.15, metalness: 0.7, emissive: "#ffb066", emissiveIntensity: 0.25 }),
    chassis: new MeshStandardMaterial({ color: "#2c3037", roughness: 0.6, metalness: 0.6 }),
    lamp: new MeshStandardMaterial({ color: "#ffe2a8", emissive: "#ffcf80", emissiveIntensity: 3, toneMapped: false }),
    tyre: new MeshStandardMaterial({ color: "#121214", roughness: 0.9, metalness: 0.05 }),
  }), []);
  const wheel = (x: number, z: number, r = 0.55) => (
    <mesh key={`${x}${z}`} position={[x, r, z]} rotation={[Math.PI / 2, 0, 0]} material={m.tyre} castShadow>
      <cylinderGeometry args={[r, r, 0.42, 16]} />
    </mesh>
  );
  return (
    <group>
      <AssetSlot id="terminalTruck" render={(model) => <primitive object={model.root} />}>
      {/* tractor */}
      <group position={[-8.4, 0, 0]}>
        <mesh position={[0, 0.95, 0]} material={m.chassis} castShadow><boxGeometry args={[4.2, 0.4, 2.1]} /></mesh>
        <mesh position={[-0.9, 2.15, 0]} material={m.cab} castShadow><boxGeometry args={[1.9, 2.1, 2.3]} /></mesh>
        <mesh position={[-1.88, 2.45, 0]} material={m.glass}><boxGeometry args={[0.06, 1.1, 2.0]} /></mesh>
        <mesh position={[-0.9, 2.5, 1.16]} material={m.glass}><boxGeometry args={[1.3, 0.9, 0.05]} /></mesh>
        <mesh position={[-0.9, 2.5, -1.16]} material={m.glass}><boxGeometry args={[1.3, 0.9, 0.05]} /></mesh>
        <mesh position={[-2.05, 1.35, 0]} material={m.cab} castShadow><boxGeometry args={[1.4, 1.2, 2.0]} /></mesh>
        <mesh position={[-2.78, 1.35, 0]} material={m.dark}><boxGeometry args={[0.06, 0.7, 1.5]} /></mesh>
        {[-0.8, 0.8].map((z) => <mesh key={z} position={[-2.78, 1.65, z]} material={m.lamp}><boxGeometry args={[0.08, 0.22, 0.4]} /></mesh>)}
        <mesh position={[0.9, 1.4, 0]} material={m.dark}><cylinderGeometry args={[0.55, 0.55, 0.3, 14]} /></mesh>
        <mesh position={[0, 3.3, 0.6]} material={m.lamp}><boxGeometry args={[0.2, 0.12, 0.35]} /></mesh>
        {wheel(-1.9, 1.1)}{wheel(-1.9, -1.1)}{wheel(1.2, 1.1)}{wheel(1.2, -1.1)}
      </group>
      {/* flatbed chassis */}
      <mesh position={[0, 1.15, 0]} material={m.chassis} castShadow receiveShadow><boxGeometry args={[12.8, 0.3, 2.5]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[0, 0.95, s * 0.9]} material={m.dark}><boxGeometry args={[12.2, 0.25, 0.3]} /></mesh>)}
      {[-5.8, -2.0, 2.0, 5.8].map((x) => <mesh key={x} position={[x, 1.32, 0]} material={m.dark}><boxGeometry args={[0.5, 0.12, 2.6]} /></mesh>)}
      {wheel(3.4, 1.1)}{wheel(3.4, -1.1)}{wheel(4.6, 1.1)}{wheel(4.6, -1.1)}
      <mesh position={[6.45, 1.0, 0]} material={m.lamp}><boxGeometry args={[0.05, 0.14, 0.6]} /></mesh>
      </AssetSlot>
      {withCargo && (
        <group ref={cargoRef} position={[0, 1.3 + 1.2955, 0]} visible={!cargoRef}>
          <ContainerStack items={[{ position: [0, 0, 0], color: cargoColor }]} detail="coarse" castShadow />
        </group>
      )}
    </group>
  );
}

/** Yellow counter-balance forklift. Origin on the ground, forks point to +X. */
export function Forklift() {
  const m = useMemo(() => ({
    body: new MeshStandardMaterial({ color: "#dba51b", roughness: 0.5, metalness: 0.35 }),
    dark: new MeshStandardMaterial({ color: "#1c1d21", roughness: 0.65, metalness: 0.6 }),
    glass: new MeshStandardMaterial({ color: "#161c2c", roughness: 0.15, metalness: 0.7, emissive: "#ffb066", emissiveIntensity: 0.3 }),
    lamp: new MeshStandardMaterial({ color: "#ffe2a8", emissive: "#ffcf80", emissiveIntensity: 3, toneMapped: false }),
  }), []);
  return (
    <AssetSlot id="forklift" render={(model) => <primitive object={model.root} />}>
    <group>
      <mesh position={[-0.4, 0.95, 0]} material={m.body} castShadow><boxGeometry args={[2.6, 1.1, 1.5]} /></mesh>
      <mesh position={[-1.0, 1.85, 0]} material={m.body} castShadow><boxGeometry args={[1.0, 0.6, 1.4]} /></mesh>
      <mesh position={[0.2, 2.6, 0]} material={m.glass}><boxGeometry args={[1.3, 1.3, 1.3]} /></mesh>
      {[[-0.5, 0.7], [0.5, 0.7]].flatMap(([x], i) => [-0.75, 0.75].map((z) => <mesh key={`${i}${z}`} position={[x * 1.3 - 0.1, 0.45, z]} rotation={[Math.PI / 2, 0, 0]} material={m.dark}><cylinderGeometry args={[0.45, 0.45, 0.3, 14]} /></mesh>))}
      <mesh position={[1.1, 1.8, 0]} material={m.dark}><boxGeometry args={[0.2, 3.2, 1.2]} /></mesh>
      {[-0.35, 0.35].map((z) => <mesh key={z} position={[1.9, 0.25, z]} material={m.dark}><boxGeometry args={[1.6, 0.1, 0.18]} /></mesh>)}
      <mesh position={[0.2, 3.35, 0]} material={m.lamp}><boxGeometry args={[0.2, 0.1, 0.5]} /></mesh>
    </group>
    </AssetSlot>
  );
}
