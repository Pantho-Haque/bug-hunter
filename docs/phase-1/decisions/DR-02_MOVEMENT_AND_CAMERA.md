---
meta:
  contentType: Decision
  decisionId: DR-02
  status: Approved for implementation
---

# Decide movement and camera values

## Status

- State: Approved for implementation
- Owner: Product owner
- Required reviewers: Curriculum, UX and accessibility, 3D engineering
- Blocks: Mission layout authoring and animation timing

## Decision question

Which logical cell, controller capsule, command timing, and follow-camera values make code order readable while preserving game-like movement?

## Approved defaults

Use these values only in the Phase 2 greybox:

| Value | Spike default | Acceptance concern |
|---|---:|---|
| Logical cell edge | 1 simulation unit | Authoring clarity; renderer scale remains adaptable |
| Avatar capsule radius | 0.28 cell | Clear corridors without visual clipping |
| Avatar capsule height | 1.65 cells | Human silhouette and camera target |
| Walk command | 700 ms | Source-to-motion causality |
| Fast-forward command | 280 ms | Trace remains understandable |
| Turn command | 350 ms | Facing is readable before the next action |
| Default view | Strategic view | Shows the route, mission objects, and avatar before a run |
| Preview view | Third-person exploration view | Supports manual exploration without mission progress |
| Coding overlay | Optional, not a camera mode | Reveals cells, facing, ranges, and route cues when requested |

Logical movement remains one adjacent cell and one atomic command regardless of presentation timing. The player chooses between Strategic and Preview views. The game opens in Strategic view. “Coding View” is not a camera mode.

## Evidence required

- Test blocked movement, turns, collection range, pause, Step, repeat Run, and camera occlusion in the 6 by 6 arena.
- Observe whether children can predict the next cell and facing direction.
- Verify minimap, source highlight, trace, and avatar agree at every command boundary.
- Verify reduced-motion timing and the narrow-screen coding overlay.

## Decision rule

Accept the smallest set of global defaults that passes. Author per-mission camera anchors only for declared tight-room or occlusion cases. Do not add mission-specific movement distance, speed, collision, or facing rules.

## Failure and rollback

If children cannot connect a highlighted line to the next motion, slow command timing or strengthen anticipation and trace feedback before changing curriculum. If the camera hides required objects, change staging or an authored camera anchor before adding free-camera complexity.

## Approval

| Role | Name | Decision | Date | Evidence link |
|---|---|---|---|---|
| Product | Project owner | Approved for implementation | 2026-09-15 | Product direction in this thread |
| Gameplay |  |  |  |  |
| Curriculum |  |  |  |  |
| UX and accessibility |  |  |  |  |
