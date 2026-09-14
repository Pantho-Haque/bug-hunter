---
meta:
  contentType: Decision
  decisionId: DR-01
  status: Approved for implementation
---

# Decide the rendering stack and supported devices

## Status

- State: Approved for implementation
- Owner: Product owner
- Required reviewers: Product, UX and accessibility, 3D engineering
- Blocks: Production scene, assets, editor integration, and performance budgets

## Decision question

Can Vite, React, React Three Fiber, and Three.js deliver the required third-person 3D and editor experience on the minimum laptop and supported tablet tiers?

## Approved decision

Use Vite, React, React Three Fiber, and Three.js. Treat the physical-keyboard laptop experience as primary. Support tablet and mobile layouts as responsive compatibility targets, including touch controls and a full-screen editor path. Devices without WebGL 2 receive a semantic unsupported-device surface.

## Alternatives

- A conventional engine Web export is deferred because it adds another runtime and makes the embedded web editor, accessibility surface, and local-first workflow harder to integrate.
- A 2D Canvas production game is rejected because it does not satisfy the third-person 3D product requirement.
- Touch-only tablets remain a compatibility path until editor and virtual-keyboard behavior pass.

## Evidence required

- Run the fixed greybox benchmark on physical Tier A laptop and Tier C tablet devices.
- Meet the frame-rate, load, editor responsiveness, zoom, reduced-motion, and cancellation thresholds.
- Confirm WebGL recovery and semantic fallback behavior.
- Record exact browser and device results under E-01.

## Consequences

Acceptance enables Phase 3 workspace dependencies and Phase 7 renderer production. Failure reopens scene complexity, tablet status, asset budgets, and the rendering-stack choice. It never authorizes a renderer-driven simulation shortcut.

## Approval

| Role | Name | Decision | Date | Evidence link |
|---|---|---|---|---|
| Product | Project owner | Approved for implementation | 2026-09-15 | Product direction in this thread |
| Technical |  |  |  |  |
| UX and accessibility |  |  |  |  |
| 3D engineering |  |  |  |  |
