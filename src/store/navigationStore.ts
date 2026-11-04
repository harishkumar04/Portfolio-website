import { create } from "zustand";
import type { DestinationId } from "@/types";

export type QualityTier = "high" | "medium" | "low";

/**
 * Meaningful shared state only. Anything that changes every frame (scroll position, camera pose,
 * pointer) lives in the mutable `journey` object (lib/journey.ts), never here.
 */
interface NavigationState {
  /** Section currently in view (driven by scroll) */
  active: DestinationId;
  selectedProject: string | null;
  selectedSkill: string;
  /** Hotspot under the pointer, e.g. "nav:about" */
  hovered: string | null;
  quality: QualityTier;
  reducedMotion: boolean;
  /** The painted scene (or the fallback image) has finished loading */
  sceneReady: boolean;
  /** The loading screen has handed over to the experience */
  entered: boolean;
  /** WebGL scene available (false = painted fallback) */
  webgl: boolean | null;
  setActive: (id: DestinationId) => void;
  selectProject: (id: string | null) => void;
  selectSkill: (id: string) => void;
  setHovered: (key: string | null) => void;
  setQuality: (q: QualityTier) => void;
  setReducedMotion: (v: boolean) => void;
  setSceneReady: (v: boolean) => void;
  setWebgl: (v: boolean) => void;
  enter: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  active: "home",
  selectedProject: null,
  selectedSkill: "cloud",
  hovered: null,
  quality: "high",
  reducedMotion: false,
  sceneReady: false,
  entered: false,
  webgl: null,
  setActive: (active) => set({ active }),
  selectProject: (selectedProject) => set({ selectedProject }),
  selectSkill: (selectedSkill) => set({ selectedSkill }),
  setHovered: (hovered) => set({ hovered }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setWebgl: (webgl) => set({ webgl }),
  enter: () => set({ entered: true }),
}));
