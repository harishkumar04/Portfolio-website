"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { Vector3 } from "three";
import { destinationById } from "@/config/navigation";
import { useNavigationStore } from "@/store/navigationStore";

/**
 * Drives the camera between predefined poses with GSAP.
 * Position and look-at target are tweened together so orientation stays consistent,
 * and a subtle idle drift keeps the shot alive without fighting the transition.
 */
export function CameraController() {
  const camera = useThree((s) => s.camera);
  const current = useNavigationStore((s) => s.current);
  const reduced = useNavigationStore((s) => s.reducedMotion);
  const setTransitioning = useNavigationStore((s) => s.setTransitioning);

  const state = useRef({ pos: new Vector3(), target: new Vector3(), drift: 1 });
  const initialised = useRef(false);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const d = destinationById(current);
    const [px, py, pz] = d.camera.position;
    const [tx, ty, tz] = d.camera.target;
    const s = state.current;

    if (!initialised.current) {
      s.pos.set(px, py, pz);
      s.target.set(tx, ty, tz);
      initialised.current = true;
      return;
    }

    tl.current?.kill();
    setTransitioning(true);
    const duration = reduced ? 0.01 : 2.4;
    tl.current = gsap
      .timeline({ onComplete: () => setTransitioning(false) })
      .to(s.pos, { x: px, y: py, z: pz, duration, ease: "power3.inOut" }, 0)
      .to(s.target, { x: tx, y: ty, z: tz, duration, ease: "power3.inOut" }, 0);

    return () => {
      tl.current?.kill();
    };
  }, [current, reduced, setTransitioning]);

  useFrame(({ clock, pointer }) => {
    const s = state.current;
    const t = clock.elapsedTime;
    const drift = reduced ? 0 : 1;
    camera.position.set(
      s.pos.x + (Math.sin(t * 0.15) * 0.35 + pointer.x * 0.5) * drift,
      s.pos.y + (Math.cos(t * 0.12) * 0.2 + pointer.y * 0.25) * drift,
      s.pos.z,
    );
    camera.lookAt(s.target);
  });

  return null;
}
