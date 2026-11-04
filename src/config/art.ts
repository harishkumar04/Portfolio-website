/**
 * The painted scene to load. Each scene is a folder produced by
 *   npm run art:build -- art/<name>/layers.json
 * containing scene.json, the cut layers and plate.webp (the untouched painting).
 * "harbor" is the primary artwork (the tower scene).
 */
export const ART_DIR = "/art/harbor";
export const artScene = `${ART_DIR}/scene.json`;
export const artPlate = `${ART_DIR}/plate.webp`;
