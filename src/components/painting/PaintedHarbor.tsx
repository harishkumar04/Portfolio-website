"use client";

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { suspend } from "suspend-react";
import {
  AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, LinearFilter, LinearMipmapLinearFilter, Mesh,
  MeshBasicMaterial, PlaneGeometry, Points, PointsMaterial, ShaderMaterial, SRGBColorSpace, Vector2, type Texture,
} from "three";
import { sceneClock } from "@/lib/clock";
import { useNavigationStore } from "@/store/navigationStore";
import { PlateProjection } from "./projection";
import { CraneRig } from "./CraneRig";
import { CameraController } from "@/components/navigation/CameraController";
import { cardMaterial, driftMaterial, glowMaterial, glowTexture, projectedGroundMaterial, uvRect } from "./materials";
import type { LayerDef, Px, SceneManifest, SpriteDef } from "./types";

export const loadManifest = (url: string) =>
  suspend(async () => (await fetch(url)).json() as Promise<SceneManifest>, [url]);

/** Camera-facing frame at `depth` along the home camera's view axis; children use card-local metres. */
function CardFrame({ p, depth, children }: { p: PlateProjection; depth: number; children: ReactNode }) {
  const origin = useMemo(() => p.cardOrigin(depth), [p, depth]);
  return <group position={origin} quaternion={p.quaternion}>{children}</group>;
}

/** A plane covering `rect` (image px) on a card at `depth`, optionally over-scanned with clamped UVs. */
function cardGeometry(p: PlateProjection, rect: [number, number, number, number], depth: number, margin = 0) {
  const [x0, y0, x1, y1] = rect;
  const mx = (x1 - x0) * margin, my = (y1 - y0) * margin;
  const s = p.metersPerPixel(depth);
  const g = new PlaneGeometry((x1 - x0 + 2 * mx) * s, (y1 - y0 + 2 * my) * s);
  if (margin) {
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (1 + 2 * margin) - margin, uv.getY(i) * (1 + 2 * margin) - margin);
  }
  const [cx, cy] = p.cardLocal([(x0 + x1) / 2, (y0 + y1) / 2], depth);
  g.translate(cx, cy, 0);
  return g;
}

function layerDepth(p: PlateProjection, L: { depth?: number; contactY?: number; ground?: number }) {
  if (L.depth) return L.depth;
  if (L.contactY !== undefined) return p.depthFromContact(L.contactY, L.ground ?? 0);
  return 400;
}

export function PaintedHarbor({ url }: { url: string }) {
  const m = loadManifest(url);
  const quality = useNavigationStore((s) => s.quality);
  const base = url.slice(0, url.lastIndexOf("/") + 1);
  const half = quality === "low";
  const p = useMemo(() => new PlateProjection(m), [m]);

  // every image the scene uses, at full or half resolution
  const files = useMemo(() => {
    const f: Record<string, string> = {};
    const pick = (file: string) => base + (half ? file.replace(/\.webp$/, ".half.webp") : file);
    m.layers.forEach((l) => { f[l.id] = pick(l.file); });
    m.sprites.forEach((s) => { f[s.id] = pick(s.file); });
    return f;
  }, [m, base, half]);
  const loaded = useTexture(files) as unknown as Record<string, Texture>;
  useMemo(() => {
    Object.values(loaded).forEach((t) => {
      t.colorSpace = SRGBColorSpace;
      t.minFilter = LinearMipmapLinearFilter;
      t.magFilter = LinearFilter;
      t.anisotropy = 8;
      t.needsUpdate = true;
    });
  }, [loaded]);

  const animated = useRef(new Set<ShaderMaterial>());
  const register = useCallback((mat: ShaderMaterial) => {
    animated.current.add(mat);
    return () => { animated.current.delete(mat); };
  }, []);
  useFrame(() => {
    for (const mat of animated.current) mat.uniforms.uTime.value = sceneClock.t;
  });

  const sprite = (role: SpriteDef["role"]) => m.sprites.find((s) => s.role === role);
  const craneLayer = m.crane ? m.layers.find((l) => l.id === m.crane!.card) : undefined;
  const sunUv = m.sun ? new Vector2(m.sun.at[0] / m.image.width, 1 - m.sun.at[1] / m.image.height) : undefined;

  return (
    <group>
      {m.layers.map((L) => (
        <Layer key={L.id} L={L} p={p} map={loaded[L.id]} m={m} sunUv={sunUv} register={register} />
      ))}
      {m.sprites.filter((s) => s.role === "distantShip").map((s) => (
        <DistantShip key={s.id} s={s} p={p} map={loaded[s.id]} sun={m.sun?.at} />
      ))}
      {m.crane && craneLayer && sprite("trolley") && sprite("spreader") && sprite("container") && (
        <CardFrame p={p} depth={layerDepth(p, craneLayer) - 0.5}>
          <CraneRig crane={m.crane} depth={layerDepth(p, craneLayer) - 0.5} projection={p} textures={loaded}
            sprites={{ trolley: sprite("trolley")!, spreader: sprite("spreader")!, container: sprite("container")! }} />
        </CardFrame>
      )}
      {m.sun && m.atmosphere?.sunBloom !== false && <SunBloom p={p} at={m.sun.at} radius={m.sun.radius} />}
      {m.atmosphere?.haze !== false && <HorizonHaze p={p} m={m} />}
      <Motes p={p} enabled={quality !== "low" && m.atmosphere?.motes !== false} />
      <CameraController projection={p} focus={m.focus} />
    </group>
  );
}

