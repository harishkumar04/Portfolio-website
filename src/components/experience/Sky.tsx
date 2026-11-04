"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Mesh, ShaderMaterial } from "three";
import { skyChunk } from "@/lib/shaders";
import { SUN_DIR } from "@/lib/scene";
import { sceneClock } from "@/lib/clock";
import { useNavigationStore } from "@/store/navigationStore";

const vertexShader = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragment = (oct: number) => /* glsl */ `
precision highp float;
varying vec3 vDir;
uniform float uTime;
${skyChunk(oct)}
void main() {
  vec3 d = normalize(vDir);
  gl_FragColor = vec4(skyFull(d, uTime), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function makeSkyMaterial(octaves: number, sunDisc: number) {
  return new ShaderMaterial({
    uniforms: { uSunDir: { value: SUN_DIR.clone() }, uTime: { value: 0 }, uSunDisc: { value: sunDisc } },
    vertexShader,
    fragmentShader: fragment(octaves),
    side: BackSide,
    depthWrite: false,
    fog: false,
  });
}

/** Golden-hour sky dome: gradient, huge low sun, drifting clouds. Follows the camera. */
export function Sky() {
  const quality = useNavigationStore((s) => s.quality);
  const ref = useRef<Mesh>(null);
  const material = useMemo(() => makeSkyMaterial(quality === "low" ? 3 : 5, 1), [quality]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ camera }) => {
    ref.current?.position.copy(camera.position);
    material.uniforms.uTime.value = sceneClock.t;
  });

  return (
    <mesh ref={ref} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[3000, 48, 24]} />
    </mesh>
  );
}
