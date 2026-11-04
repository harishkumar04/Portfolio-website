"use client";

import { useRef } from "react";
import type { Group } from "three";
import { CargoShip, glbStackLift } from "./CargoShip";
import { GantryCrane } from "./Crane";
import { AssetSlot } from "./assets/AssetSlot";
import { DEPARTING_SHIP, DISTANT_SHIPS, HARBOR, MAIN_SHIP, SEAWARD, headingFor } from "@/lib/harbor";
import { getShipLayout, SHIP_LIFT } from "@/lib/shipLayout";
import { QUAY_Y } from "@/lib/scene";
import { CONTAINER_H } from "./Container";
import type { NormalizedModel } from "@/lib/models";
import { useNavigationStore } from "@/store/navigationStore";

const SLOT_BAY = 3;

/**
 * The docked hero ship and the three cranes working it. They are rendered together so the
 * loading well the crane drops into follows whichever ship model is shown (GLB or procedural).
 */
function Berth({ model }: { model?: NormalizedModel }) {
  const slotRef = useRef<Group | null>(null);
  const layout = getShipLayout(MAIN_SHIP, SLOT_BAY);
  const slot = layout.slot!;
  const lift = model ? glbStackLift(MAIN_SHIP, "cargoShipHero") : 0;
  const slotWorldX = HARBOR.mainShip.x + slot.x;
  const wellFloor = slot.y - CONTAINER_H / 2 + SHIP_LIFT + lift - QUAY_Y;
  const slotZ = HARBOR.mainShip.z + slot.z;
  // dev-only: ?solo hides the neighbouring cranes so the loading cycle can be filmed side-on
  const solo = process.env.NODE_ENV !== "production" && typeof window !== "undefined" && window.location.search.includes("solo");

  return (
    <group>
      <CargoShip spec={MAIN_SHIP} detail="hero" position={[HARBOR.mainShip.x, 0, HARBOR.mainShip.z]} heading={0}
        slotBay={SLOT_BAY} slotRef={slotRef} wakeSlot={0} rock={0.0014} moorings model={model} />
      {!solo && <GantryCrane position={[slotWorldX - 45, QUAY_Y, 0]} mode="idle" phase={13} zWork={-20} cargoColor={0x2a5d8a} />}
      <GantryCrane position={[slotWorldX, QUAY_Y, 0]} mode="cycle" wellRef={slotRef} wellFloor={wellFloor} slotZ={slotZ} />
      {!solo && <GantryCrane position={[slotWorldX + 45, QUAY_Y, 0]} mode="idle" phase={41} zWork={-16} cargoColor={0x6b4a33} />}
    </group>
  );
}

/** Docked hero ship, working cranes, the departing vessel and the distant fleet. */
export default function Fleet() {
  const quality = useNavigationStore((s) => s.quality);
  const heading = headingFor(SEAWARD.dx, SEAWARD.dz);
  const distant = quality === "low" ? DISTANT_SHIPS.slice(0, 2) : DISTANT_SHIPS;

  return (
    <group>
      <AssetSlot id="cargoShipHero" render={(m) => <Berth model={m} />}>
        <Berth />
      </AssetSlot>

      <CargoShip spec={DEPARTING_SHIP} detail="standard" position={[-213, 0, -235]} heading={heading}
        motion={{ dx: SEAWARD.dx, dz: SEAWARD.dz, speed: 1.7, travel: 1700 }} wakeSlot={1} rock={0.004} />

      {distant.map((d, i) => {
        const a = heading + d.yaw;
        const props = {
          spec: d.spec, detail: "distant" as const, position: [d.pos[0], 0, d.pos[1]] as [number, number, number], heading: a,
          motion: { dx: Math.cos(a), dz: -Math.sin(a), speed: d.speed, travel: 2600 }, wakeSlot: i < 2 ? i + 2 : undefined, rock: 0.006,
        };
        return (
          <AssetSlot key={d.spec.name} id="cargoShipDistant" render={(m) => <CargoShip {...props} model={m} modelId="cargoShipDistant" />}>
            <CargoShip {...props} />
          </AssetSlot>
        );
      })}
    </group>
  );
}
