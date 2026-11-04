"use client";

import { useEffect, useMemo, useRef } from "react";
import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { DirectionalLight, FogExp2 } from "three";
import { FOG_COLOR, SUN_COLOR, SUN_DIR } from "@/lib/scene";
import { makeSkyMaterial } from "./Sky";
import { useNavigationStore } from "@/store/navigationStore";

/**
 * Golden-hour rig: warm low sun with soft long shadows, violet sky fill,
 * a sky-derived environment map for metal reflections and warm atmospheric fog.
 */
export function Lighting() {
  const quality = useNavigationStore((s) => s.quality);
  const scene = useThree((s) => s.scene);
  const envSky = useMemo(() => makeSkyMaterial(3, 0.12), []);
  const sun = useRef<DirectionalLight>(null);

  useEffect(() => {
    scene.fog = new FogExp2(FOG_COLOR, 0.00068);
    return () => {
      scene.fog = null;
    };
  }, [scene]);
  useEffect(() => () => envSky.dispose(), [envSky]);
  useEffect(() => {
    const l = sun.current;
    if (!l) return;
    l.target.position.set(-170, 0, 70);
    scene.add(l.target);
    return () => {
      scene.remove(l.target);
    };
  }, [scene]);

  const shadows = quality !== "low";
  const map = quality === "high" ? 4096 : 2048;
  const sunPos = SUN_DIR.clone().multiplyScalar(500);
  const centre = [-170, 0, 70] as const;

  return (
    <>
      <hemisphereLight args={["#7a62c8", "#4a2f36", 0.8]} />
      <directionalLight
        ref={sun}
        color={SUN_COLOR}
        intensity={4.6}
        position={[centre[0] + sunPos.x, sunPos.y + 10, centre[2] + sunPos.z]}
        castShadow={shadows}
        shadow-mapSize={[map, map]}
        shadow-camera-left={-330}
        shadow-camera-right={330}
        shadow-camera-top={100}
        shadow-camera-bottom={-40}
        shadow-camera-near={10}
        shadow-camera-far={1100}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
      />
      {/* cool back fill from behind the camera, gives deep blue/violet shadows */}
      <directionalLight color="#6a66e0" intensity={0.6} position={[220, 120, 160]} />
      <Environment frames={1} resolution={256} environmentIntensity={0.85}>
        <mesh material={envSky}>
          <sphereGeometry args={[100, 32, 16]} />
        </mesh>
      </Environment>
    </>
  );
}
