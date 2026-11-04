"use client";

import { useEffect, useRef } from "react";
import { artPlate } from "@/config/art";
import { hotspots } from "@/config/hotspots";
import { chooseProject, chooseSkill, journey, scrollToSection, smoothPose } from "@/lib/journey";
import { useNavigationStore } from "@/store/navigationStore";
import type { DestinationId } from "@/types";

const W = 1672, H = 941, TAN_HOME = Math.tan((50 * Math.PI) / 360);

/**
 * No-WebGL version of the harbor: the same painting, panned and zoomed by the same scroll-driven
 * camera (journey.poseSmooth), with the same hotspot tags riding on it. Plain DOM, no canvas.
 */
export function FallbackScene() {
  const img = useRef<HTMLImageElement>(null);
  const tags = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    let raf = 0, last = performance.now(), first = true;
    const frame = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      smoothPose(dt, first); first = false;
      const vw = window.innerWidth, vh = window.innerHeight;
      const k = Math.max(vw / W, vh / H);
      const b = journey.poseSmooth, f = journey.focus;
      const s = Math.max(1, b.zoom * f.zoom) * 1.04 * (1 + 0.1 * journey.introK);
      const yaw = ((b.yaw + f.yaw) * Math.PI) / 180, pitch = ((b.pitch + f.pitch) * Math.PI) / 180;
      const aspect = W / H;
      let dx = (Math.tan(yaw) / (TAN_HOME * aspect)) * (W / 2) * k * s;
      let dy = (Math.tan(pitch) / TAN_HOME) * (H / 2) * k * s;
      const mx = ((s - 1) / 2) * vw, my = ((s - 1) / 2) * vh;
      dx = Math.max(-mx, Math.min(mx, dx)); dy = Math.max(-my, Math.min(my, dy));
      if (img.current) img.current.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(4)})`;

      const st = useNavigationStore.getState();
      const covW = W * k, covH = H * k, ox = (vw - covW) / 2, oy = (vh - covH) / 2;
      for (const h of hotspots) {
        const el = tags.current[h.key];
        if (!el) continue;
        const on = st.entered && (h.kind === "nav" ? st.active === "home" : h.kind === "skill" ? st.active === "skills" : st.active === "projects");
        const sx = vw / 2 + (ox + h.marker[0] * k - vw / 2) * s + dx;
        const sy = vh / 2 + (oy + h.marker[1] * k - vh / 2) * s + dy;
        const visible = on && sx > 12 && sx < vw - 12 && sy > 70 && sy < vh - 12;
        el.style.display = visible ? "" : "none";
        if (visible) el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const act = (h: (typeof hotspots)[number]) => {
    if (h.kind === "nav") scrollToSection(h.target as DestinationId);
    else if (h.kind === "skill") chooseSkill(h.target);
    else chooseProject(h.target);
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={artPlate} alt="A container harbor at sunset: a control tower, gantry cranes loading a cargo ship, ships sailing towards the sun" className="fallback-plate absolute inset-0 h-full w-full object-cover" style={{ transition: "none" }} draggable={false} />
      <div className="pointer-events-none fixed inset-0 z-20">
        {hotspots.map((h) => (
          <button key={h.key} ref={(el) => { tags.current[h.key] = el; }} type="button" onClick={() => act(h)} className={`tag-beacon ${h.kind} pointer-events-auto absolute top-0 left-0`} style={{ display: "none" }} aria-label={`${h.tag}: ${h.label}`}>
            <span className="tag-dot" aria-hidden />
            <span className="tag-text">{h.tag}</span>
          </button>
        ))}
      </div>
    </>
  );
}
