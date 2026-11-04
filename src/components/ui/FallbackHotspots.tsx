"use client";

import { useEffect, useState } from "react";
import { hotspots } from "@/config/hotspots";
import { destinationById } from "@/config/navigation";
import { useNavigationStore } from "@/store/navigationStore";

const W = 1672, H = 941;

/** Beacons over the static painting when WebGL is unavailable (object-fit: cover maths). */
export function FallbackHotspots() {
  const go = useNavigationStore((s) => s.go);
  const entered = useNavigationStore((s) => s.entered);
  const current = useNavigationStore((s) => s.current);
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const r = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    r();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);
  if (!vp || !entered || current !== "home") return null;
  const k = Math.max(vp.w / W, vp.h / H);
  const ox = (vp.w - W * k) / 2, oy = (vp.h - H * k) / 2;
  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {hotspots.map((h) => {
        const x = ox + h.marker[0] * k, y = oy + h.marker[1] * k;
        if (x < 8 || y < 60 || x > vp.w - 8 || y > vp.h - 8) return null;
        const d = destinationById(h.id);
        return (
          <button key={h.id} type="button" onClick={() => go(h.id)} className="beacon pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }} aria-label={`${d.title}: ${d.label}`}>
            <span className="beacon-dot" aria-hidden />
            <span className="beacon-label">{d.title}</span>
          </button>
        );
      })}
    </div>
  );
}
