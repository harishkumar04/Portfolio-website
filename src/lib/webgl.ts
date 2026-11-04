let cached: boolean | null = null;
export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  cached = probe();
  return cached;
}

function probe(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

export function detectQuality(): "high" | "medium" | "low" {
  const small = window.matchMedia("(max-width: 768px)").matches;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if ((small && touch) || cores <= 2 || mem <= 2) return "low";
  if (small || touch || cores <= 4) return "medium";
  return "high";
}
