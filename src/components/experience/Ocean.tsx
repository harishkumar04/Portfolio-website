"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, ShaderMaterial, Uint32BufferAttribute, Vector4 } from "three";
import { skyChunk } from "@/lib/shaders";
import { SUN_DIR } from "@/lib/scene";
import { sceneClock } from "@/lib/clock";
import { WAKE_SLOTS, wakeSources } from "@/lib/wake";
import { useNavigationStore, type QualityTier } from "@/store/navigationStore";

const GRID: Record<QualityTier, { rings: number; segs: number; waves: number }> = {
  high: { rings: 340, segs: 300, waves: 6 },
  medium: { rings: 220, segs: 220, waves: 5 },
  low: { rings: 130, segs: 140, waves: 4 },
};

/** Polar grid, dense around the harbor and sparse towards the horizon. */
function polarGrid(rings: number, segs: number, radius: number, power: number) {
  const pos = new Float32Array((rings + 1) * (segs + 1) * 3);
  let o = 0;
  for (let r = 0; r <= rings; r++) {
    const rr = radius * Math.pow(r / rings, power);
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      pos[o++] = Math.cos(a) * rr;
      pos[o++] = 0;
      pos[o++] = Math.sin(a) * rr;
    }
  }
  const idx = new Uint32Array(rings * segs * 6);
  let k = 0;
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = r * (segs + 1) + s, b = a + segs + 1;
      idx[k++] = a; idx[k++] = a + 1; idx[k++] = b;
      idx[k++] = a + 1; idx[k++] = b + 1; idx[k++] = b;
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setIndex(new Uint32BufferAttribute(idx, 1));
  return g;
}

const waveChunk = /* glsl */ `
const vec2 WD[6] = vec2[6](vec2(0.150,0.989), vec2(-0.349,0.937), vec2(0.707,0.707), vec2(-0.800,0.600), vec2(0.954,0.301), vec2(-0.200,0.980));
const float WL[6] = float[6](78.0, 46.0, 27.0, 17.0, 10.5, 6.2);
const float WA[6] = float[6](0.95, 0.58, 0.30, 0.17, 0.085, 0.045);
`;

const vertexShader = /* glsl */ `
uniform float uTime;
varying vec3 vWorld;
${waveChunk}
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float dist = length(wp.xz - cameraPosition.xz);
  float fade = 1.0 - smoothstep(1400.0, 3600.0, dist);
  float h = 0.0; vec2 off = vec2(0.0);
  for (int i = 0; i < 4; i++) {
    float k = 6.2831853 / WL[i];
    float ph = dot(WD[i], wp.xz) * k - sqrt(9.81 * k) * uTime;
    h += WA[i] * sin(ph) * fade;
    off += WD[i] * WA[i] * 0.6 * cos(ph) * fade;
  }
  wp.xz += off; wp.y += h;
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const fragmentShader = (oct: number, nw: number) => /* glsl */ `
precision highp float;
varying vec3 vWorld;
uniform float uTime;
uniform vec4 uShipA[${WAKE_SLOTS}];
uniform vec4 uShipB[${WAKE_SLOTS}];
#define NWF ${nw}
${skyChunk(oct)}
${waveChunk}

vec2 nGrad(vec2 x){
  const vec2 e = vec2(0.07, 0.0);
  return vec2(vnoise(x + e.xy) - vnoise(x - e.xy), vnoise(x + e.yx) - vnoise(x - e.yx)) / (2.0 * e.x);
}

float shipFoam(vec2 p){
  float f = 0.0;
  for (int i = 0; i < ${WAKE_SLOTS}; i++) {
    vec4 A = uShipA[i]; vec4 B = uShipB[i];
    if (B.w < 0.5) continue;
    vec2 dir = A.zw; vec2 perp = vec2(-dir.y, dir.x);
    vec2 rel = p - A.xy;
    float along = dot(rel, dir), across = dot(rel, perp);
    float L = B.x, hw = B.y, sp = B.z;
    float n1 = vnoise(vec2(along * 0.35, across * 0.5) + uTime * 0.6);
    float ring = smoothstep(hw * 0.94, hw * 1.0, abs(across)) * (1.0 - smoothstep(hw * 1.0, hw * 1.14, abs(across)))
               * (1.0 - smoothstep(L * 0.5 - 4.0, L * 0.5 + 12.0, abs(along)));
    f = max(f, ring * smoothstep(0.35, 0.75, n1) * 0.65);
    if (sp > 0.2) {
      float s = -along - L * 0.40;
      if (s > 0.0) {
        float cw = hw * 0.8 + s * 0.06;
        float core = (1.0 - smoothstep(cw * 0.55, cw, abs(across))) * exp(-s / (140.0 + sp * 40.0));
        float armPos = 0.27 * s + hw * 0.55;
        float arm = exp(-pow((abs(across) - armPos) / (2.0 + s * 0.035), 2.0)) * exp(-s / 300.0) * 0.85;
        float nz = vnoise(vec2(s * 0.07 - uTime * 0.2, across * 0.22));
        float nz2 = vnoise(vec2(s * 0.31, across * 0.9));
        float nz3 = vnoise(vec2(s * 1.1 - uTime * 0.5, across * 2.6));
        f = max(f, (core + arm) * smoothstep(0.30, 0.78, nz * 0.45 + nz2 * 0.35 + nz3 * 0.35));
      }
      float bs = along - L * 0.5;
      if (bs > -10.0 && bs < 30.0) {
        float bow = exp(-pow(abs(across) / (hw * 1.4 + 3.0), 2.0)) * smoothstep(-10.0, 0.0, bs) * (1.0 - smoothstep(0.0, 30.0, bs));
        f = max(f, bow * 0.45 * (0.5 + n1));
      }
    }
  }
  return clamp(f, 0.0, 1.0);
}

