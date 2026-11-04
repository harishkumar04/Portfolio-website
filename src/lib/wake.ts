/** Ships publish their position here; the ocean shader reads it to draw wakes. */
export interface WakeSource {
  active: boolean;
  x: number;
  z: number;
  dx: number;
  dz: number;
  length: number;
  halfWidth: number;
  speed: number;
}

export const WAKE_SLOTS = 4;
export const wakeSources: WakeSource[] = Array.from({ length: WAKE_SLOTS }, () => ({
  active: false, x: 0, z: 0, dx: 0, dz: -1, length: 100, halfWidth: 10, speed: 0,
}));
