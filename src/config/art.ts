/**
 * The painted scene to load. Each scene is a folder produced by
 *   npm run art:build -- art/<name>/layers.json
 * containing scene.json, the cut layers and plate.webp (the untouched painting).
 *
 * "standin" is a TEMPORARY plate used to validate the engine; switch to "harbor" once the
 * harbor artwork has been cut (art/harbor/layers.json).
 */
export const ART_DIR = "/art/standin";
export const artScene = `${ART_DIR}/scene.json`;
export const artPlate = `${ART_DIR}/plate.webp`;
