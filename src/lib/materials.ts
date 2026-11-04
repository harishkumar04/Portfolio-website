import { MeshStandardMaterial } from "three";

/**
 * Maps a material's `map` in world space (dominant-axis projection) so long beams and
 * plates get an undistorted weathering texture regardless of their scale.
 */
export function applyWorldUV(mat: MeshStandardMaterial, tile = 8) {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `#include <project_vertex>
#ifdef USE_MAP
  {
    vec4 wp4 = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
      wp4 = instanceMatrix * wp4;
    #endif
    wp4 = modelMatrix * wp4;
    vec3 wn = abs(normalize(mat3(modelMatrix) * objectNormal));
    vec2 wuv = (wn.y > max(wn.x, wn.z)) ? wp4.xz : ((wn.x > wn.z) ? wp4.zy : wp4.xy);
    vMapUv = wuv / ${tile.toFixed(1)};
  }
#endif`,
    );
  };
  mat.customProgramCacheKey = () => `worlduv-${tile}`;
  return mat;
}
