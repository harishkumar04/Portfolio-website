"use client";

import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { CameraController } from "@/components/navigation/CameraController";
import { HarborEnvironment } from "./HarborEnvironment";
import { useNavigationStore } from "@/store/navigationStore";

const DPR: Record<string, [number, number]> = { high: [1, 2], medium: [1, 1.5], low: [1, 1] };

export default function HarborCanvas() {
  const quality = useNavigationStore((s) => s.quality);
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={DPR[quality]}
      camera={{ fov: 45, near: 1, far: 9000, position: [30, 9.5, 17] }}
      shadows={quality === "high"}
      gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.85;
        gl.outputColorSpace = SRGBColorSpace;
      }}
    >
      <CameraController />
      <HarborEnvironment />
    </Canvas>
  );
}
