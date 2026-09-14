---
meta:
  contentType: Decision
  decisionId: DR-05
  status: Approved for implementation
---

# Decide quality tiers and asset budgets

## Status

- State: Approved for implementation
- Owner: Product owner
- Required reviewers: Gameplay and UX or accessibility owners
- Blocks: Final asset acceptance and release device claims

## Decision question

Which presentation tiers keep the game readable and responsive without changing simulation or learning results?

## Approved tiers

| Concern | Low | Balanced | High |
|---|---|---|---|
| Target | Tier A and constrained Tier C | Tier B and capable Tier C | Development reference and measured capable devices |
| Player mesh | Up to 4,000 visible triangles | Measured intermediate LOD | Up to proposed 12,000 triangles |
| Shadows | One simplified directional shadow or baked substitute | One directional shadow | One directional plus up to two measured local lights |
| Textures | 512 px props, compressed atlas | 512 px to 1K shared atlas | 1K character group and measured props |
| Particles and post effects | Minimal or disabled | Reduced | Measured full presentation |
| Draw distance | Mission-readable minimum | Standard | Extended decoration only |

Every tier renders the same avatar state, route, blockers, interactables, required collectibles, goal, and semantic alternative. Quality selection may be automatic at first load, but the player can choose a stable override.

## Evidence required

- Capture frame rate, long tasks, memory, load, shader compilation, and context loss across the device matrix.
- Compare object and route readability in every tier.
- Verify identical trace and final-state hashes.
- Test quality switching, context recovery, reduced motion, and 200 percent zoom.

## Decision rule

Accept the lowest-cost tier that preserves all required visual distinctions and meets 30 FPS. Remove or simplify decorative assets before reducing mission information or semantic feedback.

## Failure and rollback

If Low fails, reduce decoration, materials, shadow cost, texture memory, animation blend detail, and draw distance in that order based on measurements. If the scene still fails, reopen DR-01 device support or renderer choice. Never alter collision or mission data as a performance fallback.

## Approval

| Role | Name | Decision | Date | Evidence link |
|---|---|---|---|---|
| Product | Project owner | Approved for implementation | 2026-09-15 | Product direction in this thread |
| 3D engineering |  |  |  |  |
| Gameplay |  |  |  |  |
| UX and accessibility |  |  |  |  |
