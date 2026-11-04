"use client";

import { useEffect, useRef } from "react";
import { destinationById } from "@/config/navigation";
import { useNavigationStore } from "@/store/navigationStore";

/** Label that follows the pointer while it is over a clickable part of the harbor. */
export function HoverLabel() {
  const hovered = useNavigationStore((s) => s.hovered);
  const current = useNavigationStore((s) => s.current);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  const show = hovered && hovered !== current;
  const d = hovered ? destinationById(hovered) : null;
  return (
    <div ref={ref} className="pointer-events-none fixed top-0 left-0 z-40 hidden md:block" aria-hidden>
      <div className={`rounded-xl border border-amber-300/25 bg-navy-900/80 px-3.5 py-2 backdrop-blur-sm transition-opacity duration-200 ${show ? "opacity-100" : "opacity-0"}`}>
        <p className="font-mono text-[10px] tracking-[0.25em] text-amber-300 uppercase">{d?.label}</p>
        <p className="text-sm text-cream">{d?.title} <span className="text-cream/55">· {d?.hint}</span></p>
      </div>
    </div>
  );
}