void main() {
  vec3 toCam = cameraPosition - vWorld;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  vec2 p = vWorld.xz;

  vec2 g = vec2(0.0); float hh = 0.0;
  for (int i = 0; i < NWF; i++) {
    float k = 6.2831853 / WL[i];
    float ph = dot(WD[i], p) * k - sqrt(9.81 * k) * uTime;
    g += WD[i] * WA[i] * k * cos(ph);
    hh += WA[i] * sin(ph);
  }
  float dAtt = 1.0 - smoothstep(500.0, 2600.0, dist);
  vec2 ripple = (nGrad(p * 0.8 + vec2(uTime * 0.30, uTime * 0.17)) + 0.6 * nGrad(p * 2.1 - vec2(uTime * 0.22, -uTime * 0.31))) * 0.065;
  vec2 slope = (g * 1.0 + ripple * (1.0 - smoothstep(120.0, 900.0, dist))) * dAtt;

  float foamShip = shipFoam(p);
  slope *= (1.0 - foamShip * 0.5);
  vec3 N = normalize(vec3(-slope.x, 1.0, -slope.y));

  vec3 R = reflect(-V, N);
  R.y = abs(R.y);
  vec3 sky = skyFull(R, uTime);

  float cosT = max(dot(N, V), 0.0);
  float F = min(0.02 + 0.98 * pow(1.0 - cosT, 5.0), 0.5);

  float hN = clamp(hh / 1.6 * 0.5 + 0.5, 0.0, 1.0);
  vec2 sh = normalize(uSunDir.xz);
  float toSun = 0.5 + 0.5 * dot(normalize(-V.xz + 1e-5), sh);
  vec3 deep = vec3(0.003, 0.012, 0.045);
  vec3 shallow = vec3(0.008, 0.050, 0.100);
  vec3 body = mix(deep, shallow, hN * hN * 0.85) * (0.45 + 0.55 * toSun);
  body += vec3(0.05, 0.016, 0.010) * toSun * toSun * 0.8;

  sky *= mix(vec3(0.42, 0.40, 0.78), vec3(0.85), toSun);
  vec3 col = mix(body, sky, F);
  float sd = max(dot(R, uSunDir), 0.0);
  col += vec3(1.0, 0.62, 0.26) * pow(sd, 700.0) * 90.0;
  col += vec3(1.0, 0.42, 0.12) * pow(sd, 70.0) * 0.9;

  float crest = smoothstep(0.80, 1.0, hN + (vnoise(p * 2.3 + uTime * 0.4) - 0.5) * 0.35 + (vnoise(p * 5.7 - uTime * 0.6) - 0.5) * 0.25) * (1.0 - smoothstep(250.0, 1100.0, dist));
  float foam = max(foamShip, crest * 0.5);
  float fl = 0.35 + 0.65 * toSun;
  vec3 foamCol = mix(vec3(0.55, 0.38, 0.46), vec3(1.0, 0.80, 0.62), fl);
  col = mix(col, foamCol, foam * 0.65);

  vec3 hz = skyGradient(normalize(vec3(-V.x, 0.0, -V.z)));
  float haze = 1.0 - exp(-dist * 0.00042);
  col = mix(col, hz, clamp(haze * 0.55 + smoothstep(2200.0, 4200.0, dist) * 0.5, 0.0, 1.0));

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Animated sea: Gerstner swell, fresnel sky reflection, sun glitter path and ship wakes. */
export function Ocean() {
  const quality = useNavigationStore((s) => s.quality);
  const cfg = GRID[quality];
  const geometry = useMemo(() => polarGrid(cfg.rings, cfg.segs, 6200, 2.1), [cfg]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSunDir: { value: SUN_DIR.clone() },
          uSunDisc: { value: 1 },
          uShipA: { value: Array.from({ length: WAKE_SLOTS }, () => new Vector4()) },
          uShipB: { value: Array.from({ length: WAKE_SLOTS }, () => new Vector4()) },
        },
        vertexShader,
        fragmentShader: fragmentShader(quality === "low" ? 3 : 4, cfg.waves),
      }),
    [quality, cfg],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const u = material.uniforms;
    u.uTime.value = sceneClock.t;
    for (let i = 0; i < WAKE_SLOTS; i++) {
      const w = wakeSources[i];
      (u.uShipA.value as Vector4[])[i].set(w.x, w.z, w.dx, w.dz);
      (u.uShipB.value as Vector4[])[i].set(w.length, w.halfWidth, w.speed, w.active ? 1 : 0);
    }
  });

  return <mesh geometry={geometry} material={material} position={[-80, 0, -40]} frustumCulled={false} />;
}
