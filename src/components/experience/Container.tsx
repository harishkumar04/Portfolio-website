"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry, BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute,
  InstancedMesh, MeshStandardMaterial, Object3D, Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { containerAtlas } from "@/lib/textures";
import { useContainerParts } from "./assets/ContainerSource";
import type { InstancedPart } from "@/lib/models";

export const CONTAINER_H = 2.591;
export const CONTAINER_W = 2.438;
export const LEN_40 = 12.192;
export const LEN_20 = 6.058;

export type ContainerDetail = "full" | "coarse" | "simple";

export interface ContainerInstance {
  position: [number, number, number];
  rotationY?: number;
  color: number;
}

/** Muted, weathered industrial palette. */
export const CONTAINER_COLORS = [
  0xa93a2e, 0xb8422f, 0x9c2f26, 0xc04a34, 0x8f2b2a, 0x2a5d8a, 0x1f4e79, 0x3a6f9a,
  0x6b4a33, 0x7a5236, 0x2f6b5a, 0x3f7f78, 0xc58a24, 0x6e7378, 0xd2ccc0, 0x1c3557,
];

const geoCache = new Map<string, { body: BufferGeometry; fittings: BufferGeometry | null }>();
let bodyMat: MeshStandardMaterial | null = null;
let fitMat: MeshStandardMaterial | null = null;

export function disposeContainerCache() {
  geoCache.forEach((v) => { v.body.dispose(); v.fittings?.dispose(); });
  geoCache.clear();
  bodyMat?.dispose(); fitMat?.dispose();
  bodyMat = fitMat = null;
}

function nb(g: BufferGeometry) {
  const n = g.index ? g.toNonIndexed() : g;
  n.deleteAttribute("uv");
  return n;
}
const box = (w: number, h: number, d: number, x: number, y: number, z: number) =>
  nb(new BoxGeometry(w, h, d).translate(x, y, z));

function corrugatedSide(L: number, pitch: number, amp: number, sign: 1 | -1) {
  const x0 = -L / 2 + 0.14, x1 = L / 2 - 0.14;
  const n = Math.max(1, Math.round((x1 - x0) / pitch));
  const step = (x1 - x0) / (n * 4);
  const off = [0, amp, amp, 0];
  const y0 = -CONTAINER_H / 2 + 0.12, y1 = CONTAINER_H / 2 - 0.12;
  const base = sign * (CONTAINER_W / 2 - 0.075);
  const pos: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[]) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 0; i < n * 4; i++) {
    const xa = x0 + i * step, xb = x0 + (i + 1) * step;
    const za = base + sign * off[i % 4], zb = base + sign * off[(i + 1) % 4];
    if (sign === 1) quad([xa, y0, za], [xb, y0, zb], [xb, y1, zb], [xa, y1, za]);
    else quad([xa, y0, za], [xa, y1, za], [xb, y1, zb], [xb, y0, zb]);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Planar atlas UVs per face orientation (the atlas row is chosen per instance in the shader). */
function projectUV(g: BufferGeometry, L: number) {
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    let u: number, v: number;
    if (ay > 0.8) { u = (x + L / 2) / L; v = (z + CONTAINER_W / 2) / CONTAINER_W; }
    else if (ax > 0.8) { u = (z + CONTAINER_W / 2) / CONTAINER_W; v = (y + CONTAINER_H / 2) / CONTAINER_H; }
    else { u = (x + L / 2) / L; v = (y + CONTAINER_H / 2) / CONTAINER_H; }
    uv[i * 2] = u; uv[i * 2 + 1] = v * 0.25;
  }
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
}