function Layer({ L, p, map, m, sunUv, register }: {
  L: LayerDef; p: PlateProjection; map: Texture; m: SceneManifest; sunUv?: Vector2; register: (m: ShaderMaterial) => () => void;
}) {
  const W = m.image.width, H = m.image.height;

  const built = useMemo(() => {
    if (L.type === "ground") {
      const g = new PlaneGeometry(16000, 16000).rotateX(-Math.PI / 2).translate(0, L.groundY ?? 0, -7000);
      const mat = projectedGroundMaterial({
        map, rect: uvRect(L.rect, W, H), homeVP: p.viewProj, homePos: p.camera.position, texSize: new Vector2(L.rect[2] - L.rect[0], L.rect[3] - L.rect[1]),
        water: L.kind === "water", sunUv,
      });
      return { kind: "ground" as const, g, mat, depth: 0 };
    }
    const depth = L.type === "sky" ? 6000 : layerDepth(p, L);
    const g = cardGeometry(p, L.rect, depth, L.type === "sky" ? 0.18 : 0);
    if (L.drift) {
      const mat = driftMaterial(map, L.drift.maxShift / (L.rect[2] - L.rect[0]), L.drift.period);
      return { kind: "card" as const, g, mat, depth };
    }
    const mat = L.type === "sky" ? new MeshBasicMaterial({ map, toneMapped: false }) : cardMaterial(map);
    return { kind: "card" as const, g, mat, depth };
  }, [L, p, map, W, H, sunUv]);
  useEffect(() => (built.mat instanceof ShaderMaterial && "uTime" in built.mat.uniforms ? register(built.mat) : undefined), [built, register]);
  useEffect(() => () => { built.g.dispose(); built.mat.dispose(); }, [built]);

  if (built.kind === "ground") return <mesh geometry={built.g} material={built.mat} renderOrder={-5} frustumCulled={false} />;
  const order = L.type === "sky" ? -10 : L.order ?? 3;
  const mesh = <mesh geometry={built.g} material={built.mat} renderOrder={order} frustumCulled={false} />;
  return (
    <CardFrame p={p} depth={built.depth}>
      {L.bob ? <Bobbing p={p} L={L} depth={built.depth}>{mesh}</Bobbing> : mesh}
    </CardFrame>
  );
}

/** Gentle heave and roll about the waterline, as if the moored ship is breathing with the swell. */
function Bobbing({ p, L, depth, children }: { p: PlateProjection; L: LayerDef; depth: number; children: ReactNode }) {
  const pivot = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const [px, py] = p.cardLocal([(L.rect[0] + L.rect[2]) / 2, L.contactY ?? L.rect[3]], depth);
  useFrame(() => {
    if (!pivot.current || !L.bob) return;
    const w = (2 * Math.PI) / L.bob.period, t = sceneClock.t;
    pivot.current.rotation.z = ((L.bob.roll * Math.PI) / 180) * Math.sin(w * t);
    pivot.current.position.y = py + L.bob.amplitude * (Math.sin(w * t + 0.9) * 0.7 + Math.sin(w * 1.7 * t) * 0.3);
  });
  return (
    <group ref={pivot} position={[px, py, 0]}>
      <group ref={inner} position={[-px, -py, 0]}>{children}</group>
    </group>
  );
}

