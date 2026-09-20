import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';

import { missionCameraFrame, occludedCameraDistance } from './FollowCameraRig';

describe('mission camera framing', () => {
  it.each([0.45, 1, 1.8])('keeps both ends of a long board visible at aspect %s', (aspect) => {
    const frame = missionCameraFrame({ objects: [
      { cell: { cellX: -2, cellZ: -4 } },
      { cell: { cellX: 16, cellZ: 3 } },
    ] }, aspect);
    const camera = new PerspectiveCamera(52, aspect, 0.1, 200);
    camera.position.set(frame.centerX, 0.9 + Math.sin(Math.PI / 4) * frame.distance,
      frame.centerZ + Math.cos(Math.PI / 4) * frame.distance);
    camera.lookAt(frame.centerX, 0.9, frame.centerZ);
    camera.updateMatrixWorld();
    for (const x of [-2.5, 16.5]) for (const z of [-4.5, 3.5]) for (const y of [0, 2.5]) {
      const screen = new Vector3(x, y, z).project(camera);
      expect(Math.abs(screen.x)).toBeLessThan(1);
      expect(Math.abs(screen.y)).toBeLessThan(1);
    }
  });
});

describe('occludedCameraDistance', () => {
  it('shortens only when a blocker is actually between target and camera', () => {
    // A wall right beside the target sits under the sight line: occluded.
    expect(occludedCameraDistance(new Vector3(0, 0, 0), new Vector3(0, 4, 8), [{ cellX: 0, cellZ: 2 }]))
      .toBeCloseTo(1.54, 2);
    // Off the line entirely: not occluded.
    expect(occludedCameraDistance(new Vector3(0, 0, 0), new Vector3(0, 4, 8), [{ cellX: 2, cellZ: 4 }]))
      .toBeUndefined();
  });

  it('looks over a low wall that the sight line clears', () => {
    // Halfway along, the line is 1.77 units up — above a 1.15-unit box — so an
    // elevated camera must not be pulled in by a wall it can see over.
    expect(occludedCameraDistance(new Vector3(0, 0, 0), new Vector3(0, 4, 8), [{ cellX: 0, cellZ: 4 }]))
      .toBeUndefined();
    // The same wall does occlude a camera at ground level.
    expect(occludedCameraDistance(new Vector3(0, 0, 0), new Vector3(0, 0.5, 8), [{ cellX: 0, cellZ: 4 }]))
      .toBeCloseTo(3.54, 2);
  });
});
