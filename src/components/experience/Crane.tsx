"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Box3, BoxGeometry, CylinderGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, Quaternion, RepeatWrapping, Vector3,
} from "three";
import { ContainerStack, CONTAINER_H } from "./Container";
import { InstancedBoxes, type BoxItem } from "./InstancedBoxes";
import { GlowPoints } from "./GlowPoints";
import { NavLight } from "./NavLight";
import { TerminalTruck } from "./Vehicles";
import { sceneClock } from "@/lib/clock";
import { craneFrame, WELL_DEPTH, type CraneCycleConfig } from "@/lib/craneCycle";
import { AssetSlot } from "./assets/AssetSlot";
import { hazardTexture, steelTexture } from "@/lib/textures";
import { applyWorldUV } from "@/lib/materials";
import { useNavigationStore } from "@/store/navigationStore";

/* Crane-local frame: origin on the quay top at the crane centre line.
   +X along the quay (rails), -Z towards the ship (screen-right in the home view), +Y up. */
export const CRANE = {
  railWater: 2.5,
  railLand: 28.5,
  halfBase: 8,
  topY: 41.5,
  girderLo: 42.6,
  girderHi: 45.4,
  tipZ: -46,
  backZ: 44,
  trolleyY: 43.6,
  lane: 15.5,
};

type V3 = [number, number, number];
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* --------------------------------------------------------- static detail data */

const RAIL_STEP = 2.4;
function railItems(path: [number, number][], y: number, h = 1.1, closed = false) {
  const posts: BoxItem[] = [], bars: BoxItem[] = [];
  const pts = closed ? [...path, path[0]] : path;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.round(len / RAIL_STEP));
    const ry = Math.atan2(-(z1 - z0), x1 - x0);
    for (let k = 0; k <= n; k++) {
      const f = k / n;
      posts.push({ p: [lerp(x0, x1, f), y + h / 2, lerp(z0, z1, f)], s: [0.07, h, 0.07] });
    }
    for (const hy of [h, h * 0.5]) bars.push({ p: [(x0 + x1) / 2, y + hy, (z0 + z1) / 2], s: [len, 0.06, 0.06], ry });
  }
  return { posts, bars };
}

const STATIC = (() => {
  const a = CRANE.railWater, b = CRANE.railLand, hb = CRANE.halfBase;
  const rails: { posts: BoxItem[]; bars: BoxItem[] }[] = [];
  // boom walkway handrails (both sides) + the walkway deck
  rails.push(railItems([[-3.45, CRANE.tipZ + 1], [-3.45, CRANE.backZ - 1]], 45.95));
  rails.push(railItems([[3.45, CRANE.tipZ + 1], [3.45, CRANE.backZ - 1]], 45.95));
  // portal-beam walkways
  for (const x of [-hb, hb]) {
    rails.push(railItems([[x - 1.9, a], [x - 1.9, b]], 43.1));
    rails.push(railItems([[x + 1.9, a], [x + 1.9, b]], 43.1));
  }
  // lower cross-beam platforms
  for (const z of [a, b]) {
    rails.push(railItems([[-hb - 1, z - 1.7], [hb + 1, z - 1.7]], 14.9));
    rails.push(railItems([[-hb - 1, z + 1.7], [hb + 1, z + 1.7]], 14.9));
  }
  // machinery-house roof
  rails.push(railItems([[-5.4, 28.2], [5.4, 28.2], [5.4, 43.0], [-5.4, 43.0]], 49.4, 1.1, true));
  const posts = rails.flatMap((r) => r.posts), bars = rails.flatMap((r) => r.bars);

  // ladders on the outer face of every leg
  const ladder: BoxItem[] = [];
  for (const x of [-hb, hb]) for (const z of [a, b]) {
    const sx = Math.sign(x) * (hb + 1.28);
    ladder.push({ p: [sx, 21.5, z - 0.36], s: [0.07, 41, 0.07] }, { p: [sx, 21.5, z + 0.36], s: [0.07, 41, 0.07] });
    for (let y = 2.4; y < 41; y += 0.55) ladder.push({ p: [sx, y, z], s: [0.05, 0.05, 0.72] });
  }
  // boom lamps
  const lampBoxes: BoxItem[] = [], glow: number[] = [];
  for (let z = CRANE.tipZ + 3; z < CRANE.backZ - 2; z += 4.2) for (const x of [-2.6, 2.6]) {
    lampBoxes.push({ p: [x, 42.15, z], s: [0.55, 0.16, 0.45] });
    glow.push(x, 41.8, z);
  }
  for (const x of [-hb, hb]) for (const z of [a, b]) for (const y of [8, 20, 33]) glow.push(x + Math.sign(x) * 1.6, y, z);
  for (let z = a; z <= b; z += 6.5) for (const x of [-hb, hb]) glow.push(x, 40.5, z);
  // girder cross ties
  const ties: BoxItem[] = Array.from({ length: 31 }, (_, i) => ({ p: [0, CRANE.girderHi, CRANE.tipZ + 2 + i * 3], s: [5.2, 0.35, 0.35] }));
  return { posts, bars, ladder, lampBoxes, glow, ties };
})();

