import { create } from "zustand";
import type { DestinationId } from "@/types";

export type QualityTier = "high" | "medium" | "low";

interface NavigationState {
  current: DestinationId;
  /** True while the camera is moving */
  transitioning: boolean;
  panelOpen: boolean;
  /** Destination under the pointer (3D hotspot or beacon) */
  hovered: DestinationId | null;
  selectedProject: string | null;
  selectedSkill: string | null;
  quality: QualityTier;
  reducedMotion: boolean;
  /** The painted scene (or the fallback image) has finished loading */
  sceneReady: boolean;
  /** The visitor has passed the intro screen */
  entered: boolean;
  go: (id: DestinationId) => void;
  home: () => void;
  setTransitioning: (v: boolean) => void;
  setHovered: (id: DestinationId | null) => void;
  setSelectedProject: (id: string | null) => void;
  setSelectedSkill: (id: string | null) => void;
  setQuality: (q: QualityTier) => void;
  setReducedMotion: (v: boolean) => void;
  setSceneReady: (v: boolean) => void;
  enter: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  current: "home",
  transitioning: false,
  panelOpen: false,
  hovered: null,
  selectedProject: null,
  selectedSkill: null,
  quality: "high",
  reducedMotion: false,
  sceneReady: false,
  entered: false,
  go: (id) => set({ current: id, panelOpen: id !== "home", hovered: null }),
  home: () => set({ current: "home", panelOpen: false, hovered: null }),
  setTransitioning: (transitioning) => set({ transitioning }),
  setHovered: (hovered) => set({ hovered }),
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setSelectedSkill: (selectedSkill) => set({ selectedSkill }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  enter: () => set({ entered: true }),
}));
