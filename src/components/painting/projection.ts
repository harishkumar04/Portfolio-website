import { Matrix4, PerspectiveCamera, Quaternion, Vector3 } from "three";
import type { Px, SceneManifest } from "./types";

/**
 * The painting is treated as a photograph taken by a "home" camera: fixed position at
 * `camera.height` above the sea, looking towards -Z, pitched so the painted horizon row lines up.
 * Every layer is placed so that, seen from this camera, it lands exactly on its painted pixels.
 */
export class PlateProjection {
  readonly W: number;
  readonly H: number;
  readonly camera: PerspectiveCamera;
  readonly viewProj = new Matrix4();
  readonly forward = new Vector3();
  readonly quaternion = new Quaternion();
  private tanHalf: number;

  constructor(m: SceneManifest) {
    this.W = m.image.width;
    this.H = m.image.height;
    const cam = new PerspectiveCamera(m.camera.fov, this.W / this.H, 0.5, 20000);
    cam.position.set(0, m.camera.height, 0);
    this.tanHalf = Math.tan((m.camera.fov * Math.PI) / 360);
    const ndcH = 1 - (2 * m.camera.horizonY) / this.H;
    cam.rotation.set(Math.atan(-ndcH * this.tanHalf), 0, 0, "YXZ");
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    this.camera = cam;
    this.viewProj.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    cam.getWorldDirection(this.forward);
    this.quaternion.copy(cam.quaternion);
  }

  /** World-space ray direction through an image pixel. */
  ray([u, v]: Px) {
    const ndc = new Vector3((u / this.W) * 2 - 1, 1 - (v / this.H) * 2, 0.5);
    return ndc.unproject(this.camera).sub(this.camera.position).normalize();
  }

  /** Where the ray through a pixel meets the horizontal plane y = groundY. */
  groundPoint(px: Px, groundY: number) {
    const d = this.ray(px);
    const t = (groundY - this.camera.position.y) / Math.min(-1e-4, d.y);
    return this.camera.position.clone().addScaledVector(d, t);
  }

  /** Distance along the view axis of a point. */
  depthOf(p: Vector3) {
    return p.clone().sub(this.camera.position).dot(this.forward);
  }

  /** Depth of a card standing on `groundY` whose base is painted at image row `contactY`. */
  depthFromContact(contactY: number, groundY: number) {
    return this.depthOf(this.groundPoint([this.W / 2, contactY], groundY));
  }

  /** Metres per image pixel on a camera-facing card at `depth`. */
  metersPerPixel(depth: number) {
    return (2 * depth * this.tanHalf) / this.H;
  }

  /** Card-local coordinates (x right, y up, metres) of an image pixel on a card at `depth`. */
  cardLocal([u, v]: Px, depth: number): [number, number] {
    const s = this.metersPerPixel(depth);
    return [(u - this.W / 2) * s, (this.H / 2 - v) * s];
  }

  /** World position of a card's frame origin (the view axis at `depth`). */
  cardOrigin(depth: number) {
    return this.camera.position.clone().addScaledVector(this.forward, depth);
  }
}
