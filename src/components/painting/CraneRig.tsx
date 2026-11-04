"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshBasicMaterial, Plane, PlaneGeometry, Quaternion, Vector3, type Texture } from "three";
import { sceneClock } from "@/lib/clock";
import { cardMaterial } from "./materials";
import type { PlateProjection } from "./projection";
import type { CraneDef, Px, SpriteDef } from "./types";

interface Props {
  crane: CraneDef;
  depth: number;
  projection: PlateProjection;
  sprites: { trolley: SpriteDef; spreader: SpriteDef; container: SpriteDef };
  textures: Record<string, Texture>;
}

/** Container states: attached to the spreader, parked aboard after release, waiting at the pickup. */
const ATTACHED = 1, ABOARD = 0, WAITING = 2;

/**
 * The container-loading sequence on the painted crane. All motion is in image pixels on the crane's
 * card; a paused GSAP timeline is sought from the shared scene clock every frame (deterministic,
 * no React re-renders), and a damped pendulum lets the load lag the trolley's acceleration.
 */
export function CraneRig({ crane, depth, projection, sprites, textures }: Props) {
  const s = projection.metersPerPixel(depth);
  const trolley = useRef<Mesh>(null);
  const spreader = useRef<Mesh>(null);
  const container = useRef<Mesh>(null);
  const cables = useRef<Mesh>(null);

  const boomY = (x: number) => {
    const [[x0, y0], [x1, y1]] = crane.boom;
    return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  };
  const local = (p: Px): [number, number] => projection.cardLocal(p, depth);

  const geo = useMemo(() => {
    const size = (r: SpriteDef["rect"]) => new PlaneGeometry((r[2] - r[0]) * s, (r[3] - r[1]) * s);
    const n = crane.cableTops.length;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(n * 4 * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < n; i++) idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
    g.setIndex(idx);
    return { trolley: size(sprites.trolley.rect), spreader: size(sprites.spreader.rect), container: size(sprites.container.rect), cables: g };
  }, [crane, sprites, s]);

  // one clipping plane shared by the load: active only over the drop slot (stack-top row)
  const clip = useMemo(() => new Plane(new Vector3(0, 1, 0), 1e6), []);
  const mats = useMemo(() => {
    const m = {
      trolley: cardMaterial(textures[sprites.trolley.id]),
      spreader: cardMaterial(textures[sprites.spreader.id]),
      container: cardMaterial(textures[sprites.container.id]),
      cable: new MeshBasicMaterial({ color: "#23232c", transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false, side: DoubleSide }),
    };
    m.spreader.clippingPlanes = m.container.clippingPlanes = m.cable.clippingPlanes = [clip];
    return m;
  }, [textures, sprites, clip]);
  useEffect(() => () => { Object.values(geo).forEach((g) => g.dispose()); Object.values(mats).forEach((m) => m.dispose()); }, [geo, mats]);

  // the loading cycle, in pixels on the painted crane
  const { tl, state } = useMemo(() => {
    const T = crane.cycle;
    const st = { tx: crane.pickup.trolleyX, ry: crane.pickup.rigTopY, carry: ATTACHED, fade: 1 };
    const t = gsap.timeline({ paused: true });
    const seg = (from: number, to: number, vars: gsap.TweenVars, fromVars: gsap.TweenVars) =>
      t.fromTo(st, { ...fromVars, immediateRender: false }, { ...vars, duration: (to - from) * T, immediateRender: false }, from * T);
    const { pickup: P, drop: D, hoistRigTopY: up } = crane;
    seg(0.08, 0.24, { ry: up, ease: "power2.inOut" }, { ry: P.rigTopY });                 // hoist
    seg(0.24, 0.46, { tx: D.trolleyX, ease: "sine.inOut" }, { tx: P.trolleyX });         // travel out over the ship
    seg(0.46, 0.60, { ry: D.rigTopY, ease: "power2.inOut" }, { ry: up });                 // lower into the hold
    t.set(st, { carry: ABOARD, immediateRender: false }, 0.63 * T);                        // release
    seg(0.65, 0.76, { ry: up, ease: "power2.inOut" }, { ry: D.rigTopY });                 // hoist empty
    t.set(st, { carry: WAITING, fade: crane.pickupHidden ? 1 : 0, immediateRender: false }, 0.76 * T);
    if (!crane.pickupHidden) seg(0.78, 0.9, { fade: 1, ease: "sine.inOut" }, { fade: 0 });
    seg(0.76, 0.92, { tx: P.trolleyX, ease: "sine.inOut" }, { tx: D.trolleyX });         // return
    seg(0.92, 1.0, { ry: P.rigTopY, ease: "power2.inOut" }, { ry: up });                  // lower to the next box
    t.set(st, { carry: ATTACHED, immediateRender: false }, T - 0.001);
    return { tl: t, state: st };
  }, [crane]);
  useEffect(() => () => { tl.kill(); }, [tl]);

  const sim = useRef({ theta: 0, omega: 0, lastX: crane.pickup.trolleyX, lastV: 0, aboard: [0, 0] as [number, number] });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    tl.seek(sceneClock.t % crane.cycle, false);
    const st = state;
    const [tax, tay] = crane.trolleyAt;
    const tyAnchor = boomY(st.tx);

    // pendulum: load lags the trolley's acceleration
    const p = sim.current;
    const vx = ((st.tx - p.lastX) * s) / Math.max(dt, 1e-3);
    const ax = (vx - p.lastV) / Math.max(dt, 1e-3);
    p.lastX = st.tx; p.lastV = vx;
    const L = Math.max(2, (st.ry - tyAnchor) * s);
    const acc = -(9.81 / L) * Math.sin(p.theta) - 1.1 * p.omega - (Math.abs(ax) < 30 ? ax : 0) / L;
    p.omega += acc * dt; p.theta += p.omega * dt;
    p.theta = Math.max(-0.08, Math.min(0.08, p.theta));
    const swingPx = (Math.sin(p.theta) * L) / s;

    // trolley rides the boom
    if (trolley.current) {
      const [cx, cy] = rectCenter(sprites.trolley.rect);
      const [x, y] = local([st.tx + (cx - tax), tyAnchor + (cy - tay)]);
      trolley.current.position.set(x, y, 0);
    }
    // spreader hangs below, swinging
    const rigX = st.tx + (crane.rigAt[0] - tax) + swingPx;
    if (spreader.current) {
      const [cx, cy] = rectCenter(sprites.spreader.rect);
      const [x, y] = local([rigX + (cx - crane.rigAt[0]), st.ry + (cy - crane.rigAt[1])]);
      spreader.current.position.set(x, y, 0);
      spreader.current.rotation.z = -p.theta * 0.6;
    }
    // container: attached / aboard / waiting at the pickup
    if (container.current) {
      const [cx, cy] = rectCenter(sprites.container.rect);
      const off: Px = [cx - crane.rigAt[0], cy - crane.rigAt[1]];
      let px: Px;
      if (st.carry === ATTACHED) { px = [rigX + off[0], st.ry + off[1]]; p.aboard = px; }
      else if (st.carry === ABOARD) px = p.aboard;
      else px = [crane.pickup.trolleyX + (crane.rigAt[0] - tax) + off[0], crane.pickup.rigTopY + off[1]];
      const [x, y] = local(px);
      container.current.position.set(x, y, 0);
      container.current.rotation.z = st.carry === ATTACHED ? -p.theta * 0.6 : 0;
      (container.current.material as MeshBasicMaterial).opacity = st.carry === WAITING ? st.fade : 1;
    }
    // cables: thin quads from the trolley sheaves to the spreader head
    const attr = geo.cables.getAttribute("position") as BufferAttribute;
    const w = 0.75 * s;
    crane.cableTops.forEach((top, i) => {
      const bottom = crane.cableBottoms[i];
      const [x0, y0] = local([st.tx + (top[0] - tax), tyAnchor + (top[1] - tay)]);
      const [x1, y1] = local([rigX + (bottom[0] - crane.rigAt[0]), st.ry + (bottom[1] - crane.rigAt[1])]);
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * w, ny = (dx / len) * w;
      attr.setXYZ(i * 4, x0 - nx, y0 - ny, 0); attr.setXYZ(i * 4 + 1, x0 + nx, y0 + ny, 0);
      attr.setXYZ(i * 4 + 2, x1 - nx, y1 - ny, 0); attr.setXYZ(i * 4 + 3, x1 + nx, y1 + ny, 0);
    });
    attr.needsUpdate = true;
    geo.cables.computeBoundingSphere();

    // sink into the ship: clip the load at the stack-top row while it is over the drop slot
    const frame = container.current?.parent;
    if (frame && crane.clip) {
      const loadX = st.carry === ABOARD ? p.aboard[0] : rigX;
      if (loadX > crane.clip.x0 && loadX < crane.clip.x1) {
        const up = new Vector3(0, 1, 0).applyQuaternion(frame.getWorldQuaternion(new Quaternion()));
        const [, cy] = local([loadX, crane.clip.y]);
        clip.setFromNormalAndCoplanarPoint(up, frame.localToWorld(new Vector3(0, cy, 0)));
      } else clip.set(new Vector3(0, 1, 0), 1e6);
    }
  });

  const order = (sp: SpriteDef, d: number) => sp.order ?? d;
  return (
    <>
      <mesh ref={cables} geometry={geo.cables} material={mats.cable} renderOrder={order(sprites.spreader, 4)} frustumCulled={false} />
      <mesh ref={container} geometry={geo.container} material={mats.container} renderOrder={order(sprites.container, 4)} />
      <mesh ref={spreader} geometry={geo.spreader} material={mats.spreader} renderOrder={order(sprites.spreader, 4) + 0.1} />
      <mesh ref={trolley} geometry={geo.trolley} material={mats.trolley} renderOrder={order(sprites.trolley, 6)} />
    </>
  );
}

function rectCenter(r: [number, number, number, number]): Px {
  return [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
}
