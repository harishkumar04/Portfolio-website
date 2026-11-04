"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BoxGeometry, Group, MeshStandardMaterial, RepeatWrapping } from "three";
import { InstancedBoxes, type BoxItem } from "./InstancedBoxes";
import { NavLight } from "./NavLight";
import { TerminalTruck } from "./Vehicles";
import { glowTexture, groundTexture, wetRoughness, facadeTextures } from "@/lib/textures";
import { GlowPoints } from "./GlowPoints";
import { Forklift } from "./Vehicles";
import { HARBOR } from "@/lib/harbor";
import { sceneClock } from "@/lib/clock";
import { useNavigationStore } from "@/store/navigationStore";

const [X0, X1] = HARBOR.landX;
const LEN = X1 - X0;
const CX = (X0 + X1) / 2;

/** Quay slab, apron markings, rails, fenders, bollards and ground-level detail. */
export function Quay() {
  const mats = useMemo(() => {
    const t = groundTexture().clone();
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(LEN / 12, HARBOR.landZ / 12);
    t.needsUpdate = true;
    const wet = wetRoughness().clone();
    wet.wrapS = wet.wrapT = RepeatWrapping;
    wet.repeat.set(LEN / 40, HARBOR.landZ / 40);
    wet.needsUpdate = true;
    const side = new MeshStandardMaterial({ color: "#4c4a4b", roughness: 0.9, metalness: 0.05 });
    const top = new MeshStandardMaterial({ map: t, color: "#9a9896", roughnessMap: wet, roughness: 1, metalness: 0.12, envMapIntensity: 1.7 });
    return { arr: [side, side, top, side, side, side], t, side, top };
  }, []);

  const fenders = useMemo<BoxItem[]>(() => {
    const o: BoxItem[] = [];
    for (let x = X0 + 10; x < 60; x += 14) o.push({ p: [x, 1.2, -0.35], s: [1.4, 2.6, 0.7] });
    return o;
  }, []);
  const [kerbY, kerbK] = useMemo(() => {
    const y: BoxItem[] = [], k: BoxItem[] = [];
    for (let x = X0 + 1.2, i = 0; x < 330; x += 1.2, i++) (i % 2 ? k : y).push({ p: [x, HARBOR.quayY + 0.06, 0.45], s: [1.2, 0.12, 0.9] });
    return [y, k];
  }, []);
  const lines = useMemo<BoxItem[]>(() => {
    const o: BoxItem[] = [
      { p: [CX, HARBOR.quayY + 0.01, 0.9], s: [LEN, 0.02, 0.35] },
      { p: [CX, HARBOR.quayY + 0.01, 33], s: [LEN, 0.02, 0.25] },
      { p: [CX, HARBOR.quayY + 0.01, 8], s: [LEN, 0.02, 0.18] },
    ];
    for (let x = X0 + 5; x < 330; x += 40) o.push({ p: [x, HARBOR.quayY + 0.01, 22], s: [8, 0.02, 0.35] });
    return o;
  }, []);
  const rails = useMemo<BoxItem[]>(() => [2.5, 28.5].flatMap((z) => [
    { p: [CX, HARBOR.quayY + 0.08, z - 0.55], s: [LEN, 0.16, 0.18] as [number, number, number] },
    { p: [CX, HARBOR.quayY + 0.08, z + 0.55], s: [LEN, 0.16, 0.18] as [number, number, number] },
  ] as BoxItem[]), []);

  return (
    <group>
      <mesh position={[CX, HARBOR.quayY - 6.5, HARBOR.landZ / 2]} material={mats.arr} receiveShadow>
        <boxGeometry args={[LEN, 13, HARBOR.landZ]} />
      </mesh>
      <mesh position={[CX, HARBOR.quayY + 0.04, 2.2]} receiveShadow>
        <boxGeometry args={[LEN, 0.08, 4.4]} />
        <meshStandardMaterial color="#8a8680" roughness={0.9} />
      </mesh>
      <InstancedBoxes items={fenders} color="#16161a" roughness={0.85} metalness={0.05} castShadow={false} />
      <Bollards />
      <InstancedBoxes items={kerbY} color="#e0b020" roughness={0.7} metalness={0.1} />
      <InstancedBoxes items={kerbK} color="#15151a" roughness={0.7} metalness={0.1} />
      <QuayLamps />
      <GuardBooth />
      <InstancedBoxes items={lines} color="#d8ac2a" roughness={0.85} metalness={0.05} receiveShadow />
      <InstancedBoxes items={rails} color="#55585e" roughness={0.45} metalness={0.9} />
    </group>
  );
}

