---
meta:
  contentType: Decision
  decisionId: DR-02
  status: Evidence gathering
---

# Decide movement and camera values

## Status

- State: Evidence gathering
- Owner: Gameplay or technical lead, name pending
- Required reviewers: Curriculum, UX and accessibility, 3D engineering
- Blocks: Mission layout authoring and animation timing

## Decision question

Which logical cell, controller capsule, command timing, and follow-camera values make code order readable while preserving game-like movement?

## Spike defaults

Use these values only in the Phase 2 greybox:

| Value | Spike default | Acceptance concern |
|---|---:|---|
| Logical cell edge | 1 simulation unit | Authoring clarity; renderer scale remains adaptable |
| Avatar capsule radius | 0.28 cell | Clear corridors without visual clipping |
| Avatar capsule height | 1.65 cells | Human silhouette and camera target |
| Walk command | 700 ms | Source-to-motion causality |
| Fast-forward command | 280 ms | Trace remains understandable |
| Turn command | 350 ms | Facing is readable before the next action |
| Camera field of view | 48 degrees | Comfort and path visibility |
| Follow distance | 4.5 cells | Avatar and forward route remain visible |
| Target height | 1.2 cells | Over-the-shoulder framing |

Logical movement remains one adjacent cell and one atomic command regardless of presentation timing.

## Evidence required

- Test blocked movement, turns, collection range, pause, Step, repeat Run, and camera occlusion in the 6 by 6 arena.
- Observe whether children can predict the next cell and facing direction.
- Verify minimap, source highlight, trace, and avatar agree at every command boundary.
- Verify reduced-motion timing and narrow-screen Coding View.

## Decision rule

Accept the smallest set of global defaults that passes. Author per-mission camera anchors only for declared tight-room or occlusion cases. Do not add mission-specific movement distance, speed, collision, or facing rules.

## Failure and rollback

If children cannot connect a highlighted line to the next motion, slow command timing or strengthen anticipation and trace feedback before changing curriculum. If the camera hides required objects, change staging or an authored camera anchor before adding free-camera complexity.

## Approval

| Role | Name | Decision | Date | Evidence link |
|---|---|---|---|---|
| Technical |  |  |  |  |
| Gameplay |  |  |  |  |
| Curriculum |  |  |  |  |
| UX and accessibility |  |  |  |  |

