"use client";

import { useMemo } from "react";
import { ContainerStack } from "./Container";
import { buildYard } from "@/lib/harbor";
import { useNavigationStore } from "@/store/navigationStore";

/** The container terminal stacks: instanced, grouped by level of detail. */
export default function ContainerYard() {
  const quality = useNavigationStore((s) => s.quality);
  const batches = useMemo(() => buildYard(quality), [quality]);
  return (
    <group>
      {batches.map((b) => (
        <ContainerStack key={b.key} items={b.items} length={b.length} detail={b.detail} castShadow={quality !== "low" && b.detail !== "simple"} />
      ))}
    </group>
  );
}
