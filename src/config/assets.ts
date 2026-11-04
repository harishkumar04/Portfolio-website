/**
 * Asset registry. Every external model goes through here: drop the file under /public/models,
 * set `url`, fill in `source` from the model page (see docs/ASSET_MANIFEST.md). With `url: null`
 * the scene uses the built-in procedural model, so the site always works.
 */
export type AssetId =
  | "cargoShipHero"
  | "cargoShipDistant"
  | "gantryCrane"
  | "container40"
  | "terminalTruck"
  | "forklift";

export interface AssetSource {
  title: string;
  page: string;
  author: string;
  license: string;
  attribution: string;
}

export interface ModelAsset {
  id: AssetId;
  label: string;
  url: string | null;
  /** The model is uniformly scaled so its extent along `axis` equals `meters`. */
  fit: { axis: "x" | "y" | "z"; meters: number };
  /** Applied before fitting (radians), to bring the model into the scene's axis conventions. */
  rotation?: [number, number, number];
  /** Applied after fitting; by default the model is centred in X/Z and sits on y = 0. */
  offset?: [number, number, number];
  /** Animation roles → node names inside the GLB (crane only). */
  nodes?: Partial<Record<"trolley" | "spreader" | "hoistOrigin", string>>;
  /** Ship GLB already contains container stacks (otherwise procedural stacks are added). */
  includesContainers?: boolean;
  /** Height of the main deck above the model's base after fitting (metres), for procedural stacks. */
  deckHeight?: number;
  /** Draft below the waterline after fitting (metres): the model is lowered by this much. */
  draft?: number;
  source: AssetSource | null;
}

export const modelAssets: Record<AssetId, ModelAsset> = {
  cargoShipHero: {
    id: "cargoShipHero", label: "Main container ship", url: null, // "/models/ships/cargo-ship-hero.glb"
    fit: { axis: "x", meters: 200 }, draft: 7.8, deckHeight: 21, includesContainers: false, source: null,
  },
  cargoShipDistant: {
    id: "cargoShipDistant", label: "Distant container ships", url: null, // "/models/ships/cargo-ship-distant.glb"
    fit: { axis: "x", meters: 200 }, draft: 7.8, includesContainers: true, source: null,
  },
  gantryCrane: {
    id: "gantryCrane", label: "Ship-to-shore gantry crane", url: null, // "/models/cranes/sts-crane.glb"
    fit: { axis: "y", meters: 71 }, nodes: { trolley: "Trolley", spreader: "Spreader", hoistOrigin: "HoistOrigin" }, source: null,
  },
  container40: {
    id: "container40", label: "40 ft shipping container", url: null, // "/models/containers/container-40ft.glb"
    fit: { axis: "x", meters: 12.192 }, source: null,
  },
  terminalTruck: {
    id: "terminalTruck", label: "Terminal truck", url: null, // "/models/vehicles/terminal-truck.glb"
    fit: { axis: "x", meters: 19 }, source: null,
  },
  forklift: {
    id: "forklift", label: "Forklift", url: null, // "/models/vehicles/forklift.glb"
    fit: { axis: "x", meters: 4.2 }, source: null,
  },
};

/** Optional distant horizon artwork (your harbor reference image). */
export const backplate: {
  url: string | null;
  /** Vertical slice of the image to use (0 = bottom, 1 = top): the horizon band only. */
  crop: [number, number];
  /** Horizontal coverage around the sun (degrees). */
  arc: number;
  source: AssetSource | null;
} = {
  url: null, // "/models/environment/backplate-horizon.jpg"
  crop: [0.28, 0.62],
  arc: 110,
  source: null,
};

export function backplateUrl(): string | null {
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined" && window.location.search.includes("testAssets"))
    return "/models/__test__/backplate.jpg";
  return backplate.url;
}

/**
 * Resolves the URL for an asset. In development, `?testAssets` swaps in the generated
 * placeholder GLBs under /models/__test__ so the loader pipeline can be exercised.
 */
export function assetUrl(id: AssetId): string | null {
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined" && window.location.search.includes("testAssets"))
    return `/models/__test__/${id}.glb`;
  return modelAssets[id].url;
}

/** Credits for every configured external asset (for the credits panel / ATTRIBUTIONS.md). */
export function assetCredits(): AssetSource[] {
  const list = Object.values(modelAssets).filter((a) => a.url && a.source).map((a) => a.source!);
  if (backplate.url && backplate.source) list.push(backplate.source);
  return list;
}