/** Industrial high-mast flood lights: warm lamp banks, soft halos and light pools on the apron. */
export function LightMasts() {
  const quality = useNavigationStore((s) => s.quality);
  const spots: [number, number][] = [[-30, 36], [-100, 36], [-175, 62], [-250, 36], [-330, 62], [-420, 36]];
  const lamps = useMemo<BoxItem[]>(() => {
    const o: BoxItem[] = [];
    spots.forEach(([x, z]) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        o.push({ p: [x + Math.cos(a) * 3.1, HARBOR.quayY + 37.2, z + Math.sin(a) * 3.1], s: [2.0, 0.5, 0.9], ry: -a + Math.PI / 2 });
      }
    });
    return o;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const poolMat = useMemo(
    () => new MeshStandardMaterial({ map: glowTexture(), color: "#ffa850", emissive: "#ffa850", emissiveMap: glowTexture(), emissiveIntensity: 1.0, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false, roughness: 1, metalness: 0 }),
    [],
  );
  return (
    <group>
      {spots.map(([x, z]) => (
        <group key={`${x}`} position={[x, HARBOR.quayY, z]}>
          <mesh position={[0, 18.5, 0]} castShadow><cylinderGeometry args={[0.38, 0.7, 37, 10]} /><meshStandardMaterial color="#6a6d73" roughness={0.5} metalness={0.8} /></mesh>
          <mesh position={[0, 37, 0]}><cylinderGeometry args={[1.9, 3.0, 0.6, 16]} /><meshStandardMaterial color="#2b2d31" roughness={0.6} metalness={0.7} /></mesh>
          <NavLight position={[0, 38, 0]} color="#ffb464" size={0.01} glow={16} pulse={0.05} phase={x} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} material={poolMat}><planeGeometry args={[80, 80]} /></mesh>
          {quality === "high" && <pointLight position={[0, 34, 0]} color="#ffa24d" intensity={2600} distance={120} decay={2} />}
        </group>
      ))}
      <InstancedBoxes items={lamps} color="#fff0cf" emissive="#ffb76a" emissiveIntensity={5} toneMapped={false} roughness={0.4} metalness={0.2} />
    </group>
  );
}

/** Slowly moving yard trucks on the quay lane, plus a parked pair. */
export function YardTraffic() {
  const refs = useRef<(Group | null)[]>([]);
  const lanes = [
    { z: 22.5, speed: 5, offset: 0, color: 0xa86a2b },
    { z: 22.5, speed: 5, offset: 260, color: 0x1f4e79 },
    { z: 34.5, speed: 3.2, offset: 120, color: 0x9c2f23 },
  ];
  useFrame(() => {
    lanes.forEach((l, i) => {
      const g = refs.current[i];
      if (!g) return;
      const span = 900;
      const d = (sceneClock.t * l.speed + l.offset) % span;
      g.position.x = 330 - d - 0;
    });
  });
  return (
    <group position={[0, HARBOR.quayY, 0]}>
      {lanes.map((l, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }} position={[0, 0, l.z]}>
          <TerminalTruck cargoColor={l.color} />
        </group>
      ))}
      {[[-208, 15], [-262, 8.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, i ? 0.05 : 0, 0]}>
          <TerminalTruck cargoColor={0x2f6b4f} withCargo={i === 0} />
        </group>
      ))}
    </group>
  );
}



