import {
  AdditiveBlending, CanvasTexture, DoubleSide, Matrix4, MeshBasicMaterial, ShaderMaterial, SRGBColorSpace,
  Vector2, Vector3, Vector4, type Texture,
} from "three";
import type { Rect } from "./types";

const noise = /* glsl */ `
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
`;

/** Normalised (v-up) texture rect of a layer cut from the plate. */
export function uvRect(rect: Rect, W: number, H: number) {
  const [x0, y0, x1, y1] = rect;
  return new Vector4(x0 / W, 1 - y1 / H, (x1 - x0) / W, (y1 - y0) / H);
}

const projectedVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const projectedHeader = /* glsl */ `
uniform sampler2D map;
uniform vec4 uRect;
uniform mat4 uHomeVP;
uniform vec2 uTexel;
varying vec3 vWorld;
vec2 plateUv(vec3 p){ vec4 c = uHomeVP * vec4(p, 1.0); return c.xy / c.w * 0.5 + 0.5; }
vec2 layerUv(vec2 full){ return clamp((full - uRect.xy) / uRect.zw, uTexel, 1.0 - uTexel); }
`;

interface ProjectedOpts {
  map: Texture;
  rect: Vector4;
  homeVP: Matrix4;
  homePos: Vector3;
  texSize: Vector2;
  water?: boolean;
  sunUv?: Vector2;
}

/**
 * Ground plane textured by projecting the painting from the home camera: at the home view it is
 * pixel-identical to the painting, and it holds perspective correctly when the camera moves.
 * The water variant displaces the lookup with world-space swell (so ripples shrink with distance)
 * and adds restrained, moving sun glints on the bright part of the painted reflection.
 */
export function projectedGroundMaterial(o: ProjectedOpts) {
  const fragment = /* glsl */ `
${projectedHeader}
uniform float uTime;
uniform vec3 uHomePos;
uniform vec2 uSunUv;
${noise}
void main() {
  vec3 p = vWorld;
  vec2 uv0 = layerUv(plateUv(p));
  float a = texture2D(map, uv0).a;
  if (a < 0.02) discard;
#ifdef WATER
  float dist = length(p.xz - uHomePos.xz);
  float near = smoothstep(2600.0, 40.0, dist);
  float t = uTime;
  vec2 sw = vec2(fbm(p.xz * 0.045 + vec2(t * 0.035, t * 0.02)), fbm(p.xz * 0.045 + vec2(-t * 0.025, t * 0.04) + 9.0)) - 0.5;
  vec2 rp = vec2(vnoise(p.xz * 0.32 + vec2(t * 0.22, -t * 0.12)), vnoise(p.xz * vec2(0.27, 0.41) - vec2(t * 0.15, t * 0.26) + 4.0)) - 0.5;
  vec3 q = p + vec3(sw.x * 1.6 + rp.x * 0.45, 0.0, sw.y * 1.6 + rp.y * 0.45) * near;
  vec4 c = texture2D(map, layerUv(plateUv(q)));
  float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec2 full = plateUv(p);
  float column = exp(-pow((full.x - uSunUv.x) * 5.5, 2.0));
  float glint = pow(vnoise(p.xz * vec2(0.9, 2.4) + vec2(t * 0.7, -t * 0.45)), 10.0) * 6.0;
  c.rgb += vec3(1.0, 0.76, 0.46) * glint * smoothstep(0.42, 0.85, lum) * column * 0.22 * near;
  float swell = fbm(p.xz * 0.018 + vec2(0.0, t * 0.025)) - 0.5;
  c.rgb *= 1.0 + swell * 0.09 * near;
  c.rgb = min(c.rgb, vec3(1.0));
#else
  vec4 c = texture2D(map, uv0);
#endif
  gl_FragColor = vec4(c.rgb, 1.0);
  #include <colorspace_fragment>
}`;
  const m = new ShaderMaterial({
    uniforms: {
      map: { value: o.map }, uRect: { value: o.rect }, uHomeVP: { value: o.homeVP }, uTime: { value: 0 },
      uHomePos: { value: o.homePos }, uSunUv: { value: o.sunUv ?? new Vector2(0.5, 0.5) },
      uTexel: { value: new Vector2(0.5 / o.texSize.x, 0.5 / o.texSize.y) },
    },
    vertexShader: projectedVertex,
    fragmentShader: fragment,
    defines: o.water ? { WATER: "" } : {},
    side: DoubleSide,
  });
  return m;
}

/**
 * A painted card whose pixels drift slowly sideways (e.g. the cloud bank). Two offset lookups are
 * cross-faded on a cycle so the motion never accumulates; the cut-out edge stays fixed.
 */
export function driftMaterial(map: Texture, shiftUv: number, period: number) {
  return new ShaderMaterial({
    uniforms: { map: { value: map }, uTime: { value: 0 }, uShift: { value: shiftUv }, uPeriod: { value: period } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
uniform sampler2D map; uniform float uTime, uShift, uPeriod; varying vec2 vUv;
void main() {
  float ph = fract(uTime / uPeriod);
  vec4 a = texture2D(map, vUv - vec2(ph * uShift, 0.0));
  vec4 b = texture2D(map, vUv - vec2(fract(ph + 0.5) * uShift, 0.0));
  vec3 rgb = mix(b.rgb, a.rgb, abs(2.0 * ph - 1.0));
  gl_FragColor = vec4(rgb, texture2D(map, vUv).a);
  #include <colorspace_fragment>
}`,
    transparent: true,
    depthWrite: false,
  });
}

export function cardMaterial(map: Texture, opacity = 1) {
  return new MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, opacity });
}

let glow: CanvasTexture | null = null;
/** Soft radial falloff for sun bloom, lamp halos and haze. */
export function glowTexture() {
  if (glow) return glow;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.25, "rgba(255,255,255,0.45)");
  gr.addColorStop(0.6, "rgba(255,255,255,0.08)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  glow = new CanvasTexture(c);
  glow.colorSpace = SRGBColorSpace;
  return glow;
}

export function glowMaterial(color: string, opacity: number) {
  return new MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
}
