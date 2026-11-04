"use client";

import { useEffect, useMemo } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { AdditiveBlending, MeshBasicMaterial, Shape, ShapeGeometry } from "three";
import { hotspots, type Hotspot } from "@/config/hotspots";
import { destinationById } from "@/config/navigation";
import { useNavigationStore } from "@/store/navigationStore";
import type { PlateProjection } from "./projection";

interface Props {
  p: PlateProjection;
  /** depth of each painted layer by id (ground layers get a far depth behind everything) */
  depthOf: (layer: string) => number;
  /** render order of each painted layer, so the highlight sits just above its own layer */
  orderOf: (layer: string) => number;
}

/** Clickable regions of the painting with a soft hover highlight, plus on-scene beacons. */
export function Hotspots({ p, depthOf, orderOf }: Props) {
  return (
    <>
      {hotspots.map((h) => <Region key={h.id} h={h} p={p} depth={depthOf(h.layer)} order={orderOf(h.layer) + 0.05} />)}
    </>
  );
}

function Region({ h, p, depth, order }: { h: Hotspot; p: PlateProjection; depth: number; order: number }) {
  const go = useNavigationStore((s) => s.go);
  const setHovered = useNavigationStore((s) => s.setHovered);
  const entered = useNavigationStore((s) => s.entered);
  const current = useNavigationStore((s) => s.current);

  const geo = useMemo(() => {
    const shape = new Shape();
    h.polygon.forEach((pt, i) => {
      const [x, y] = p.cardLocal(pt, depth);
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    });
    return new ShapeGeometry(shape);
  }, [h, p, depth]);
  const mat = useMemo(() => new MeshBasicMaterial({ color: "#ffb35c", transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);

  const origin = useMemo(() => p.cardOrigin(depth), [p, depth]);
  const marker = useMemo(() => {
    const [x, y] = p.cardLocal(h.marker, depth);
    return [x, y, 0] as [number, number, number];
  }, [p, h, depth]);

  // highlight eases towards its target; no React re-renders per frame
  useFrame((_, dt) => {
    const s = useNavigationStore.getState();
    const target = s.entered && s.hovered === h.id && s.current !== h.id ? 0.085 : 0;
    mat.opacity += (target - mat.opacity) * Math.min(1, dt * 8);
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!useNavigationStore.getState().entered) return;
    e.stopPropagation();
    setHovered(h.id);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    if (useNavigationStore.getState().hovered === h.id) setHovered(null);
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!useNavigationStore.getState().entered) return;
    e.stopPropagation();
    document.body.style.cursor = "";
    go(h.id);
  };
  const d = destinationById(h.id);

  return (
    <group position={origin} quaternion={p.quaternion}>
      <mesh geometry={geo} material={mat} renderOrder={order} onPointerOver={over} onPointerOut={out} onClick={click} />
      {entered && current === "home" && (
        <Html position={marker} center zIndexRange={[20, 10]}>
          <button
            type="button"
            className="beacon group"
            onClick={() => go(h.id)}
            onMouseEnter={() => setHovered(h.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(h.id)}
            onBlur={() => setHovered(null)}
            aria-label={`${d.title}: ${d.label}`}
          >
            <span className="beacon-dot" aria-hidden />
            <span className="beacon-label">{d.title}</span>
          </button>
        </Html>
      )}
    </group>
  );
}