/** Squat black bollards with yellow caps, as in the terminal photos. */
function Bollards() {
  const m = useMemo(() => ({
    body: new MeshStandardMaterial({ color: "#1c1d21", roughness: 0.6, metalness: 0.7 }),
    cap: new MeshStandardMaterial({ color: "#d9a51a", roughness: 0.5, metalness: 0.35 }),
  }), []);
  const xs: number[] = [];
  for (let x = X0 + 20; x < 60; x += 28) if (x > -330) xs.push(x);
  return (
    <group>
      {xs.map((x) => (
        <group key={x} position={[x, HARBOR.quayY, 1.8]}>
          <mesh position={[0, 0.55, 0]} material={m.body} castShadow><cylinderGeometry args={[0.8, 0.95, 1.1, 14]} /></mesh>
          <mesh position={[0, 1.18, 0]} material={m.cap} castShadow><cylinderGeometry args={[1.05, 0.9, 0.36, 14]} /></mesh>
          <mesh position={[0, 0.7, 0]} material={m.cap}><cylinderGeometry args={[0.96, 0.96, 0.18, 14]} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Low quay lamp posts with warm halos reflected on the wet concrete. */
function QuayLamps() {
  const spots = useMemo(() => { const a: number[] = []; for (let x = -330; x < 60; x += 32) a.push(x); return a; }, []);
  const glow = useMemo(() => spots.flatMap((x) => [x, HARBOR.quayY + 9.4, 6.2]), [spots]);
  const poles = useMemo<BoxItem[]>(() => spots.map((x) => ({ p: [x, HARBOR.quayY + 4.6, 6.2], s: [0.22, 9.2, 0.22] })), [spots]);
  const heads = useMemo<BoxItem[]>(() => spots.map((x) => ({ p: [x, HARBOR.quayY + 9.3, 5.6], s: [0.9, 0.2, 1.4] })), [spots]);
  const refl = useMemo(() => new MeshStandardMaterial({ map: glowTexture(), color: "#ffa24a", emissive: "#ffa24a", emissiveMap: glowTexture(), emissiveIntensity: 0.9, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false, roughness: 1, metalness: 0 }), []);
  return (
    <group>
      <InstancedBoxes items={poles} color="#35383e" roughness={0.5} metalness={0.8} castShadow />
      <InstancedBoxes items={heads} color="#fff0d0" emissive="#ffae5a" emissiveIntensity={6} toneMapped={false} />
      <GlowPoints positions={glow} size={5} />
      {spots.map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, HARBOR.quayY + 0.07, 8]} material={refl}><planeGeometry args={[34, 22]} /></mesh>
      ))}
    </group>
  );
}

/** Small guard / checkpoint booth with lit windows. */
function GuardBooth() {
  const f = useMemo(() => facadeTextures(), []);
  const geo = useMemo(() => {
    const g = new BoxGeometry(9, 3.4, 5);
    const uv = g.attributes.uv;
    const faces: [number, number][] = [[5, 3.4], [5, 3.4], [9, 5], [9, 5], [9, 3.4], [9, 3.4]];
    for (let fi = 0; fi < 6; fi++) for (let i = 0; i < 4; i++) { const k = fi * 4 + i; uv.setXY(k, (uv.getX(k) * faces[fi][0]) / 4, (uv.getY(k) * faces[fi][1]) / 3.2); }
    return g;
  }, []);
  const mats = useMemo(() => {
    const facade = new MeshStandardMaterial({ map: f.map, emissiveMap: f.emissive, emissive: "#ffb066", emissiveIntensity: 1.6, roughness: 0.6, metalness: 0.1 });
    const roof = new MeshStandardMaterial({ color: "#6e6c6a", roughness: 0.8 });
    return { arr: [facade, facade, roof, roof, facade, facade], roof };
  }, [f]);
  return (
    <group position={[-12, HARBOR.quayY, 38]}>
      <mesh geometry={geo} material={mats.arr} position={[0, 1.7, 0]} castShadow receiveShadow />
      <mesh position={[0, 3.55, 0]} material={mats.roof} castShadow><boxGeometry args={[10, 0.3, 6]} /></mesh>
      <mesh position={[-3.6, 0.25, 3.2]}><boxGeometry args={[0.6, 0.5, 0.6]} /><meshStandardMaterial color="#d9a51a" roughness={0.6} /></mesh>
    </group>
  );
}

/** Forklifts working the apron. */
export function ApronVehicles() {
  return (
    <group position={[0, HARBOR.quayY, 0]}>
      <group position={[-30, 0, 20]} rotation={[0, 2.4, 0]}><Forklift /></group>
      <group position={[-92, 0, 9]} rotation={[0, -0.6, 0]}><Forklift /></group>
      <group position={[-190, 0, 16]} rotation={[0, 1.1, 0]}><Forklift /></group>
    </group>
  );
}