/* ---------------------------------------------------------------- materials */

function useCraneMaterials() {
  return useMemo(() => {
    const steelMap = steelTexture();
    const haz = hazardTexture().clone();
    haz.wrapS = haz.wrapT = RepeatWrapping;
    haz.repeat.set(3, 2);
    haz.needsUpdate = true;
    return {
      steel: applyWorldUV(new MeshStandardMaterial({ map: steelMap, roughness: 0.6, metalness: 0.5 }), 8),
      steelDark: applyWorldUV(new MeshStandardMaterial({ map: steelMap, color: "#8b93a3", roughness: 0.65, metalness: 0.55 }), 6),
      red: applyWorldUV(new MeshStandardMaterial({ map: steelMap, color: "#d4684f", roughness: 0.6, metalness: 0.4 }), 8),
      yellow: new MeshStandardMaterial({ color: "#e0a91c", roughness: 0.5, metalness: 0.3 }),
      house: new MeshStandardMaterial({ color: "#c8c9cb", roughness: 0.6, metalness: 0.2 }),
      dark: new MeshStandardMaterial({ color: "#2c3037", roughness: 0.6, metalness: 0.6 }),
      cable: new MeshStandardMaterial({ color: "#1f2125", roughness: 0.5, metalness: 0.8 }),
      glass: new MeshStandardMaterial({ color: "#10162a", emissive: "#ffa44a", emissiveIntensity: 1.1, roughness: 0.2, metalness: 0.6 }),
      hazard: new MeshStandardMaterial({ map: haz, roughness: 0.6, metalness: 0.2 }),
      white: new MeshStandardMaterial({ color: "#d9d9d6", roughness: 0.55, metalness: 0.15 }),
    };
  }, []);
}

function Beam({ a, b, t = 0.8, mat, shadow = true }: { a: V3; b: V3; t?: number; mat: MeshStandardMaterial; shadow?: boolean }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new Vector3(...a), B = new Vector3(...b);
    const d = B.clone().sub(A);
    const len = d.length();
    const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), d.normalize());
    return { pos: A.add(B).multiplyScalar(0.5), quat, len };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} material={mat} castShadow={shadow} receiveShadow>
      <boxGeometry args={[t, t, len]} />
    </mesh>
  );
}

function Cable({ from, to, geo, mat }: { from: V3; to: V3; geo: CylinderGeometry; mat: MeshStandardMaterial }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new Vector3(...from), B = new Vector3(...to);
    const d = B.clone().sub(A);
    return { pos: A.clone().add(B).multiplyScalar(0.5), len: d.length(), quat: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d.normalize()) };
  }, [from, to]);
  return <mesh geometry={geo} material={mat} position={pos} quaternion={quat} scale={[1, len, 1]} />;
}

