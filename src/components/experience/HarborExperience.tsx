"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { detectQuality, hasWebGL } from "@/lib/webgl";
import { useNavigationStore } from "@/store/navigationStore";
import { sceneClock } from "@/lib/clock";
import { artPlate } from "@/config/art";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { FallbackHotspots } from "@/components/ui/FallbackHotspots";

// The WebGL bundle is only fetched on the client, after the painting is already on screen.
const HarborCanvas = dynamic(() => import("./HarborCanvas"), { ssr: false });

export function HarborExperience() {
  // null on the server / first paint, real answer once hydrated
  const webgl = useSyncExternalStore(() => () => {}, hasWebGL, () => null);
  const setQuality = useNavigationStore((s) => s.setQuality);
  const setReducedMotion = useNavigationStore((s) => s.setReducedMotion);
  const setSceneReady = useNavigationStore((s) => s.setSceneReady);
  const reduced = useNavigationStore((s) => s.reducedMotion);

  useEffect(() => {
    // dev-only handle for screenshots / debugging
    if (process.env.NODE_ENV !== "production") (window as unknown as Record<string, unknown>).__harbor = { nav: useNavigationStore, clock: sceneClock };
    setQuality(detectQuality());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const on = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [setQuality, setReducedMotion]);

  // without WebGL the painting itself is the scene: ready once it has decoded
  useEffect(() => {
    if (webgl !== false) return;
    const img = new Image();
    img.onload = img.onerror = () => setSceneReady(true);
    img.src = artPlate;
  }, [webgl, setSceneReady]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0b1226]" data-webgl={webgl === null ? "pending" : String(webgl)}>
      {/* The painting itself: instant first paint, loading backdrop, and the no-WebGL fallback. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artPlate}
        alt="A container harbor at sunset: a control tower, gantry cranes loading a cargo ship, ships sailing towards the sun"
        className={`absolute inset-0 h-full w-full object-cover ${webgl === false && !reduced ? "harbor-kenburns" : ""}`}
        draggable={false}
      />
      {webgl ? <HarborCanvas /> : null}
      {webgl === false && <FallbackHotspots />}
      <LoadingScreen />
    </div>
  );
}
