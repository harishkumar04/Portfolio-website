"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Euler, PerspectiveCamera, Quaternion } from "three";
import { journey, smoothPose } from "@/lib/journey";
import { useNavigationStore } from "@/store/navigationStore";
import type { PlateProjection } from "@/components/painting/projection";
import type { Px } from "@/components/painting/types";

const OVERSCAN = 1.08; // hidden margin so parallax and drift never show a layer edge

/**
 * Applies the journey's camera layers (scroll, focus, intro, pointer; see lib/journey.ts) to the
 * home camera of the painting. Cover-fits the painting to any aspect ratio and clamps yaw/pitch so
 * the view can never leave it. On narrow screens it pans towards the scene's focus point.
 */
export function CameraController({ projection: p, focus }: { projection: PlateProjection; focus?: Px }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const reduced = useNavigationStore((s) => s.reducedMotion);
  const q = useRef({ extra: new Quaternion(), e: new Euler(0, 0, 0, "YXZ"), first: true, px: 0, py: 0 });

  useFrame(({ clock }, delta) => {
    const c = q.current;
    smoothPose(delta, c.first);
    c.first = false;
    const base = journey.poseSmooth, f = journey.focus, i = journey.introK;

    const plateAspect = p.W / p.H;
    const viewAspect = size.width / Math.max(1, size.height);
    const tanHome = Math.tan((p.camera.fov * Math.PI) / 360);
    const tanCover = viewAspect > plateAspect ? (tanHome * plateAspect) / viewAspect : tanHome;
    // zoom only ever increases from the cover fit
    const zoom = Math.max(1, base.zoom * f.zoom * (1 - 0.06 * journey.pull)) * (1 + 0.12 * i);
    const tanFov = tanCover / OVERSCAN / zoom;
    const fov = (2 * Math.atan(tanFov) * 180) / Math.PI;
    if (Math.abs(camera.fov - fov) > 1e-4 || camera.aspect !== viewAspect) {
      camera.fov = fov; camera.aspect = viewAspect; camera.near = 0.5; camera.far = 20000;
      camera.updateProjectionMatrix();
    }

    const halfPlateH = Math.atan(tanHome * plateAspect), halfViewH = Math.atan(tanFov * viewAspect);
    const halfPlateV = Math.atan(tanHome), halfViewV = Math.atan(tanFov);
    const limYaw = Math.max(0, halfPlateH - halfViewH) * 0.92, limPitch = Math.max(0, halfPlateV - halfViewV) * 0.92;
    const clamp = (v: number, l: number) => Math.max(-l, Math.min(l, v));
    // narrow screens: look towards the focus point, in proportion to how little of the width fits
    let yawFocus = 0;
    if (focus && viewAspect < plateAspect && base.zoom < 1.2) yawFocus = -Math.atan(((focus[0] / p.W) * 2 - 1) * tanHome * plateAspect) * (1 - viewAspect / plateAspect);

    // pointer: damped here (not in React); strength follows the section and is off for touch / reduced motion
    const live = journey.parallaxOn && !reduced ? base.parallax : 0;
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 2);
    c.px += (journey.pointer.x * live - c.px) * k;
    c.py += (journey.pointer.y * live - c.py) * k;
    const t = reduced ? 0 : clock.elapsedTime;

    const home = p.camera.position;
    camera.position.set(
      home.x + base.x + f.x + c.px * 0.35 + Math.sin(t * 0.11) * 0.25,
      home.y + base.y + f.y + c.py * 0.22 + Math.sin(t * 0.083 + 1.3) * 0.15,
      home.z + base.z + f.z,
    );
    c.e.set(
      clamp(((base.pitch + f.pitch) * Math.PI) / 180 + c.py * 0.003 - i * 0.012, limPitch),
      clamp(((base.yaw + f.yaw) * Math.PI) / 180 + yawFocus - c.px * 0.005 + Math.sin(t * 0.07) * 0.0015, limYaw),
      0,
    );
    c.extra.setFromEuler(c.e);
    camera.quaternion.copy(p.quaternion).multiply(c.extra);
  });

  return null;
}