/** Lattice web members for the boom girders as a single instanced mesh. */
function BoomTruss({ mat, shadow }: { mat: MeshStandardMaterial; shadow: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const segs = useMemo(() => {
    const out: [V3, V3, number][] = [];
    for (const x of [-2.6, 2.6]) for (let z = CRANE.tipZ; z < CRANE.backZ - 3; z += 3) {
      const lo = CRANE.girderLo, hi = CRANE.girderHi;
      out.push([[x, lo, z], [x, hi, z + 1.5], 0.28], [[x, hi, z + 1.5], [x, lo, z + 3], 0.28], [[x, lo, z], [x, hi, z], 0.22]);
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const o = new Object3D();
    segs.forEach(([a, b, t], i) => {
      const A = new Vector3(...a), B = new Vector3(...b);
      o.position.copy(A).add(B).multiplyScalar(0.5);
      o.lookAt(B);
      o.scale.set(t, t, A.distanceTo(B));
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere();
  }, [segs]);
  useLayoutEffect(() => () => geo.dispose(), [geo]);
  return <instancedMesh ref={ref} args={[geo, mat, segs.length]} castShadow={shadow} frustumCulled={false} />;
}

/* -------------------------------------------------------------------- crane */

interface Props {
  position: [number, number, number];
  mode: "cycle" | "idle";
  phase?: number;
  /** Idle cranes hover around this trolley position */
  zWork?: number;
  /** Cycle crane: ship-side trolley position above the loading well */
  slotZ?: number;
  /** Cycle crane: crane-local height of the well floor (top of the hatch cover) */
  wellFloor?: number;
  /** Group whose 3 children are the containers stacked in the well (toggled visible as they are loaded) */
  wellRef?: React.MutableRefObject<Group | null>;
  cargoColor?: number;
}

/**
 * Ship-to-shore crane. The structure comes from the asset registry (GLB) when configured,
 * otherwise from the procedural model; the animated rig (trolley, ropes, spreader, cargo, truck)
 * is shared and driven by the pure loading-cycle controller in lib/craneCycle.
 */
export function GantryCrane(props: Props) {
  return (
    <group position={props.position}>
      <AssetSlot
        id="gantryCrane"
        render={(model) => (
          <>
            <primitive object={model.root} />
            <CraneRig {...props} external={model.nodes} />
          </>
        )}
      >
        <CraneStructure phase={props.phase ?? 0} />
        <CraneRig {...props} />
      </AssetSlot>
    </group>
  );
}

/** Static procedural crane: portal frame, boom truss, stays, walkways, ladders, lamps, machinery house. */
function CraneStructure({ phase }: { phase: number }) {
  const quality = useNavigationStore((s) => s.quality);
  const shadow = quality !== "low";
  const m = useCraneMaterials();
  const stayGeo = useMemo(() => new CylinderGeometry(0.15, 0.15, 1, 6), []);
  useLayoutEffect(() => () => stayGeo.dispose(), [stayGeo]);
  const a = CRANE.railWater, b = CRANE.railLand, hb = CRANE.halfBase, ty = CRANE.topY;
  const apex: V3 = [0, 68, 6];
  return (
    <group>
      {/* rails, bogies, hazard bumpers */}
      {[a, b].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.5, z]} material={m.dark} receiveShadow><boxGeometry args={[24, 1.0, 3.4]} /></mesh>
          <InstancedBoxes items={[-hb, hb].flatMap((x) => [-1.6, 1.6].map((dx) => ({ p: [x + dx * 1.2, 0.5, z] as V3, s: [1.1, 1.1, 0.4] as V3 })))} color="#23262b" roughness={0.5} metalness={0.8} />
          <mesh position={[0, 1.7, z]} material={m.steelDark} castShadow={shadow} receiveShadow><boxGeometry args={[hb * 2 + 3, 1.4, 2.4]} /></mesh>
        </group>
      ))}
      {[-hb, hb].flatMap((x) => [a, b].map((z) => (
        <group key={`${x}-${z}`}>
          <mesh position={[x, ty / 2 + 1, z]} material={m.steel} castShadow={shadow} receiveShadow><boxGeometry args={[2.4, ty, 2.4]} /></mesh>
          <mesh position={[x, 2.9, z]} material={m.hazard} castShadow={shadow}><boxGeometry args={[2.9, 2.6, 2.9]} /></mesh>
          <mesh position={[x, 6.6, z]} material={m.yellow}><boxGeometry args={[2.46, 0.3, 2.46]} /></mesh>
          <mesh position={[x, 25, z]} material={m.yellow}><boxGeometry args={[2.46, 0.3, 2.46]} /></mesh>
        </group>
      )))}

      {/* portal frame */}
      {[-hb, hb].map((x) => <Beam key={x} a={[x, ty, a]} b={[x, ty, b]} t={2.2} mat={m.steel} shadow={shadow} />)}
      {[a, b].map((z) => <Beam key={z} a={[-hb, ty, z]} b={[hb, ty, z]} t={2.2} mat={m.steel} shadow={shadow} />)}
      {[a, b].map((z) => <Beam key={`lo${z}`} a={[-hb, 14, z]} b={[hb, 14, z]} t={1.6} mat={m.steel} shadow={shadow} />)}
      {[a, b].map((z) => (
        <group key={`xb${z}`}>
          <Beam a={[-hb, 14, z]} b={[hb, ty, z]} t={0.95} mat={m.steelDark} shadow={shadow} />
          <Beam a={[hb, 14, z]} b={[-hb, ty, z]} t={0.95} mat={m.steelDark} shadow={shadow} />
        </group>
      ))}
      {[-hb, hb].map((x) => (
        <group key={`sb${x}`}>
          <Beam a={[x, 14, a]} b={[x, ty, b]} t={0.95} mat={m.steelDark} shadow={shadow} />
          <Beam a={[x, ty, a]} b={[x, 14, b]} t={0.95} mat={m.steelDark} shadow={shadow} />
          <Beam a={[x, 14, a]} b={[x, 14, b]} t={1.3} mat={m.steel} shadow={shadow} />
        </group>
      ))}
      {/* walkway decks */}
      {[a, b].map((z) => <mesh key={`wk${z}`} position={[0, 14.85, z]} material={m.dark}><boxGeometry args={[hb * 2 + 2, 0.12, 3.4]} /></mesh>)}
      {[-hb, hb].map((x) => <mesh key={`wt${x}`} position={[x, 43.05, (a + b) / 2]} material={m.dark}><boxGeometry args={[3.8, 0.12, b - a]} /></mesh>)}

      {/* boom girders + lattice + walkway */}
      {[-2.6, 2.6].map((x) => (
        <group key={x}>
          <Beam a={[x, CRANE.girderLo, CRANE.tipZ]} b={[x, CRANE.girderLo, CRANE.backZ]} t={0.8} mat={m.steel} shadow={shadow} />
          <Beam a={[x, CRANE.girderHi, CRANE.tipZ]} b={[x, CRANE.girderHi, CRANE.backZ]} t={0.8} mat={m.steel} shadow={shadow} />
        </group>
      ))}
      <BoomTruss mat={m.steelDark} shadow={shadow} />
      <InstancedBoxes items={STATIC.ties} color="#7a8aa6" roughness={0.6} metalness={0.5} />
      <mesh position={[0, 45.85, (CRANE.tipZ + CRANE.backZ) / 2]} material={m.dark}><boxGeometry args={[6.9, 0.12, CRANE.backZ - CRANE.tipZ - 1]} /></mesh>
      <mesh position={[0, 44, CRANE.tipZ - 0.6]} material={m.red} castShadow={shadow}><boxGeometry args={[7, 3.6, 1.6]} /></mesh>
      <mesh position={[0, 43.9, CRANE.tipZ - 1.5]} rotation={[0, 0, Math.PI / 2]} material={m.dark}><cylinderGeometry args={[1.1, 1.1, 6, 14]} /></mesh>
      <mesh position={[0, 46.2, CRANE.tipZ + 0.5]} material={m.hazard}><boxGeometry args={[7, 0.5, 2]} /></mesh>

      {/* handrails, ladders and lamps */}
      <InstancedBoxes items={STATIC.posts} color="#e0a91c" roughness={0.5} metalness={0.3} />
      <InstancedBoxes items={STATIC.bars} color="#e0a91c" roughness={0.5} metalness={0.3} />
      <InstancedBoxes items={STATIC.ladder} color="#e0a91c" roughness={0.55} metalness={0.3} />
      <InstancedBoxes items={STATIC.lampBoxes} color="#fff2d8" emissive="#ffae5a" emissiveIntensity={6} toneMapped={false} />
      <GlowPoints positions={STATIC.glow} size={3.4} />

      {/* A-frame, stays */}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <Beam a={[sd * 5, 44, a]} b={[sd * 0.9, apex[1], apex[2]]} t={1.25} mat={m.red} shadow={shadow} />
          <Cable from={[sd * 0.9, apex[1], apex[2]]} to={[sd * 2.6, CRANE.girderHi, CRANE.tipZ + 1]} geo={stayGeo} mat={m.cable} />
          <Cable from={[sd * 0.9, apex[1], apex[2]]} to={[sd * 2.6, CRANE.girderHi, -22]} geo={stayGeo} mat={m.cable} />
          <Cable from={[sd * 0.9, apex[1], apex[2]]} to={[sd * 3.4, CRANE.girderHi, CRANE.backZ - 1]} geo={stayGeo} mat={m.cable} />
          <Cable from={[sd * 0.9, apex[1], apex[2]]} to={[sd * 4.4, 46, 33]} geo={stayGeo} mat={m.cable} />
        </group>
      ))}
      <Beam a={[-3, 56, 4.2]} b={[3, 56, 4.2]} t={0.9} mat={m.red} shadow={shadow} />
      <Beam a={[-3, 50, 3.4]} b={[3, 50, 3.4]} t={0.7} mat={m.red} shadow={shadow} />
      <mesh position={[0, 69, 6]} material={m.dark}><boxGeometry args={[2.4, 1.2, 2]} /></mesh>
      <NavLight position={[0, 70.3, 6]} color="#ff3a22" size={0.45} glow={9} pulse={0.7} phase={phase} />

      {/* machinery house at the landward end */}
      <mesh position={[0, 46.6, 35.5]} material={m.house} castShadow={shadow} receiveShadow><boxGeometry args={[11, 5.6, 15]} /></mesh>
      <mesh position={[0, 49.5, 35.5]} material={m.red}><boxGeometry args={[11.4, 0.4, 15.4]} /></mesh>
      <mesh position={[0, 47.0, 27.94]} material={m.glass}><boxGeometry args={[8, 1.7, 0.12]} /></mesh>
      <mesh position={[5.56, 47.0, 33]} material={m.glass}><boxGeometry args={[0.12, 1.5, 7]} /></mesh>
      <mesh position={[-5.56, 47.0, 33]} material={m.glass}><boxGeometry args={[0.12, 1.5, 7]} /></mesh>
      <mesh position={[0, 50.4, 38]} material={m.dark}><boxGeometry args={[4, 1.6, 5]} /></mesh>
      <mesh position={[0, 42.7, 38]} material={m.steelDark}><boxGeometry args={[7, 3.0, 12]} /></mesh>

    </group>
  );
}

