/**
 * GLSL shared by the sky dome and the ocean reflection so the sea mirrors
 * exactly the sky above it. Output is linear HDR (tone-mapped by the renderer).
 */
export const skyChunk = (octaves: number) => /* glsl */ `
uniform vec3 uSunDir;
uniform float uSunDisc;
#define CLOUD_OCT ${octaves}

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0)), c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < CLOUD_OCT; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
  return s;
}

vec3 skyGradient(vec3 d){
  float e = clamp(d.y, 0.0, 1.0);
  float sd = max(dot(d, uSunDir), 0.0);
  vec3 zenith = vec3(0.012, 0.016, 0.085);
  vec3 upper  = vec3(0.060, 0.050, 0.250);
  vec3 mid    = vec3(0.330, 0.120, 0.340);
  vec3 low    = vec3(0.900, 0.250, 0.140);
  vec3 hor    = vec3(1.000, 0.480, 0.130);
  vec3 c = mix(hor, low, smoothstep(0.0, 0.06, e));
  c = mix(c, mid, smoothstep(0.03, 0.13, e));
  c = mix(c, upper, smoothstep(0.10, 0.30, e));
  c = mix(c, zenith, smoothstep(0.28, 0.80, e));
  vec2 hd = normalize(d.xz + 1e-5), sh = normalize(uSunDir.xz);
  float away = 1.0 - smoothstep(-0.7, 0.9, dot(hd, sh));
  c = mix(c, c * vec3(0.50, 0.45, 0.95), away * 0.7);
  c += vec3(1.0, 0.28, 0.05) * pow(sd, 8.0) * 0.42;
  c += vec3(1.0, 0.50, 0.14) * pow(sd, 45.0) * 1.1;
  return c;
}

vec4 cloudLayer(vec3 d, float t){
  if (d.y <= 0.003) return vec4(0.0);
  vec2 p = d.xz / (d.y + 0.22) * 1.25 + vec2(t * 0.0040, t * 0.0013);
  vec2 q = p * vec2(1.0, 2.3);
  float n = fbm(q);
  vec2 sdir = normalize(uSunDir.xz) * 0.11;
  float n2 = fbm(q + sdir * vec2(1.0, 2.3));
  float cov = smoothstep(0.44, 0.74, n);
  float cirrus = smoothstep(0.52, 0.9, fbm(p * vec2(0.4, 6.0) + 3.0)) * 0.3;
  float fade = smoothstep(0.0, 0.05, d.y) * (1.0 - smoothstep(0.62, 1.0, d.y));
  float sdot = max(dot(d, uSunDir), 0.0);
  float sunSide = 0.25 + 0.75 * smoothstep(-0.2, 0.9, dot(normalize(d.xz + 1e-5), normalize(uSunDir.xz)));
  float a = max(cov * sunSide + cov * 0.35, cirrus) * fade;
  float rim = clamp((n - n2) * 6.0 + 0.5, 0.0, 1.0);
  vec3 shadowC = vec3(0.14, 0.07, 0.24);
  vec3 midC = vec3(0.62, 0.20, 0.34);
  vec3 litC = vec3(0.95, 0.30, 0.10);
  vec3 c = mix(shadowC, midC, clamp(rim * 1.2 + (1.0 - cov) * 0.5, 0.0, 1.0));
  c = mix(c, litC, clamp(rim * pow(sdot, 0.6) * 1.5 + (1.0 - cov) * pow(sdot, 2.0), 0.0, 1.0));
  c += vec3(0.9, 0.30, 0.10) * (1.0 - cov) * cov * 2.2 * pow(sdot, 1.5);
  return vec4(c, a * 0.95);
}

vec3 skyFull(vec3 d, float t){
  vec3 c = skyGradient(d);
  vec4 cl = cloudLayer(d, t);
  c = mix(c, cl.rgb, cl.a);
  // sun disc composited after the clouds and faded by them, so thin gaps never punch HDR hot-spots
  float sd = dot(d, uSunDir);
  float disc = smoothstep(cos(0.050), cos(0.046), sd) * uSunDisc;
  c += vec3(1.0, 0.78, 0.30) * disc * 4.0 * (1.0 - smoothstep(0.15, 0.6, cl.a));
  return min(c, vec3(4.5));
}
`;
