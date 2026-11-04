"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, InstancedMesh, MeshStandardMaterial, Object3D, type MeshStandardMaterialParameters } from "three";

export interface BoxItem {
  p: [number, number, number];
  s: [number, number, number];
  ry?: number;
}

interface Props extends MeshStandardMaterialParameters {
  items: BoxItem[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Generic instanced unit boxes for repeated structural detail (rails, hatch covers, fenders…). */
export function InstancedBoxes({ items, castShadow = false, receiveShadow = true, ...mat }: Props) {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const key = JSON.stringify(mat);
  const material = useMemo(() => new MeshStandardMaterial(JSON.parse(key) as MeshStandardMaterialParameters), [key]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    items.forEach((it, i) => {
      o.position.set(...it.p); o.scale.set(...it.s); o.rotation.set(0, it.ry ?? 0, 0);
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  useLayoutEffect(() => () => { geo.dispose(); material.dispose(); }, [geo, material]);
  if (!items.length) return null;
  return <instancedMesh ref={ref} args={[geo, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />;
}
