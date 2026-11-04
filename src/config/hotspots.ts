import type { DestinationId } from "@/types";

/**
 * Clickable regions of the harbor painting (1672 x 941 source pixels), shared by the WebGL scene
 * and the no-WebGL fallback. `layer` is the painted layer the region belongs to (its depth is used
 * for the 3D hit area); `marker` is where the on-scene beacon sits.
 */
export interface Hotspot {
  id: DestinationId;
  layer: string;
  marker: [number, number];
  polygon: [number, number][];
}

export const hotspots: Hotspot[] = [
  { id: "about", layer: "tower", marker: [236, 196],
    polygon: [[48, 135], [70, 108], [190, 98], [240, 34], [345, 38], [426, 148], [426, 190], [394, 282], [330, 296], [178, 296], [110, 286], [48, 255]] },
  { id: "experience", layer: "tower", marker: [252, 430],
    polygon: [[178, 297], [330, 297], [326, 562], [178, 562]] },
  { id: "skills", layer: "foreground", marker: [150, 770],
    polygon: [[0, 338], [178, 344], [182, 460], [252, 468], [256, 548], [316, 552], [320, 680], [388, 680], [391, 748], [520, 748], [522, 800], [578, 800], [580, 941], [0, 941]] },
  { id: "projects", layer: "ship", marker: [985, 600],
    polygon: [[598, 545], [700, 500], [700, 455], [752, 428], [770, 398], [790, 398], [815, 428], [885, 455], [885, 482], [1095, 480], [1100, 440], [1112, 440], [1118, 480], [1210, 515], [1228, 570], [1170, 660], [1128, 745], [900, 742], [700, 712], [598, 700]] },
  { id: "contact", layer: "sea", marker: [1400, 690],
    polygon: [[1232, 400], [1672, 380], [1672, 896], [1360, 830], [1160, 790], [1132, 744], [1176, 650], [1230, 572]] },
];
