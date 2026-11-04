"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { NoToneMapping, SRGBColorSpace } from "three";
import { PaintedHarbor } from "@/components/painting/PaintedHarbor";
import { SceneClock } from "./SceneClock";
import { artScene } from "@/config/art";
import { useNavigationStore } from "@/store/navigationStore";

const DPR: Record<string, [number, number]> = { high: [1, 2], medium: [1, 1.5], low: [1, 1] };

/**
 * WebGL layer of the harbor. The canvas is transparent until the painted layers have loaded,
 * so the static painting underneath (HarborExperience) shows first and hands over seamlessly.
 */
export default function HarborCanvas() {
  const quality = useNavigationStore((s) => s.quality);
  return (
    <Canvas
      className="!absolute inset-0" style={{ touchAction: "pan-y", overflow: "clip" }}
      dpr={DPR[quality]}
      camera={{ fov: 40, near: 0.5, far: 20000, position: [0, 10, 0] }}
      gl={{ antialias: quality !== "low", alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = NoToneMapping; // the painting is already graded
        gl.outputColorSpace = SRGBColorSpace;
        gl.setClearColor(0x000000, 0);
        gl.localClippingEnabled = true; // the crane load sinks into the ship via a clipping plane
      }}
    >
      <SceneClock />
      <Suspense fallback={null}>
        <PaintedHarbor url={artScene} />
      </Suspense>
    </Canvas>
  );
}
