"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AssetSlot } from "./AssetSlot";
import { extractInstancedParts, type InstancedPart, type NormalizedModel } from "@/lib/models";

const ContainerPartsContext = createContext<InstancedPart[] | null>(null);

/** The GLB container split into instanceable parts, or null while procedural containers are used. */
export const useContainerParts = () => useContext(ContainerPartsContext);

function Publish({ model, set }: { model: NormalizedModel; set: (p: InstancedPart[] | null) => void }) {
  useEffect(() => {
    const parts = extractInstancedParts(model);
    parts.forEach((p) => p.geometry.translate(0, -model.size.y / 2, 0)); // instances are placed by their centre
    set(parts);
    return () => { set(null); parts.forEach((p) => p.geometry.dispose()); };
  }, [model, set]);
  return null;
}

/** Loads the 40 ft container GLB (if configured) and shares it with every ContainerStack. */
export function ContainerSourceProvider({ children }: { children: ReactNode }) {
  const [parts, setParts] = useState<InstancedPart[] | null>(null);
  return (
    <ContainerPartsContext.Provider value={parts}>
      <AssetSlot id="container40" render={(m) => <Publish model={m} set={setParts} />}>{null}</AssetSlot>
      {children}
    </ContainerPartsContext.Provider>
  );
}
