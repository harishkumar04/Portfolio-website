"use client";

import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import { assetUrl, modelAssets, type AssetId } from "@/config/assets";
import { normalizeModel, useHarborGLTF, type NormalizedModel } from "@/lib/models";

class Boundary extends Component<{ fallback: ReactNode; id: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) {
    console.warn(`[assets] "${this.props.id}" failed to load, using the procedural model instead.`, err);
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Loaded({ id, url, render }: { id: AssetId; url: string; render: (m: NormalizedModel) => ReactNode }) {
  const gl = useThree((s) => s.gl);
  const { scene } = useHarborGLTF(url, gl);
  const model = useMemo(() => normalizeModel(scene, modelAssets[id]), [scene, id]);
  return <>{render(model)}</>;
}

interface Props {
  id: AssetId;
  /** Renders the loaded, normalised GLB (each slot instance gets its own clone). */
  render: (model: NormalizedModel) => ReactNode;
  /** Procedural stand-in: shown when no file is configured, while loading, or on failure. */
  children: ReactNode;
}

/** Swaps a procedural model for a GLB from the asset registry without touching scene code. */
export function AssetSlot({ id, render, children }: Props) {
  const url = assetUrl(id);
  if (!url) return <>{children}</>;
  return (
    <Boundary fallback={children} id={id}>
      <Suspense fallback={children}>
        <Loaded id={id} url={url} render={render} />
      </Suspense>
    </Boundary>
  );
}