/** A distant ship cut from the painting, steaming slowly towards the sun and the horizon. */
function DistantShip({ s, p, map, sun }: { s: SpriteDef; p: PlateProjection; map: Texture; sun?: Px }) {
  const g = useRef<Group>(null);
  const mat = useMemo(() => cardMaterial(map), [map]);
  const { geo, start, dir } = useMemo(() => {
    const cx = (s.rect[0] + s.rect[2]) / 2;
    const contact: Px = [cx, s.contactY ?? s.rect[3]];
    const start = p.groundPoint(contact, s.ground ?? 0);
    const d0 = p.depthOf(start);
    const sm = p.metersPerPixel(d0);
    const geo = new PlaneGeometry((s.rect[2] - s.rect[0]) * sm, (s.rect[3] - s.rect[1]) * sm);
    geo.translate(0, ((contact[1] - (s.rect[1] + s.rect[3]) / 2) * sm), 0);
    const target = p.groundPoint([sun ? sun[0] : cx, p.H * 0.5], 0);
    const dir = target.clone().sub(start).setY(0).normalize();
    return { geo, start, dir };
  }, [s, p, sun]);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  useFrame(() => {
    if (!g.current) return;
    const travel = s.travel ?? 300, speed = s.speed ?? 1;
    const f = ((sceneClock.t * speed) / travel + 0.15) % 1;
    g.current.position.copy(start).addScaledVector(dir, (f - 0.15) * travel);
    mat.opacity = Math.min(1, f / 0.06) * (1 - Math.max(0, (f - 0.88) / 0.12));
  });
  return (
    <group ref={g} quaternion={p.quaternion}>
      <mesh geometry={geo} material={mat} renderOrder={s.order ?? 2} />
    </group>
  );
}

/** A soft, slowly breathing bloom on the painted sun (kept below the painting's own brightness). */
function SunBloom({ p, at, radius }: { p: PlateProjection; at: Px; radius: number }) {
  const ref = useRef<Mesh>(null);
  const depth = 5900;
  const mat = useMemo(() => glowMaterial("#ffb067", 0.22), []);
  const pos = p.cardLocal(at, depth);
  const size = radius * 7 * p.metersPerPixel(depth);
  useFrame(() => {
    mat.opacity = 0.2 + 0.035 * Math.sin(sceneClock.t * 0.35);
    ref.current?.scale.setScalar(1 + 0.03 * Math.sin(sceneClock.t * 0.27));
  });
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <CardFrame p={p} depth={depth}>
      <mesh ref={ref} position={[pos[0], pos[1], 0]} material={mat} renderOrder={1.5}>
        <planeGeometry args={[size, size]} />
      </mesh>
    </CardFrame>
  );
}

/** Warm atmospheric band along the horizon that slowly breathes, adding aerial depth. */
function HorizonHaze({ p, m }: { p: PlateProjection; m: SceneManifest }) {
  const depth = 1600;
  const mat = useMemo(() => new MeshBasicMaterial({ map: glowTexture(), color: "#ff9a6a", transparent: true, opacity: 0.1, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  const [, y] = p.cardLocal([m.image.width / 2, m.camera.horizonY], depth);
  const w = m.image.width * 1.6 * p.metersPerPixel(depth), h = m.image.height * 0.16 * p.metersPerPixel(depth);
  useFrame(() => { mat.opacity = 0.085 + 0.025 * Math.sin(sceneClock.t * 0.12); });
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <CardFrame p={p} depth={depth}>
      <mesh position={[0, y, 0]} material={mat} renderOrder={2.5}><planeGeometry args={[w, h]} /></mesh>
    </CardFrame>
  );
}

/** A few sunlit motes drifting in the foreground air: subtle depth cue under camera parallax. */
function Motes({ p, enabled }: { p: PlateProjection; enabled: boolean }) {
  const ref = useRef<Points>(null);
  const { geo, mat, seeds } = useMemo(() => {
    const n = 70;
    const pos = new Float32Array(n * 3), seeds = new Float32Array(n * 3);
    const rnd = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    for (let i = 0; i < n * 3; i++) seeds[i] = rnd(i + 1);
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    const mat = new PointsMaterial({ map: glowTexture(), color: "#ffd2a0", size: 0.09, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
    return { geo, mat, seeds };
  }, []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  useFrame(() => {
    if (!ref.current) return;
    const a = geo.getAttribute("position") as Float32BufferAttribute;
    const t = sceneClock.t;
    for (let i = 0; i < a.count; i++) {
      const sx = seeds[i * 3], sy = seeds[i * 3 + 1], sz = seeds[i * 3 + 2];
      const z = -(6 + sz * 18);
      const span = -z * 0.9;
      const x = ((sx * 2 - 1) * span + t * 0.05 * (0.5 + sz)) % span;
      const y = (sy * 2 - 1) * span * 0.45 + Math.sin(t * 0.3 + sx * 9) * 0.25;
      a.setXYZ(i, x, y, z);
    }
    a.needsUpdate = true;
  });
  if (!enabled) return null;
  return (
    <group position={p.camera.position} quaternion={p.quaternion}>
      <points ref={ref} geometry={geo} material={mat} renderOrder={20} frustumCulled={false} />
    </group>
  );
}
