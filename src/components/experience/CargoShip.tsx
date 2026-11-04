"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, CapsuleGeometry, DoubleSide, Group, MeshStandardMaterial, type BufferGeometry } from "three";
import { buildHull } from "./models/hullGeometry";
import { ContainerStack, type ContainerDetail } from "./Container";
import { InstancedBoxes, type BoxItem } from "./InstancedBoxes";
import { NavLight } from "./NavLight";
import { facadeTextures, hullTexture, nameTexture } from "@/lib/textures";
import { bowMask, deckLevel, getShipLayout, halfWidthAt, keelLevel, stemRake, uToX, BAY_PITCH, HATCH_H, SHIP_LIFT, type ShipSpec } from "@/lib/shipLayout";
import { Rope } from "./Rope";
import { GlowPoints } from "./GlowPoints";
import { CONTAINER_H } from "./Container";
import { sceneClock } from "@/lib/clock";
import { wakeSources } from "@/lib/wake";
import { useNavigationStore } from "@/store/navigationStore";
import { modelAssets, type AssetId } from "@/config/assets";
import type { NormalizedModel } from "@/lib/models";

export type ShipDetail = "hero" | "standard" | "distant";

interface Motion {
  /** Unit direction of travel in the XZ plane */
  dx: number;
  dz: number;
  speed: number;
  /** Distance after which the voyage loops */
  travel: number;
}

interface Props {
  spec: ShipSpec;
  detail: ShipDetail;
  position: [number, number, number];
  /** Rotation about Y: bow (local +X) points to (cos h, -sin h) in XZ */
  heading: number;
  motion?: Motion;
  wakeSlot?: number;
  /** Bay (0 = aftmost) whose centre row gets a removable "slot" container for the crane */
  slotBay?: number;
  slotRef?: MutableRefObject<Group | null>;
  rock?: number;
  /** Draw mooring lines to the quay bollards (docked ship only) */
  moorings?: boolean;
  /** GLB hull/superstructure from the asset registry; replaces the procedural ship body */
  model?: NormalizedModel;
  modelId?: AssetId;
}

/**
 * Vertical offset that moves the procedural container stacks and loading well from the
 * procedural deck onto a GLB ship's deck (uses `deckHeight` / `draft` from the asset registry).
 */
export function glbStackLift(spec: ShipSpec, id: AssetId) {
  const a = modelAssets[id];
  const draft = a.draft ?? 0;
  const deckAboveWater = (a.deckHeight ?? spec.freeboard + draft) - draft;
  return -SHIP_LIFT + deckAboveWater - deckLevel(0.5, spec);
}

/* ------------------------------------------------------------------ helpers */

function facadeBox(w: number, h: number, d: number, tw = 4, th = 3.2): BufferGeometry {
  const g = new BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const faces: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i;
    uv.setXY(k, (uv.getX(k) * faces[f][0]) / tw, (uv.getY(k) * faces[f][1]) / th);
  }
  return g;
}

function useShipMaterials() {
  return useMemo(() => {
    const f = facadeTextures();
    return {
      hull: new MeshStandardMaterial({ vertexColors: true, map: hullTexture(), roughness: 0.48, metalness: 0.28, side: DoubleSide }),
      facade: new MeshStandardMaterial({ map: f.map, emissiveMap: f.emissive, emissive: "#ffb066", emissiveIntensity: 1.5, roughness: 0.55, metalness: 0.1 }),
      roof: new MeshStandardMaterial({ color: "#c9c4bb", roughness: 0.7, metalness: 0.1 }),
      white: new MeshStandardMaterial({ color: "#d8d3ca", roughness: 0.6, metalness: 0.15 }),
      steel: new MeshStandardMaterial({ color: "#6d7076", roughness: 0.45, metalness: 0.8 }),
      dark: new MeshStandardMaterial({ color: "#1a1b1f", roughness: 0.6, metalness: 0.5 }),
      funnel: new MeshStandardMaterial({ color: "#14284a", roughness: 0.5, metalness: 0.35 }),
      band: new MeshStandardMaterial({ color: "#d98427", roughness: 0.5, metalness: 0.2 }),
      lifeboat: new MeshStandardMaterial({ color: "#e0561a", roughness: 0.45, metalness: 0.15 }),
      deckGrey: new MeshStandardMaterial({ color: "#2a2d33", roughness: 0.75, metalness: 0.3 }),
    };
  }, []);
}

