import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';

import { occludedCameraDistance } from './FollowCameraRig';

describe('occludedCameraDistance', () => {
  it('shortens only when a blocker is actually between target and camera', () => {
    expect(occludedCameraDistance(new Vector3(0, 0, 0), new Vector3(0, 4, 8), [{ cellX: 0, cellZ: 4 }]))
      .toBeCloseTo(3.54, 2);
    expect(occludedCameraDistance(new Vector3(0, 0, 0), new Vector3(0, 4, 8), [{ cellX: 2, cellZ: 4 }]))
      .toBeUndefined();
  });
});
