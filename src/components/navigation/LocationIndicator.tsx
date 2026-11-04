"use client";

import { destinationById } from "@/config/navigation";
import { useNavigationStore } from "@/store/navigationStore";

/** Small nautical readout of where the camera is. */
export function LocationIndicator() {
  const current = useNavigationStore((s) => s.current);
  const entered = useNavigationStore((s) => s.entered);
  const transitioning = useNavigationStore((s) => s.transitioning);
  if (!entered) return null;
  const d = destinationById(current);
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-30 hidden text-right sm:block" aria-live="polite">
      <p className="font-mono text-[10px] tracking-[0.3em] text-amber-300/80 uppercase">{transitioning ? "Underway" : "Moored"}</p>
      <p className="mt-1 text-sm text-cream/85">{d.label}</p>
    </div>
  );
}