/* ------------------------------------------------------------ superstructure */

const LEVELS = [
  { l: 20, w: 26, h: 3.7 },
  { l: 18, w: 25, h: 3.4 },
  { l: 16, w: 24, h: 3.4 },
  { l: 14, w: 23, h: 3.4 },
  { l: 11.5, w: 22, h: 3.4 },
];

function Superstructure({ spec, high, m }: { spec: ShipSpec; high: boolean; m: ReturnType<typeof useShipMaterials> }) {
  const s = spec.length / 200;
  const xc = uToX(spec.bridgeU, spec);
  const y0 = deckLevel(spec.bridgeU, spec);
  const radar1 = useRef<Group>(null);
  const radar2 = useRef<Group>(null);

  const levelGeos = useMemo(() => LEVELS.map((l) => facadeBox(l.l, l.h, l.w)), []);
  const bridgeGeo = useMemo(() => facadeBox(9.5, 3.9, 31, 4.5, 3.9), []);
  const lifeboat = useMemo(() => new CapsuleGeometry(1.25, 5.2, 6, 14), []);
  useEffect(() => () => { levelGeos.forEach((g) => g.dispose()); bridgeGeo.dispose(); lifeboat.dispose(); }, [levelGeos, bridgeGeo, lifeboat]);

  useFrame(() => {
    const t = sceneClock.t;
    if (radar1.current) radar1.current.rotation.y = t * 1.6;
    if (radar2.current) radar2.current.rotation.y = -t * 1.1;
  });

  let y = 0;
  const stack = LEVELS.map((l, i) => {
    const cy = y + l.h / 2;
    y += l.h;
    return { ...l, cy, x: i * 0.45, i };
  });
  const bridgeY = y + 3.9 / 2;
  const roofY = y + 3.9;
  const funnelBase = stack[3].cy + stack[3].h / 2;

  return (
    <group position={[xc, y0, 0]} scale={s}>
      {stack.map((l) => (
        <mesh key={l.i} geometry={levelGeos[l.i]} position={[l.x, l.cy, 0]} castShadow receiveShadow
          material={[m.facade, m.facade, m.roof, m.roof, m.facade, m.facade]} />
      ))}
      <mesh geometry={bridgeGeo} position={[2.3, bridgeY, 0]} castShadow receiveShadow
        material={[m.facade, m.facade, m.roof, m.roof, m.facade, m.facade]} />
      {/* compass deck */}
      <mesh position={[2.0, roofY + 0.7, 0]} material={m.white} castShadow><boxGeometry args={[5, 1.4, 9]} /></mesh>

      {/* funnel */}
      <group position={[-5.5, funnelBase, 0]}>
        <mesh position={[0, 4.6, 0]} scale={[1, 1, 0.78]} material={m.funnel} castShadow><cylinderGeometry args={[3.5, 4.0, 9.2, 28]} /></mesh>
        <mesh position={[0, 6.3, 0]} scale={[1, 1, 0.78]} material={m.band}><cylinderGeometry args={[3.56, 3.7, 1.6, 28]} /></mesh>
        <mesh position={[0, 9.35, 0]} scale={[1, 1, 0.78]} material={m.dark}><cylinderGeometry args={[3.4, 3.5, 0.5, 28]} /></mesh>
        <mesh position={[-1.6, 9.8, 0]} material={m.dark}><boxGeometry args={[0.8, 1.2, 4]} /></mesh>
      </group>

      {/* radar mast */}
      <group position={[2.4, roofY + 1.4, 0]}>
        <mesh position={[0, 4, 0]} material={m.white} castShadow><cylinderGeometry args={[0.28, 0.4, 8, 10]} /></mesh>
        <mesh position={[0, 6.4, 0]} material={m.white}><boxGeometry args={[0.25, 0.25, 6.4]} /></mesh>
        <group ref={radar1} position={[0.4, 8.4, 0]}>
          <mesh material={m.dark}><boxGeometry args={[0.5, 0.3, 4.6]} /></mesh>
          <mesh position={[0, -0.35, 0]} material={m.steel}><cylinderGeometry args={[0.35, 0.35, 0.5, 8]} /></mesh>
        </group>
        <group ref={radar2} position={[0.4, 6.8, 2.6]}>
          <mesh material={m.dark}><boxGeometry args={[0.35, 0.25, 3]} /></mesh>
        </group>
        <mesh position={[0, 8.1, 0]} material={m.white}><sphereGeometry args={[0.7, 12, 10]} /></mesh>
        <mesh position={[-0.5, 10.2, -1.3]} material={m.steel}><cylinderGeometry args={[0.04, 0.04, 4, 5]} /></mesh>
        <mesh position={[0.2, 10.8, 1.2]} material={m.steel}><cylinderGeometry args={[0.04, 0.04, 5, 5]} /></mesh>
        <NavLight position={[0.2, 9.2, 0]} color="#ffffff" size={0.35} glow={7} phase={1} pulse={0.1} />
      </group>

      {/* bridge wing lights: red port (-z), green starboard (+z) */}
      <NavLight position={[2.3, bridgeY + 0.2, -15.9]} color="#ff2a1a" size={0.38} glow={5} phase={0.4} />
      <NavLight position={[2.3, bridgeY + 0.2, 15.9]} color="#25ff6a" size={0.38} glow={5} phase={2.1} />

      {/* lifeboats + davits */}
      {high && [-1, 1].map((sd) => (
        <group key={sd}>
          <mesh geometry={lifeboat} material={m.lifeboat} position={[-1.5, stack[1].cy + stack[1].h / 2 + 1.5, sd * 14.4]} rotation={[0, 0, Math.PI / 2]} castShadow />
          <mesh position={[-1.5, stack[1].cy + stack[1].h / 2 + 0.7, sd * 13.2]} material={m.steel}><boxGeometry args={[7, 0.3, 0.4]} /></mesh>
          <mesh position={[-4, stack[1].cy + stack[1].h / 2 + 1.6, sd * 13.4]} material={m.steel}><boxGeometry args={[0.3, 2.4, 0.3]} /></mesh>
          <mesh position={[1, stack[1].cy + stack[1].h / 2 + 1.6, sd * 13.4]} material={m.steel}><boxGeometry args={[0.3, 2.4, 0.3]} /></mesh>
        </group>
      ))}
      {/* stern light */}
      <NavLight position={[-12, 3.2, 0]} color="#fff2d0" size={0.3} glow={4} phase={3} pulse={0.08} />
    </group>
  );
}

