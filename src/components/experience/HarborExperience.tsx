"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { detectQuality, hasWebGL } from "@/lib/webgl";
import { useNavigationStore } from "@/store/navigationStore";
import { sceneClock } from "@/lib/clock";
import { journey } from "@/lib/journey";
import { artPlate } from "@/config/art";
import { FallbackScene } from "@/components/ui/FallbackScene";

// The WebGL bundle is only fetched on the client, after the painting is already on screen.
const HarborCanvas = dynamic(() => import("./HarborCanvas"), { ssr: false });

/**
 * The fixed harbor layer behind the page. The static painting paints first (instant, and the
 * no-WebGL scene); the WebGL canvas fades over it once its layers are ready.
 */
export function HarborExperience() {
  const webgl = useNavigationStore((s) => s.webgl);
  const setWebgl = useNavigationStore((s) => s.setWebgl);
  const setQuality = useNavigationStore((s) => s.setQuality);
  const setReducedMotion = useNavigationStore((s) => s.setReducedMotion);
  const setSceneReady = useNavigationStore((s) => s.setSceneReady);

  useEffect(() => {
    // dev-only handle for screenshots / debugging
    if (process.env.NODE_ENV !== "production") (window as unknown as Record<string, unknown>).__harbor = { nav: useNavigationStore, clock: sceneClock, journey };
    setWebgl(hasWebGL());
    setQuality(detectQuality());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const on = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [setWebgl, setQuality, setReducedMotion]);

  // without WebGL the painting itself is the scene: ready once it has decoded
  useEffect(() => {
    if (webgl !== false) return;
    const img = new Image();
    img.onload = img.onerror = () => setSceneReady(true);
    img.src = artPlate;
  }, [webgl, setSceneReady]);

  return (
    <div className="fixed inset-0 z-0 overflow-clip bg-midnight" style={{ touchAction: "pan-y" }} data-webgl={webgl === null ? "pending" : String(webgl)}>
      {webgl === false ? (
        <FallbackScene />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artPlate} alt="A container harbor at sunset: a control tower, gantry cranes loading a cargo ship, ships sailing towards the sun" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          {webgl ? <HarborCanvas /> : null}
        </>
      )}
    </div>
  );
}
