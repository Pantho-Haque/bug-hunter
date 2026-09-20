import { describe, expect, it } from 'vitest';
import { Box3, PerspectiveCamera, Sphere, Vector3 } from 'three';

import { SceneryVisibility } from './sceneryVisibility';

describe('scenery visibility', () => {
  const board = new Box3(new Vector3(-3, 0, -3), new Vector3(3, 2.8, 3));

  it.each([0, Math.PI / 2, Math.PI, Math.PI * 1.5])(
    'clears foreground canopies from every orbit direction (%s)', (angle) => {
      const camera = new PerspectiveCamera(52, 1.6, 0.1, 100);
      camera.position.set(Math.sin(angle) * 12, 6, Math.cos(angle) * 12);
      camera.lookAt(0, 1, 0);
      camera.updateMatrixWorld();
      const visibility = new SceneryVisibility();
      visibility.update(camera, board);
      const foreground = new Sphere(new Vector3(Math.sin(angle) * 6, 3, Math.cos(angle) * 6), 2.5);
      const background = new Sphere(new Vector3(-Math.sin(angle) * 16, 3, -Math.cos(angle) * 16), 2.5);
      expect(visibility.obscures(camera, foreground)).toBe(true);
      expect(visibility.obscures(camera, background)).toBe(false);
    },
  );

  it('retains off-to-the-side scenery and clears a canopy containing the camera', () => {
    const camera = new PerspectiveCamera();
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 1, 0);
    camera.updateMatrixWorld();
    const visibility = new SceneryVisibility();
    visibility.update(camera, board);
    expect(visibility.obscures(camera, new Sphere(new Vector3(25, 2, 0), 1))).toBe(false);
    expect(visibility.obscures(camera, new Sphere(camera.position.clone(), 3))).toBe(true);
    expect(visibility.obscures(camera, new Sphere(new Vector3(0, 4, 20), 1))).toBe(false);
  });

  it('protects the far end of a long mission, not only its centre', () => {
    const camera = new PerspectiveCamera();
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 1, 0);
    camera.updateMatrixWorld();
    const visibility = new SceneryVisibility();
    visibility.update(camera, new Box3(new Vector3(-1, 0, -1), new Vector3(16, 3, 1)));
    expect(visibility.obscures(camera, new Sphere(new Vector3(8, 3, 6), 1.5))).toBe(true);
  });
});