/* ---------------------------------------------------------------- main ship */

export function CargoShip({ spec, detail, position, heading, motion, wakeSlot, slotBay, slotRef, rock = 0.0018, moorings = false, model, modelId = "cargoShipHero" }: Props) {
  const proc = !model;
  const glbStacks = !model || !modelAssets[modelId].includesContainers;
  const lift = model ? glbStackLift(spec, modelId) : 0;
  const quality = useNavigationStore((s) => s.quality);
  const hi = detail !== "distant";
  const shadows = quality !== "low" && hi;
  const m = useShipMaterials();
  const root = useRef<Group>(null);
  const rocker = useRef<Group>(null);

  const hull = useMemo(
    () => model ? null : (detail === "distant" ? buildHull(spec, 36, 5, 4) : buildHull(spec, quality === "low" ? 70 : 120, 10, 8)),
    [spec, detail, quality, model],
  );
  useEffect(() => () => hull?.dispose(), [hull]);
  const layout = useMemo(() => getShipLayout(spec, slotBay ?? null), [spec, slotBay]);

  const containerDetail: ContainerDetail = detail === "hero" ? (quality === "high" ? "full" : "coarse") : detail === "standard" ? "coarse" : "simple";
  const stacks = useMemo(() => {
    if (quality === "low" || detail === "distant") return layout.stacks.filter((_, i) => i % (detail === "distant" ? 2 : 1) === 0);
    return layout.stacks;
  }, [layout, quality, detail]);

  // hatch covers
  const hatches = useMemo<BoxItem[]>(() =>
    layout.bayCenters.map((cx, b) => {
      const u = layout.bayUs[b];
      const w = halfWidthAt(u, deckLevel(u, spec), spec) * 2 - 0.9;
      return { p: [cx, deckLevel(u, spec) + HATCH_H / 2, 0], s: [BAY_PITCH - 0.25, HATCH_H, w] };
    }), [layout, spec]);

  // railings along the sheer
  const rails = useMemo(() => {
    const posts: BoxItem[] = [], bars: BoxItem[] = [];
    if (detail === "distant") return { posts, bars };
    const step = 3.2;
    for (const side of [-1, 1]) {
      let prev: [number, number, number] | null = null;
      for (let x = -spec.length * 0.46; x < spec.length * 0.47; x += step) {
        const u = x / spec.length + 0.5;
        const y = deckLevel(u, spec);
        const z = side * (halfWidthAt(u, y, spec) - 0.3);
        posts.push({ p: [x, y + 0.55, z], s: [0.07, 1.1, 0.07] });
        if (prev) {
          const dx = x - prev[0], dz = z - prev[2];
          const len = Math.hypot(dx, dz);
          const ry = Math.atan2(-dz, dx);
          for (const hy of [1.05, 0.55]) bars.push({ p: [(x + prev[0]) / 2, (y + prev[1]) / 2 + hy, (z + prev[2]) / 2], s: [len, 0.05, 0.05], ry });
        }
        prev = [x, y, z];
      }
    }
    return { posts, bars };
  }, [spec, detail]);

  const { railLights, railLightBoxes } = useMemo(() => {
    const glow: number[] = [];
    const boxes: BoxItem[] = [];
    rails.posts.forEach((p, i) => {
      if (i % 2) return;
      glow.push(p.p[0], p.p[1] + 0.62, p.p[2]);
      boxes.push({ p: [p.p[0], p.p[1] + 0.62, p.p[2]], s: [0.2, 0.2, 0.2] });
    });
    return { railLights: glow, railLightBoxes: boxes };
  }, [rails]);

  // bollards / fore & aft mooring gear
  const bollards = useMemo<BoxItem[]>(() => {
    const out: BoxItem[] = [];
    if (detail === "distant") return out;
    for (const side of [-1, 1]) for (const u of [0.07, 0.12, 0.9, 0.94, 0.97]) {
      const y = deckLevel(u, spec);
      out.push({ p: [uToX(u, spec), y + 0.5, side * (halfWidthAt(u, y, spec) - 1.2)], s: [0.7, 1.0, 0.7] });
    }
    return out;
  }, [spec, detail]);

  const rotY = heading;
  const noseU = 0.975;
  const noseY = deckLevel(noseU, spec);
  const foreU = 0.88;
  const foreY = deckLevel(foreU, spec);

  useFrame(() => {
    const g = root.current, r = rocker.current;
    if (!g || !r) return;
    const t = sceneClock.t;
    let px = position[0], pz = position[2];
    if (motion) {
      const d = (t * motion.speed) % motion.travel;
      px += motion.dx * d; pz += motion.dz * d;
    }
    g.position.set(px, 0, pz);
    r.rotation.x = Math.sin(t * 0.42 + spec.seed) * rock;
    r.rotation.z = Math.sin(t * 0.31 + spec.seed * 2) * rock * 0.6;
    r.position.y = SHIP_LIFT + Math.sin(t * 0.55 + spec.seed) * 0.5 * rock * 60;
    if (wakeSlot !== undefined) {
      const w = wakeSources[wakeSlot];
      w.active = true; w.x = px; w.z = pz;
      w.dx = Math.cos(rotY); w.dz = -Math.sin(rotY);
      w.length = spec.length; w.halfWidth = spec.beam * 0.5; w.speed = motion?.speed ?? 0;
    }
  });
  useEffect(() => () => { if (wakeSlot !== undefined) wakeSources[wakeSlot].active = false; }, [wakeSlot]);

  const slotPos = layout.slot;
  const nameU = 0.58;

  return (
    <group ref={root} position={position} rotation={[0, rotY, 0]}>
      <group ref={rocker} position={[0, SHIP_LIFT, 0]}>
        {hull && <mesh geometry={hull} material={m.hull} castShadow={shadows} receiveShadow={shadows} />}
        {model && <primitive object={model.root} position={[0, -SHIP_LIFT, 0]} scale={spec.length / modelAssets[modelId].fit.meters} />}
        <group position={[0, lift, 0]}>
          {proc && <InstancedBoxes items={hatches} color="#1f242c" roughness={0.7} metalness={0.5} castShadow={shadows} />}
          {glbStacks && <ContainerStack items={stacks} detail={containerDetail} castShadow={shadows} />}
        {slotPos && (
          <group ref={slotRef} position={[slotPos.x, slotPos.y, slotPos.z]}>
            {[0, 1, 2].map((k) => (
              <group key={k} visible={false}>
                <ContainerStack items={[{ position: [0, k * CONTAINER_H, 0], color: 0xb23a2c }]} detail={containerDetail} castShadow={shadows} />
              </group>
            ))}
          </group>
        )}
        </group>

        {proc && hi && <Superstructure spec={spec} high={detail === "hero"} m={m} />}
        {proc && !hi && (
          <group>
            <mesh position={[uToX(spec.bridgeU, spec), deckLevel(spec.bridgeU, spec) + 9, 0]} material={m.white}><boxGeometry args={[18, 18, 24]} /></mesh>
            <mesh position={[uToX(spec.bridgeU, spec) - 4, deckLevel(spec.bridgeU, spec) + 20, 0]} material={m.funnel}><cylinderGeometry args={[3, 3.5, 7, 10]} /></mesh>
            <NavLight position={[uToX(spec.bridgeU, spec), deckLevel(spec.bridgeU, spec) + 22, 0]} color="#fff3d6" size={0.7} glow={22} phase={spec.seed} />
          </group>
        )}

        {/* fore deck: mast, mooring winches, jack staff */}
        {proc && hi && (
          <group>
            <mesh position={[uToX(foreU, spec), foreY + 6, 0]} material={m.white} castShadow><cylinderGeometry args={[0.22, 0.32, 12, 8]} /></mesh>
            <mesh position={[uToX(foreU, spec), foreY + 9, 0]} material={m.white}><boxGeometry args={[0.2, 0.2, 4]} /></mesh>
            <NavLight position={[uToX(foreU, spec), foreY + 12.2, 0]} color="#ffffff" size={0.32} glow={6} phase={0.7} pulse={0.1} />
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[uToX(noseU - 0.045, spec), noseY + 0.8, sd * 3]} rotation={[0, 0, Math.PI / 2]} material={m.deckGrey} castShadow>
                <cylinderGeometry args={[0.9, 0.9, 3.2, 12]} />
              </mesh>
            ))}
            <mesh position={[uToX(0.93, spec), noseY + 0.9, 0]} material={m.deckGrey}><boxGeometry args={[6, 1.8, 9]} /></mesh>
            <mesh position={[uToX(noseU, spec) + 0.4, noseY + 1.5, 0]} rotation={[0, 0, -0.55]} material={m.steel}><cylinderGeometry args={[0.05, 0.05, 3, 6]} /></mesh>
            {/* ventilation mushrooms near the accommodation */}
            {[-6, 6].map((z) => (
              <group key={z} position={[uToX(spec.bridgeU, spec) + 15 * (spec.length / 200), deckLevel(spec.bridgeU, spec), z]}>
                <mesh position={[0, 1.4, 0]} material={m.white}><cylinderGeometry args={[0.5, 0.6, 2.8, 12]} /></mesh>
                <mesh position={[0, 3, 0]} material={m.white}><sphereGeometry args={[1.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
              </group>
            ))}
          </group>
        )}
        {proc && hi && <NavLight position={[uToX(noseU, spec), noseY + 3.4, 0]} color="#ffe9c0" size={0.3} glow={5} phase={1.9} pulse={0.1} />}

        {proc && detail !== "distant" && (
          <>
            <InstancedBoxes items={rails.posts} color="#8e9096" roughness={0.5} metalness={0.7} />
            <InstancedBoxes items={rails.bars} color="#8e9096" roughness={0.5} metalness={0.7} />
            <InstancedBoxes items={bollards} color="#202226" roughness={0.6} metalness={0.7} castShadow={shadows} />
          </>
        )}

        {/* bulbous bow, hawse pipes and anchors */}
        {proc && hi && (() => {
          const k = keelLevel(1, spec), top = deckLevel(1, spec);
          const yf = (0 - k) / (top - k);
          const stemX = uToX(1, spec) - stemRake(spec) * bowMask(1) * (1 - yf);
          return (
            <group>
              <mesh position={[stemX - 0.8, -spec.draft * 0.3, 0]} scale={[4.0, 2.3, 2.2]} castShadow={shadows}>
                <sphereGeometry args={[1, 24, 16]} />
                <meshStandardMaterial color="#7d1f18" roughness={0.55} metalness={0.3} />
              </mesh>
              {[-1, 1].map((sd) => {
                const u = 0.935, y = deckLevel(u, spec) - 4.2;
                const z = sd * (halfWidthAt(u, y, spec) + 0.15);
                return (
                  <group key={sd} position={[uToX(u, spec), y, z]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]} material={m.dark}><cylinderGeometry args={[0.95, 0.95, 0.35, 16]} /></mesh>
                    <group position={[0, -2.2, sd * 0.35]}>
                      <mesh material={m.dark}><boxGeometry args={[0.32, 3.4, 0.32]} /></mesh>
                      <mesh position={[0, 1.5, 0]} material={m.dark}><boxGeometry args={[1.8, 0.3, 0.3]} /></mesh>
                      <mesh position={[0, -1.7, 0]} material={m.dark}><boxGeometry args={[2.6, 0.45, 0.5]} /></mesh>
                      <mesh position={[0.9, -1.4, 0]} rotation={[0, 0, -0.6]} material={m.dark}><boxGeometry args={[1.2, 0.35, 0.45]} /></mesh>
                      <mesh position={[-0.9, -1.4, 0]} rotation={[0, 0, 0.6]} material={m.dark}><boxGeometry args={[1.2, 0.35, 0.45]} /></mesh>
                    </group>
                  </group>
                );
              })}
            </group>
          );
        })()}

        {/* string lights along the rails + stayed foremast */}
        {proc && hi && (
          <>
            <GlowPoints positions={railLights} size={3.0} opacity={0.8} />
            <InstancedBoxes items={railLightBoxes} color="#fff0d0" emissive="#ffae5a" emissiveIntensity={6} toneMapped={false} />
          </>
        )}
        {proc && hi && [-1, 1].map((sd) => (
          <group key={`stay${sd}`}>
            <Rope from={[uToX(foreU, spec), foreY + 11.6, 0]} to={[uToX(foreU, spec) - 12, foreY + 0.8, sd * 5]} radius={0.06} />
            <Rope from={[uToX(foreU, spec), foreY + 11.6, 0]} to={[uToX(foreU, spec) + 13, noseY + 1.5, sd * 1.5]} radius={0.06} />
          </group>
        ))}

        {/* mooring lines from the fairleads to the quay bollards */}
        {moorings && detail === "hero" && (() => {
          const bollard = (wx: number): [number, number, number] => [wx - position[0], 3.5 - SHIP_LIFT, 1.3 - position[2]];
          const fl = (u: number): [number, number, number] => { const y = deckLevel(u, spec); return [uToX(u, spec), y + 0.9, halfWidthAt(u, y, spec) - 1.2]; };
          return (
            <group>
              <Rope from={fl(0.955)} to={bollard(-12)} sag={1.6} radius={0.11} />
              <Rope from={fl(0.93)} to={bollard(-40)} sag={1.4} radius={0.11} />
              <Rope from={fl(0.06)} to={bollard(-236)} sag={1.4} radius={0.11} />
              <Rope from={fl(0.09)} to={bollard(-208)} sag={1.2} radius={0.11} />
            </group>
          );
        })()}

        {/* ship name lettering on the bow topsides */}
        {proc && detail === "hero" && [-1, 1].map((sd) => {
          const y = 8.8;
          const z = sd * (halfWidthAt(nameU, y, spec) + 0.15);
          return (
            <mesh key={sd} position={[uToX(nameU, spec), y, z]} rotation={[0, sd > 0 ? 0 : Math.PI, 0]}>
              <planeGeometry args={[26, 4]} />
              <meshBasicMaterial map={nameTexture(spec.name.toUpperCase())} transparent depthWrite={false} toneMapped={false} opacity={0.9} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
