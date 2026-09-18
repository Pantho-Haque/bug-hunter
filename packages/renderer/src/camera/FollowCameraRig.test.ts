import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';

import { occludedCameraDistance } from './FollowCameraRig';

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
