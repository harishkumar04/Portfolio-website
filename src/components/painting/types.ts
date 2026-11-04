/** scene.json written by scripts/art/build_layers.py. All coordinates are source-image pixels. */
export type Px = [number, number];
export type Rect = [number, number, number, number]; // x0, y0, x1, y1

export interface LayerDef {
  id: string;
  type: "sky" | "ground" | "card";
  file: string;
  rect: Rect;
  /** ground planes */
  groundY?: number;
  kind?: "water";
  /** cards: depth from the image row where the element meets the ground, or explicit */
  contactY?: number;
  ground?: number;
  depth?: number;
  order?: number;
  bob?: { amplitude: number; roll: number; period: number };
  drift?: { maxShift: number; period: number };
}

export interface SpriteDef {
  id: string;
  role: "trolley" | "spreader" | "container" | "distantShip";
  file: string;
  rect: Rect;
  card?: string;
  order?: number;
  contactY?: number;
  ground?: number;
  speed?: number;
  travel?: number;
}

export interface CraneDef {
  card: string;
  boom: [Px, Px];
  trolleyAt: Px;
  rigAt: Px;
  containerAt: Px;
  cableTops: Px[];
  cableBottoms: Px[];
  pickup: { trolleyX: number; rigTopY: number };
  drop: { trolleyX: number; rigTopY: number };
  hoistRigTopY: number;
  cycle: number;
  /** pickup spot is occluded in the painting, so a fresh container can appear without a fade */
  pickupHidden?: boolean;
}

export interface SceneManifest {
  name: string;
  image: { width: number; height: number; clean: string; plate: string };
  camera: { fov: number; height: number; horizonY: number };
  focus?: Px;
  sun?: { at: Px; radius: number };
  layers: LayerDef[];
  sprites: SpriteDef[];
  crane?: CraneDef;
  glows?: { at: Px; card: string; size: number; color: string; pulse?: number }[];
}
