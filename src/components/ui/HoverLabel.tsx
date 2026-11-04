"use client";

import { useEffect, useRef } from "react";
import { hotspotByKey } from "@/config/hotspots";
import { useNavigationStore } from "@/store/navigationStore";

/** Contextual label that follows a fine pointer while it is over a clickable part of the harbor. */
export function HoverLabel() {
  const hovered = useNavigationStore((s) => s.hovered);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !ref.current) return;
      ref.current.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 20}px)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  const h = hotspotByKey(hovered);
  const verb = h?.kind === "nav" ? "Go to" : h?.kind === "skill" ? "Open" : "Open";
  return (
    <div ref={ref} className="pointer-events-none fixed top-0 left-0 z-[55] hidden [@media(hover:hover)]:block" aria-hidden>
      <div className={`surface px-3.5 py-2.5 transition-opacity duration-200 ${h ? "opacity-100" : "opacity-0"}`}>
        <p className="eyebrow">{h?.tag}</p>
        <p className="mt-0.5 text-sm text-warm-ivory">{h && `${verb} ${h.label}`}{h?.hint && h.kind !== "nav" ? <span className="text-muted-grey"> · {h.hint}</span> : null}</p>
      </div>
    </div>
  );
}
