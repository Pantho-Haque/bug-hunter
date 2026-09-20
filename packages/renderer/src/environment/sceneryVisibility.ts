import { Box3, Vector3 } from 'three';
import type { Camera, Sphere } from 'three';

interface ScreenBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Conservative perspective bounds: protect the whole board, including the
// space above switches and the avatar, rather than just a ray to its centre.
function projectBox(box: Box3, result: ScreenBounds): void {
  const near = Math.max(0.01, -box.max.z);
  const far = Math.max(near, -box.min.z);
  result.minX = Math.min(box.min.x / near, box.min.x / far);
  result.maxX = Math.max(box.max.x / near, box.max.x / far);
  result.minY = Math.min(box.min.y / near, box.min.y / far);
  result.maxY = Math.max(box.max.y / near, box.max.y / far);
}

/** Reuses scratch storage: camera movement must not allocate per tree/frame. */
export class SceneryVisibility {
  private readonly board = new Box3();
  private readonly object = new Box3();
  private readonly center = new Vector3();
  private readonly boardScreen: ScreenBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  private readonly objectScreen: ScreenBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

  update(camera: Camera, bounds: Box3): void {
    this.board.copy(bounds).applyMatrix4(camera.matrixWorldInverse);
    projectBox(this.board, this.boardScreen);
  }

  obscures(camera: Camera, sphere: Sphere): boolean {
    this.center.copy(sphere.center).applyMatrix4(camera.matrixWorldInverse);
    this.object.min.copy(this.center).addScalar(-sphere.radius);
    this.object.max.copy(this.center).addScalar(sphere.radius);
    // Behind the camera, or entirely behind the board: keep the background.
    if (this.board.min.z >= 0 || this.object.min.z >= 0 || this.object.max.z < this.board.min.z) return false;
    projectBox(this.object, this.objectScreen);
    const a = this.boardScreen;
    const b = this.objectScreen;
    return b.maxX >= a.minX && b.minX <= a.maxX && b.maxY >= a.minY && b.minY <= a.maxY;
  }
}
