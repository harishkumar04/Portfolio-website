import { create } from "zustand";
import type { DestinationId } from "@/types";

export type QualityTier = "high" | "medium" | "low";

interface NavigationState {
  current: DestinationId;
  /** True while the camera is moving — blocks conflicting interactions */
  transitioning: boolean;
  panelOpen: boolean;
  hoverLabel: string | null;
  selectedProject: string | null;
  selectedSkill: string | null;
  quality: QualityTier;
  reducedMotion: boolean;
  go: (id: DestinationId) => void;
  setTransitioning: (v: boolean) => void;
  setHoverLabel: (l: string | null) => void;
  setSelectedProject: (id: string | null) => void;
  setSelectedSkill: (id: string | null) => void;
  setQuality: (q: QualityTier) => void;
  setReducedMotion: (v: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  current: "home",
  transitioning: false,
  panelOpen: false,
  hoverLabel: null,
  selectedProject: null,
  selectedSkill: null,
  quality: "high",
  reducedMotion: false,
  go: (id) => {
    if (get().transitioning && id === get().current) return;
    set({ current: id, panelOpen: id !== "home", hoverLabel: null });
  },
  setTransitioning: (transitioning) => set({ transitioning }),
  setHoverLabel: (hoverLabel) => set({ hoverLabel }),
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setSelectedSkill: (selectedSkill) => set({ selectedSkill }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
