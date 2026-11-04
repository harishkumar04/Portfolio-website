import { Box3, BufferGeometry, Material, Matrix4, Mesh, Object3D, Vector3, type WebGLRenderer } from "three";
import { useGLTF } from "@react-three/drei";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import type { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { ModelAsset } from "@/config/assets";

/** Local decoder paths (copied into /public so nothing loads from a CDN). */
export const DRACO_PATH = "/draco/";
export const BASIS_PATH = "/basis/";

let ktx2: KTX2Loader | null = null;
function getKTX2(gl: WebGLRenderer) {
  if (!ktx2) ktx2 = new KTX2Loader().setTranscoderPath(BASIS_PATH).detectSupport(gl);
  return ktx2;
}

/** useGLTF with Draco, Meshopt and KTX2 enabled. Suspends while loading. */
export function useHarborGLTF(url: string, gl: WebGLRenderer) {
  return useGLTF(url, DRACO_PATH, true, (loader) => {
    (loader as unknown as GLTFLoader).setKTX2Loader(getKTX2(gl) as never);
  });
}

export interface NormalizedModel {
  root: Object3D;
  /** Nodes found for the asset's animation roles. */
  nodes: Partial<Record<"trolley" | "spreader" | "hoistOrigin", Object3D>>;
  size: Vector3;
}

/**
 * Clones a GLB scene and brings it into scene conventions: rotation, uniform scale to the
 * target extent, centred in X/Z, base on y = 0 (minus draft), then the configured offset.
 * Meshes cast/receive shadows. Each call returns an independent clone.
 */
export function normalizeModel(scene: Object3D, asset: ModelAsset): NormalizedModel {
  const inner = scene.clone(true);
  if (asset.rotation) inner.rotation.set(...asset.rotation);
  inner.updateMatrixWorld(true);
  const box = new Box3().setFromObject(inner);
  const size = box.getSize(new Vector3());
  const extent = size[asset.fit.axis] || 1;
  const k = asset.fit.meters / extent;
  inner.scale.multiplyScalar(k);
  inner.updateMatrixWorld(true);
  box.setFromObject(inner);
  const c = box.getCenter(new Vector3());
  inner.position.sub(new Vector3(c.x, box.min.y + (asset.draft ?? 0), c.z));
  if (asset.offset) inner.position.add(new Vector3(...asset.offset));

  const root = new Object3D();
  root.name = `asset:${asset.id}`;
  root.add(inner);
  inner.traverse((o) => {
    if ((o as Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  const nodes: NormalizedModel["nodes"] = {};
  for (const [role, name] of Object.entries(asset.nodes ?? {})) {
    const n = name ? inner.getObjectByName(name) : undefined;
    if (n) nodes[role as keyof NormalizedModel["nodes"]] = n;
  }
  return { root, nodes, size: box.getSize(new Vector3()) };
}

export interface InstancedPart {
  geometry: BufferGeometry;
  material: Material;
}

/**
 * Flattens a (normalised) model into per-mesh geometries with their world transforms baked in,
 * ready to feed InstancedMesh — e.g. one GLB container drawn thousands of times.
 */
export function extractInstancedParts(model: NormalizedModel): InstancedPart[] {
  const parts: InstancedPart[] = [];
  model.root.updateMatrixWorld(true);
  const inv = new Matrix4().copy(model.root.matrixWorld).invert();
  model.root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const g = m.geometry.clone();
    g.applyMatrix4(new Matrix4().multiplyMatrices(inv, m.matrixWorld));
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    parts.push({ geometry: g, material: mats[0] });
  });
  return parts;
}
