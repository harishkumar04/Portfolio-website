"use client";

import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { BackSide, CylinderGeometry, ShaderMaterial, SRGBColorSpace } from "three";
import { backplate, backplateUrl } from "@/config/assets";
import { SUN_DIR } from "@/lib/scene";

const R = 2700;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const fragmentShader = /* glsl */ `
uniform sampler2D map;
uniform vec2 crop;
varying vec2 vUv;
void main() {
  vec2 uv = vec2(1.0 - vUv.x, mix(crop.x, crop.y, vUv.y));
  vec4 c = texture2D(map, uv);
  float a = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x) * (1.0 - smoothstep(0.45, 1.0, vUv.y));
  gl_FragColor = vec4(c.rgb, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function Band({ url }: { url: string }) {
  const tex = useTexture(url);
  const { geo, mat } = useMemo(() => {
    tex.colorSpace = SRGBColorSpace;
    const arc = (backplate.arc * Math.PI) / 180;
    const sunTheta = Math.atan2(SUN_DIR.x, SUN_DIR.z);
    const h = R * Math.tan((13 * Math.PI) / 180);
    const g = new CylinderGeometry(R, R, h, 96, 1, true, sunTheta - arc / 2, arc).translate(0, h / 2 - 25, 0);
    const m = new ShaderMaterial({
      uniforms: { map: { value: tex }, crop: { value: backplate.crop } },
      vertexShader, fragmentShader, side: BackSide, transparent: true, depthWrite: false, fog: false,
    });
    return { geo: g, mat: m };
  }, [tex]);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  return <mesh geometry={geo} material={mat} renderOrder={-6} frustumCulled={false} />;
}

/**
 * Optional distant artwork band: the horizon slice of a reference image, wrapped around the
 * sun at 2.7 km and feathered into the procedural sky. Everything nearer stays real 3D, and the
 * ocean is drawn over its lower edge so the sea itself is always the live shader.
 */
export default function Backplate() {
  const url = backplateUrl();
  if (!url) return null;
  return <Band url={url} />;
}
