"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { Euler, PerspectiveCamera, Quaternion } from "three";
import { destinationById } from "@/config/navigation";
import { useNavigationStore } from "@/store/navigationStore";
import type { PlateProjection } from "@/components/painting/projection";
import type { Px } from "@/components/painting/types";

const OVERSCAN = 1.08; // hidden margin so parallax never shows a layer edge

/**
 * Cinematic camera for the painted harbor. Starts from the painting's home camera and layers on:
 * a GSAP intro push-in, GSAP transitions between destinations (small dolly / pan / zoom offsets),
 * smoothed pointer parallax and a slow idle drift. Cover-fits the painting to any aspect ratio;
 * on narrow screens it pans towards the scene's focus (crane + ship) instead of squashing it.
 */
export function CameraController({ projection: p, focus }: { projection: PlateProjection; focus?: Px }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const current = useNavigationStore((s) => s.current);
  const reduced = useNavigationStore((s) => s.reducedMotion);
  const entered = useNavigationStore((s) => s.entered);
  const setTransitioning = useNavigationStore((s) => s.setTransitioning);

  const dest = useRef({ x: 0, y: 0, z: 0, yaw: 0, pitch: 0, zoom: 1 });
  const intro = useRef({ k: reduced ? 0 : 1 }); // 1 → 0: eases the zoom out to the home framing
  const pointer = useRef({ x: 0, y: 0 });
  const q = useRef({ base: new Quaternion(), extra: new Quaternion(), e: new Euler(0, 0, 0, "YXZ") });

  // intro: ease in from slightly behind and above the home view
  useEffect(() => {
    if (reduced) { intro.current.k = 0; return; }
    if (!entered) { intro.current.k = 1; return; }
    const tw = gsap.to(intro.current, { k: 0, duration: 6.5, ease: "power2.inOut", delay: 0.3 });
    return () => { tw.kill(); };
  }, [reduced, entered]);

  // destination transitions
  useEffect(() => {
    const d = destinationById(current).camera;
    setTransitioning(true);
    const tw = gsap.to(dest.current, {
      x: d.offset[0], y: d.offset[1], z: d.offset[2], yaw: d.yaw, pitch: d.pitch, zoom: d.zoom,
      duration: reduced ? 0.01 : 2.8, ease: "power3.inOut", onComplete: () => setTransitioning(false),
    });
    return () => { tw.kill(); };
  }, [current, reduced, setTransitioning]);

  useFrame(({ pointer: ptr, clock }, delta) => {
    const plateAspect = p.W / p.H;
    const viewAspect = size.width / Math.max(1, size.height);
    const tanHome = Math.tan((p.camera.fov * Math.PI) / 360);
    const tanCover = viewAspect > plateAspect ? (tanHome * plateAspect) / viewAspect : tanHome;
    const d = dest.current;
    const i = intro.current.k;
    // zoom only ever increases from the cover fit, so no layer edge can be revealed
    const zoom = Math.max(1, d.zoom) * (1 + 0.12 * i);
    const tanFov = tanCover / OVERSCAN / zoom;
    const fov = (2 * Math.atan(tanFov) * 180) / Math.PI;
    if (Math.abs(camera.fov - fov) > 1e-4 || camera.aspect !== viewAspect) {
      camera.fov = fov; camera.aspect = viewAspect; camera.near = 0.5; camera.far = 20000;
      camera.updateProjectionMatrix();
    }

    // keep the view inside the painting: limits for yaw/pitch at the current zoom
    const halfPlateH = Math.atan(tanHome * plateAspect), halfViewH = Math.atan(tanFov * viewAspect);
    const halfPlateV = Math.atan(tanHome), halfViewV = Math.atan(tanFov);
    const limYaw = Math.max(0, halfPlateH - halfViewH) * 0.92, limPitch = Math.max(0, halfPlateV - halfViewV) * 0.92;
    const clamp = (v: number, l: number) => Math.max(-l, Math.min(l, v));
    // narrow screens: pan towards the focus
    let yawFocus = 0;
    if (focus && viewAspect < plateAspect) yawFocus = -Math.atan(((focus[0] / p.W) * 2 - 1) * tanHome * plateAspect);

    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 1.8);
    const live = reduced ? 0 : 1;
    pointer.current.x += (ptr.x * live - pointer.current.x) * k;
    pointer.current.y += (ptr.y * live - pointer.current.y) * k;
    const t = clock.elapsedTime * live;

    const home = p.camera.position;
    camera.position.set(
      home.x + d.x + pointer.current.x * 0.35 + Math.sin(t * 0.11) * 0.25,
      home.y + d.y + pointer.current.y * 0.22 + Math.sin(t * 0.083 + 1.3) * 0.15,
      home.z + d.z,
    );
    const e = q.current.e;
    e.set(
      clamp((d.pitch * Math.PI) / 180 + pointer.current.y * 0.003 - i * 0.012, limPitch),
      clamp((d.yaw * Math.PI) / 180 + yawFocus - pointer.current.x * 0.005 + Math.sin(t * 0.07) * 0.0015, limYaw),
      0,
    );
    q.current.extra.setFromEuler(e);
    camera.quaternion.copy(p.quaternion).multiply(q.current.extra);
  });

  return null;
}
