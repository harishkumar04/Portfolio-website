"use client";

import { lazy, Suspense, useEffect } from "react";
import { Lighting } from "./Lighting";
import { Sky } from "./Sky";
import { Ocean } from "./Ocean";
import { SceneClock } from "./SceneClock";
import { Quay, LightMasts, YardTraffic, ApronVehicles } from "./Terminal";
import { ControlTower, HarborOffice } from "./ControlTower";
import { disposeTextures } from "@/lib/textures";
import { disposeContainerCache } from "./Container";
import { ContainerSourceProvider } from "./assets/ContainerSource";
import Backplate from "./Backplate";

// Heavy scenery streams in after the sky and sea are already on screen.
const ContainerYard = lazy(() => import("./ContainerYard"));
const Fleet = lazy(() => import("./Fleet"));
const Headland = lazy(() => import("./Headland"));
const ManifestStack = lazy(() => import("./ManifestStack"));

export function HarborEnvironment() {
  useEffect(() => () => { disposeTextures(); disposeContainerCache(); }, []);
  return (
    <ContainerSourceProvider>
      <SceneClock />
      <Lighting />
      <Sky />
      <Ocean />
      <Suspense fallback={null}>
        <Headland />
      </Suspense>
      <Quay />
      <LightMasts />
      <ControlTower />
      <HarborOffice />
      <YardTraffic />
      <ApronVehicles />
      <Suspense fallback={null}>
        <ContainerYard />
        <ManifestStack />
        <Fleet />
      </Suspense>
      <Suspense fallback={null}>
        <Backplate />
      </Suspense>
    </ContainerSourceProvider>
  );
}
