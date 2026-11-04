"use client";

import { useEffect, useMemo } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import { AdditiveBlending, MeshBasicMaterial, Shape, ShapeGeometry } from "three";
import { hotspots, type Hotspot } from "@/config/hotspots";
import { chooseProject, chooseSkill, scrollToSection, stopSceneEvents } from "@/lib/journey";
import { sceneClock } from "@/lib/clock";
import { useNavigationStore } from "@/store/navigationStore";
import type { DestinationId } from "@/types";
import type { PlateProjection } from "./projection";

interface Props {
  p: PlateProjection;
  depthOf: (layer: string) => number;
  orderOf: (layer: string) => number;
}

/** Clickable regions of the painting: nav parts of the harbor, skill containers, project containers. */
export function Hotspots({ p, depthOf, orderOf }: Props) {
  const active = useNavigationStore((s) => s.active);
  const entered = useNavigationStore((s) => s.entered);
  return (
    <>
      {hotspots.map((h) => {
        const enabled = entered && (
          h.kind === "nav" ? !(h.target === active) :
          h.kind === "skill" ? active === "skills" : active === "projects");
        // the section's own nav region is replaced by its container hotspots
        const hidden = h.kind === "nav" && ((h.target === "skills" && active === "skills") || (h.target === "projects" && active === "projects"));
        if (!enabled || hidden) return null;
        return <Region key={h.key} h={h} p={p} depth={depthOf(h.layer)} order={orderOf(h.layer) + 0.05} active={active} />;
      })}
    </>
  );
}

function Region({ h, p, depth, order, active }: { h: Hotspot; p: PlateProjection; depth: number; order: number; active: DestinationId }) {
  const setHovered = useNavigationStore((s) => s.setHovered);
  const selected = useNavigationStore((s) => (h.kind === "skill" ? s.selectedSkill === h.target : h.kind === "project" ? s.selectedProject === h.target : false));

  const geos = useMemo(() => h.polygons.map((poly) => {
    const shape = new Shape();
    poly.forEach((pt, i) => { const [x, y] = p.cardLocal(pt, depth); if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y); });
    return new ShapeGeometry(shape);
  }), [h, p, depth]);
  const outlines = useMemo(() => h.polygons.map((poly) => [...poly, poly[0]].map((pt) => { const [x, y] = p.cardLocal(pt, depth); return [x, y, 0.01] as [number, number, number]; })), [h, p, depth]);
  const mat = useMemo(() => new MeshBasicMaterial({ color: "#e9c68d", transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  useEffect(() => () => { geos.forEach((g) => g.dispose()); mat.dispose(); }, [geos, mat]);

  const origin = useMemo(() => p.cardOrigin(depth), [p, depth]);
  const marker = useMemo(() => { const [x, y] = p.cardLocal(h.marker, depth); return [x, y, 0] as [number, number, number]; }, [p, h, depth]);

  // hover/selection light eases in and out; nothing here re-renders per frame
  useFrame((_, dt) => {
    const s = useNavigationStore.getState();
    const hov = s.hovered === h.key;
    const reduced = s.reducedMotion;
    const pulse = reduced ? 0 : 0.035 * Math.sin(sceneClock.t * 2.2);
    const target = selected ? 0.15 + pulse : hov ? 0.09 : 0;
    mat.opacity += (target - mat.opacity) * Math.min(1, dt * 9);
  });

  const over = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(h.key); document.body.style.cursor = "pointer"; };
  const out = () => { if (useNavigationStore.getState().hovered === h.key) setHovered(null); document.body.style.cursor = ""; };
  const act = () => {
    document.body.style.cursor = "";
    if (h.kind === "nav") scrollToSection(h.target as DestinationId);
    else if (h.kind === "skill") chooseSkill(h.target);
    else chooseProject(useNavigationStore.getState().selectedProject === h.target ? null : h.target);
  };
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); act(); };

  const showTag = h.kind === "nav" ? active === "home" : true;

  return (
    <group position={origin} quaternion={p.quaternion}>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} renderOrder={order} onPointerOver={over} onPointerOut={out} onClick={click} />
      ))}
      {selected && outlines.map((pts, i) => <Line key={i} points={pts} color="#e9c68d" lineWidth={2} transparent opacity={0.95} depthTest={false} renderOrder={order + 0.1} />)}
      {showTag && (
        <Html position={marker} center zIndexRange={[20, 10]}>
          <button
            type="button"
            className={`dot-marker ${h.kind} ${selected ? "is-selected" : ""}`}
            {...stopSceneEvents}
            onClick={(e) => { e.stopPropagation(); act(); }}
            onMouseEnter={() => setHovered(h.key)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(h.key)}
            onBlur={() => setHovered(null)}
            aria-label={h.label}
            aria-pressed={h.kind === "nav" ? undefined : selected}
          >
            <span className="dot" aria-hidden />
          </button>
        </Html>
      )}
    </group>
  );
}