function build(L: number, detail: ContainerDetail) {
  const key = `${L}-${detail}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  const H = CONTAINER_H, W = CONTAINER_W;
  const parts: BufferGeometry[] = [];
  if (detail === "simple") {
    parts.push(box(L, H, W, 0, 0, 0));
  } else {
    const pitch = detail === "full" ? 0.36 : 0.95;
    parts.push(corrugatedSide(L, pitch, 0.058, 1), corrugatedSide(L, pitch, 0.058, -1));
    parts.push(box(L - 0.3, 0.07, W - 0.1, 0, H / 2 - 0.07, 0));
    parts.push(box(0.07, H - 0.24, W - 0.2, L / 2 - 0.06, 0, 0), box(0.07, H - 0.24, W - 0.2, -L / 2 + 0.06, 0, 0));
    if (detail === "full") {
      for (let i = 0; i < 9; i++) parts.push(box(0.1, H - 0.3, 0.11, -L / 2 + 0.02, 0, -W / 2 + 0.28 + i * ((W - 0.56) / 8)));
      for (let i = 0; i < 3; i++) parts.push(box(L - 0.5, 0.025, 0.1, 0, H / 2 - 0.095, -0.7 + i * 0.7));
    }
  }
  const body = mergeGeometries(parts, false)!;
  body.computeVertexNormals();
  projectUV(body, L);
  parts.forEach((p) => p.dispose());

  let fittings: BufferGeometry | null = null;
  if (detail !== "simple") {
    const f: BufferGeometry[] = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1])
      f.push(box(0.26, 0.2, 0.22, sx * (L / 2 - 0.13), sy * (H / 2 - 0.1), sz * (W / 2 - 0.11)));
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) f.push(box(L - 0.5, 0.1, 0.12, 0, sy * (H / 2 - 0.05), sz * (W / 2 - 0.06)));
    for (const sy of [-1, 1]) for (const sx of [-1, 1]) f.push(box(0.12, 0.1, W - 0.5, sx * (L / 2 - 0.06), sy * (H / 2 - 0.05), 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.push(box(0.12, H - 0.4, 0.14, sx * (L / 2 - 0.07), 0, sz * (W / 2 - 0.07)));
    if (detail === "full") {
      for (const z of [-0.88, -0.3, 0.3, 0.88])
        f.push(nb(new CylinderGeometry(0.022, 0.022, H - 0.3, 6).translate(L / 2 + 0.025, 0, z)));
      for (const z of [-0.88, 0.88]) for (const y of [-0.85, 0.85]) f.push(box(0.07, 0.12, 0.1, L / 2 + 0.04, y, z));
      f.push(box(0.03, H - 0.3, 0.03, L / 2 + 0.01, 0, 0));
    }
    fittings = mergeGeometries(f, false)!;
    fittings.computeVertexNormals();
    f.forEach((p) => p.dispose());
  }
  const out = { body, fittings };
  geoCache.set(key, out);
  return out;
}

function getBodyMaterial() {
  if (bodyMat) return bodyMat;
  const m = new MeshStandardMaterial({ map: containerAtlas(), roughness: 0.64, metalness: 0.3, side: DoubleSide });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <uv_vertex>",
      `#include <uv_vertex>
#if defined(USE_INSTANCING) && defined(USE_MAP)
  float rnd = fract(sin(dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  vMapUv.y += floor(rnd * 4.0) * 0.25;
#endif`,
    );
  };
  bodyMat = m;
  return m;
}
function getFittingMaterial() {
  return (fitMat ??= new MeshStandardMaterial({ color: 0x3b3b3e, roughness: 0.5, metalness: 0.75 }));
}

interface Props {
  items: ContainerInstance[];
  length?: number;
  detail?: ContainerDetail;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Instanced shipping containers: corrugated walls, corner castings, door gear, weathered atlas. */
export function ContainerStack(props: Props) {
  const parts = useContainerParts();
  const { length = LEN_40, detail = "full" } = props;
  if (parts && Math.abs(length - LEN_40) < 0.01 && detail !== "simple") return <GlbContainerInstances {...props} parts={parts} />;
  return <ProceduralContainers {...props} />;
}

/** One GLB container drawn N times: an InstancedMesh per mesh part; the main body takes the tint. */
function GlbContainerInstances({ items, parts, castShadow = false, receiveShadow = true }: Props & { parts: InstancedPart[] }) {
  const refs = useRef<(InstancedMesh | null)[]>([]);
  // the painted shell is the part with the largest bounding volume; it alone takes the per-container tint
  const bodyIndex = useMemo(() => {
    const vol = (p: InstancedPart) => { p.geometry.computeBoundingBox(); const s = p.geometry.boundingBox!.getSize(new Vector3()); return s.x * s.y * s.z; };
    return parts.reduce((best, p, i) => (vol(p) > vol(parts[best]) ? i : best), 0);
  }, [parts]);
  useLayoutEffect(() => {
    const o = new Object3D();
    const c = new Color();
    refs.current.forEach((m, pi) => {
      if (!m) return;
      items.forEach((it, i) => {
        o.position.set(...it.position);
        o.rotation.set(0, it.rotationY ?? 0, 0);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        if (pi === bodyIndex) m.setColorAt(i, c.setHex(it.color));
      });
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
    });
  }, [items, parts, bodyIndex]);
  if (!items.length) return null;
  return (
    <>
      {parts.map((p, i) => (
        <instancedMesh key={i} ref={(el) => { refs.current[i] = el; }} args={[p.geometry, p.material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />
      ))}
    </>
  );
}

function ProceduralContainers({ items, length = LEN_40, detail = "full", castShadow = false, receiveShadow = true }: Props) {
  const body = useRef<InstancedMesh>(null);
  const fit = useRef<InstancedMesh>(null);
  const geos = useMemo(() => build(length, detail), [length, detail]);

  useLayoutEffect(() => {
    const o = new Object3D();
    const c = new Color();
    const meshes = [body.current, fit.current];
    items.forEach((it, i) => {
      o.position.set(...it.position);
      o.rotation.set(0, it.rotationY ?? 0, 0);
      o.updateMatrix();
      c.setHex(it.color);
      for (const m of meshes) if (m) { m.setMatrixAt(i, o.matrix); }
      body.current?.setColorAt(i, c);
    });
    for (const m of meshes) if (m) { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); }
    if (body.current?.instanceColor) body.current.instanceColor.needsUpdate = true;
  }, [items, geos]);

  if (!items.length) return null;
  return (
    <>
      <instancedMesh ref={body} args={[geos.body, getBodyMaterial(), items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />
      {geos.fittings && (
        <instancedMesh ref={fit} args={[geos.fittings, getFittingMaterial(), items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />
      )}
    </>
  );
}