type ExternalNodes = Partial<Record<"trolley" | "spreader" | "hoistOrigin", Object3D>>;
interface ExternalRest { tRest: Vector3 | null; sRest: Vector3 | null; sBottom: number; sTop: number }

/** Animated parts. With `external` nodes from a GLB, those nodes are moved instead of the procedural ones. */
function CraneRig({ mode, phase = 0, zWork = -20, slotZ = -18.5, wellFloor = 12, wellRef, cargoColor = 0xb23a2c, external }: Props & { external?: ExternalNodes }) {
  const quality = useNavigationStore((s) => s.quality);
  const shadow = quality !== "low";
  const m = useCraneMaterials();
  const root = useRef<Group>(null);
  const trolley = useRef<Group>(null);
  const spreader = useRef<Group>(null);
  const carried = useRef<Group>(null);
  const truck = useRef<Group>(null);
  const truckCargo = useRef<Group>(null);
  const ropes = useRef<(Mesh | null)[]>([]);
  const rest = useRef<ExternalRest | null>(null);
  const ropeGeo = useMemo(() => new CylinderGeometry(0.07, 0.07, 1, 6), []);
  useLayoutEffect(() => () => ropeGeo.dispose(), [ropeGeo]);
  const cfg = useMemo<CraneCycleConfig>(() => ({ mode, phase, zWork, slotZ, wellFloor, lane: CRANE.lane }), [mode, phase, zWork, slotZ, wellFloor]);
  const extTrolley = external?.trolley, extSpreader = external?.spreader;

  useFrame(() => {
    const r = root.current, ca = carried.current;
    if (!r || !ca) return;
    const f = craneFrame(sceneClock.t, cfg);
    const base = r.getWorldPosition(new Vector3());

    // capture the GLB nodes' rest pose (crane-local) on the first frame
    if ((extTrolley || extSpreader) && !rest.current) {
      r.updateWorldMatrix(true, true);
      const toLocal = (o: Object3D) => o.getWorldPosition(new Vector3()).sub(base);
      const box = extSpreader ? new Box3().setFromObject(extSpreader) : null;
      rest.current = {
        tRest: extTrolley ? toLocal(extTrolley) : null,
        sRest: extSpreader ? toLocal(extSpreader) : null,
        sBottom: box ? box.min.y - base.y : 0,
        sTop: box ? box.max.y - base.y : 1.8,
      };
    }
    const place = (o: Object3D, local: Vector3) => {
      const w = local.clone().add(base);
      o.position.copy(o.parent ? o.parent.worldToLocal(w) : w);
    };

    let ropeFromY = CRANE.trolleyY - 0.55;
    if (extTrolley && rest.current?.tRest) {
      place(extTrolley, new Vector3(rest.current.tRest.x, rest.current.tRest.y, f.z));
      extTrolley.updateMatrixWorld(true);
      ropeFromY = external?.hoistOrigin ? external.hoistOrigin.getWorldPosition(new Vector3()).y - base.y : rest.current.tRest.y - 0.5;
    } else if (trolley.current) trolley.current.position.z = f.z;

    let ropeToY = f.ct + 1.8;
    if (extSpreader && rest.current?.sRest) {
      const lift = rest.current.sRest.y - rest.current.sBottom;
      place(extSpreader, new Vector3(rest.current.sRest.x, f.ct + lift, f.z));
      ropeToY = f.ct + (rest.current.sTop - rest.current.sBottom);
    } else if (spreader.current) spreader.current.position.set(0, f.ct, f.z);

    ca.position.set(0, f.ct - CONTAINER_H / 2, f.z);
    ca.visible = f.hasBox;
    const len = Math.max(0.1, ropeFromY - ropeToY);
    let i = 0;
    for (const dx of [-1.7, 1.7]) for (const dz of [-1.15, 1.15]) for (const o of [-0.16, 0.16]) {
      const c = ropes.current[i++];
      if (c) { c.position.set(dx + o, (ropeFromY + ropeToY) / 2, f.z + dz); c.scale.set(1, len, 1); }
    }

    if (mode === "cycle") {
      wellRef?.current?.children.forEach((c, k) => { c.visible = k < f.wellShown; });
      if (truck.current) {
        truck.current.position.x = f.truckX;
        truck.current.visible = f.truckVisible;
        if (truckCargo.current) truckCargo.current.visible = f.truckCargo;
      }
    }
  });

  return (
    <group ref={root}>
      {!extTrolley && (
        <>
      {/* trolley: yellow carriage, housing, sheaves, hanging operator cab */}
      <group ref={trolley} position={[0, CRANE.trolleyY, 0]}>
        <mesh position={[0, 0.5, 0]} material={m.yellow} castShadow={shadow}><boxGeometry args={[5.4, 1.4, 5.6]} /></mesh>
        <mesh position={[0, 1.75, -0.4]} material={m.yellow} castShadow={shadow}><boxGeometry args={[3.6, 1.3, 3.4]} /></mesh>
        <mesh position={[0, 2.5, -0.4]} material={m.dark}><boxGeometry args={[3.0, 0.2, 2.8]} /></mesh>
        {[-2.2, 2.2].flatMap((x) => [-2.1, 2.1].map((zz) => (
          <mesh key={`${x}${zz}`} position={[x, -0.3, zz]} rotation={[0, 0, Math.PI / 2]} material={m.steel}><cylinderGeometry args={[0.55, 0.55, 0.5, 14]} /></mesh>
        )))}
        {[-1.7, 1.7].flatMap((x) => [-1.15, 1.15].map((zz) => (
          <mesh key={`s${x}${zz}`} position={[x, -0.5, zz]} rotation={[Math.PI / 2, 0, 0]} material={m.dark}><cylinderGeometry args={[0.5, 0.5, 0.3, 16]} /></mesh>
        )))}
        <mesh position={[0, -2.2, 2.9]} material={m.yellow} castShadow={shadow}><boxGeometry args={[2.8, 2.7, 3.2]} /></mesh>
        <mesh position={[0, -2.1, 1.28]} material={m.glass}><boxGeometry args={[2.4, 1.6, 0.1]} /></mesh>
        <mesh position={[0, -0.6, 2.9]} material={m.dark}><boxGeometry args={[0.4, 1.0, 0.4]} /></mesh>
      </group>

        </>
      )}
      {/* hoist ropes */}
      {Array.from({ length: 8 }, (_, i) => <mesh key={i} ref={(el) => { ropes.current[i] = el; }} geometry={ropeGeo} material={m.cable} />)}

      {!extSpreader && (
        <>
      {/* spreader: headblock + sheaves + telescoping frame + flippers */}
      <group ref={spreader}>
        <mesh position={[0, 1.3, 0]} material={m.yellow} castShadow={shadow}><boxGeometry args={[3.4, 0.8, 2.2]} /></mesh>
        {[-1.7, 1.7].flatMap((x) => [-1.15, 1.15].map((zz) => (
          <mesh key={`${x}${zz}`} position={[x, 1.9, zz * 0.9]} rotation={[Math.PI / 2, 0, 0]} material={m.dark}><cylinderGeometry args={[0.42, 0.42, 0.28, 14]} /></mesh>
        )))}
        <mesh position={[0, 0.22, 0]} material={m.yellow} castShadow={shadow}><boxGeometry args={[12.1, 0.42, 0.7]} /></mesh>
        <mesh position={[0, 0.2, 0]} material={m.dark}><boxGeometry args={[0.7, 0.45, 2.3]} /></mesh>
        <mesh position={[0, 0.8, 0]} material={m.dark}><boxGeometry args={[1.2, 0.9, 1.2]} /></mesh>
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`}>
            <mesh position={[sx * 5.9, 0.16, sz * 0.95]} material={m.yellow}><boxGeometry args={[0.6, 0.35, 0.8]} /></mesh>
            <mesh position={[sx * 5.9, -0.16, sz * 0.95]} material={m.dark}><boxGeometry args={[0.28, 0.3, 0.28]} /></mesh>
            <mesh position={[sx * 6.05, -0.25, sz * 1.3]} rotation={[sz * 0.14, 0, 0]} material={m.yellow}><boxGeometry args={[0.1, 1.0, 0.5]} /></mesh>
          </group>
        )))}
        <GlowPoints positions={[-5.9, -0.3, 0, 5.9, -0.3, 0]} size={2.2} opacity={0.6} />
      </group>
        </>
      )}
      <group ref={carried}>
        <ContainerStack items={[{ position: [0, 0, 0], color: cargoColor }]} detail="coarse" castShadow={shadow} />
      </group>

      <NavLight position={[0, 40.9, CRANE.tipZ]} color="#ffd9a0" size={0.35} glow={7} pulse={0.1} phase={1} />

      {/* yard truck that delivers the container the crane loads aboard */}
      {mode === "cycle" && (
        <group ref={truck} position={[75, 0, CRANE.lane]}>
          <TerminalTruck cargoRef={truckCargo} cargoColor={cargoColor} />
        </group>
      )}
    </group>
  );
}

export { WELL_DEPTH };
