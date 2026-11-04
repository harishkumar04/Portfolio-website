"use client";

import { Color } from "three";
import { ContainerStack, CONTAINER_H, LEN_40 } from "./Container";
import { skillCategories } from "@/config/skills";
import { HARBOR } from "@/lib/harbor";

/**
 * "Cargo manifest" wall: one container per skill category, stacked 2 columns x 3 high at the
 * edge of the apron. Each category is its own group so it can become an independent click
 * target in the interaction phase.
 */
export default function ManifestStack() {
  return (
    <group position={[-2, HARBOR.quayY, 27]} rotation={[0, 0.04, 0]}>
      {skillCategories.map((c, i) => {
        const col = Math.floor(i / 3), level = i % 3;
        return (
          <group key={c.id} name={`manifest-${c.id}`} position={[col * (LEN_40 + 0.6) - (LEN_40 + 0.6) / 2, CONTAINER_H / 2 + level * CONTAINER_H, 0]}>
            <ContainerStack items={[{ position: [0, 0, 0], color: new Color(c.color).getHex() }]} detail="full" castShadow />
          </group>
        );
      })}
    </group>
  );
}
