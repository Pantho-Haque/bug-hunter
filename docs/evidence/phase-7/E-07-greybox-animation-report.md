# E-07 — Phase 7 Greybox + Animation Report

> Phase 7 deliverable: renderer package surface, animation contract, camera matrix, quality tiers, asset budgets, and reduced-motion behavior.

## Renderer package surface

The renderer package (`packages/renderer`) consumes only `@codequest/domain` plus peer deps for `react`, `three`, and `@react-three/fiber`. It never reaches into `simulation` or `content` internals — domain types are the only state authority. Every component projects state; nothing decides mission truth.

```
packages/renderer/src/
├── avatar/
│   ├── AvatarRig.tsx              shared rig (boy/girl presets, swing, celebration)
│   └── avatarPresentation.ts      presentation types, themes, facing→radians
├── camera/
│   └── FollowCameraRig.tsx        coding/strategic/preview modes, occlusion pull-in
├── environment/
│   └── EnvironmentLayer.tsx       ground, route tiles, fog, ambient + key lights
├── objects/
│   └── MissionObjectLayer.tsx     discriminated-union renderer for every mission object kind
├── minimap/
│   └── Minimap.tsx                semantic SVG top-down projection (SceneTextAlternative surface)
├── preview/
│   └── PreviewControls.tsx        WASD/arrow key bindings + touch pad (disabled during runs)
├── quality/
│   └── qualityTier.ts             low/medium/high config, reduced-motion probe, layout breakpoints
├── animation/
│   └── commandAnimationSystem.ts  RunEventSchema → AvatarMovementState + active command marker
├── scene/
│   ├── SceneCanvas.tsx            R3F Canvas wrapper, props for the four layers + camera rig
│   └── SceneView.tsx              top-level wrapper with camera mode/reset, minimap, preview banner
├── world/
│   └── worldTransform.ts          cell→world coordinates, facing→yaw, mission bounds
└── index.ts                       public barrel
```

## Animation contract (the "current command" synchronization)

`deriveAnimationState(events, state)` walks the `RunEventSchema` stream in reverse and emits:

- `movementState`: `'idle' | 'walking' | 'turning-left' | 'turning-right' | 'collecting' | 'interacting' | 'rejected' | 'fault'`
- `activeCommand`: `{ sourceLine, commandId, kind }` for the most recent accepted or rejected command

The same `commandId` that the simulation's `ReduceResult` returns is the same id the coordinator streams through `RunEventSchema`. The renderer does not compute mission truth — it only reflects what the events say. In the current runner spike, `sourceLine` is a provisional command ordinal; it must not be presented as an editor line until Phase 6 supplies a real source mapping.

| Simulation event | Avatar rig state | Minimap marker | Active command |
|---|---|---|---|
| `commandApplied` moveForward | `walking` | avatar step +1 cell | `moveForward` L{n} |
| `commandApplied` turnLeft | `turning-left` | avatar rotates left | `turnLeft` L{n} |
| `commandApplied` turnRight | `turning-right` | avatar rotates right | `turnRight` L{n} |
| `commandApplied` collect | `collecting` (brief celebration) | collectible removed from map | `collect` L{n} |
| `commandApplied` interact | `interacting` (brief celebration) | interactable state flag on | `interact` L{n} |
| `commandRejected` | `idle` (no movement) | unchanged | rejected kind L{n} |
| `runFault` | `fault` | unchanged | fault reasonKey |

Tested in `commandAnimationSystem.test.ts` (9 tests covering each kind, fault fallback, rejection-as-active, facing delta).

## Camera modes

`CameraMode = 'coding' | 'strategic' | 'preview'`. All three modes share the same occlusion logic (blocker cells between the camera target and the desired position pull the camera in).

| Mode | Distance | Height | Look-ahead | FOV | Use |
|---|---|---|---|---|---|
| coding | 3.6 m | 2.4 m | 1.6 m | 56° | over-shoulder follow during Code mode |
| preview | 4.8 m | 3.6 m | 2.2 m | 52° | exploration in Preview mode |
| strategic | 9 m | 7 m | 2 m | 48° | over-shoulder orbit for map-style review |

`resetToken` snaps the camera back to the mode's home position; `cameraMode` prop is controlled by the parent (`SceneView` falls back to its own internal state when uncontrolled).

Occlusion is currently a proximity-based greybox pull-in, not a tested ray/line blocker check. It is useful for composition but does not satisfy the camera-occlusion gate until it only reacts to blockers between the target and desired camera position.

## Quality tiers

`QualityTier = 'low' | 'medium' | 'high'`. `inferTierFromHints({hardwareConcurrency, devicePixelRatio})` chooses a tier from device signals. `reducedMotionDefault()` probes `prefers-reduced-motion` and short-circuits the rig's `useFrame` arm/leg swing. Quality tier never changes simulation outcomes — it only alters render config.

| Tier | DPR | Shadows | Shadow map | Pixel ratio cap | Fog (m) | Detail level |
|---|---|---|---|---|---|---|
| low | [1, 1] | off | n/a | 1 | [6, 18] | greybox |
| medium | [1, 1.5] | soft | 512 | 1.5 | [10, 24] | medium |
| high | [1, 2] | soft | 1024 | 2 | [14, 32] | high |

Asset budget (`defaultAssetBudget`): `missionObjectsMax: 24`, `ambientLightsMax: 1`, `pointLightsMax: 4`, `totalTriangles: 8000`. The renderer uses 1 ambient + 1 directional light + up to 2 point lights (one on each goal/collectible), well under the cap.

## Reduced-motion behavior

When `reducedMotionDefault()` is `true` (or `reducedEffects` is set on the rig):

- arm/leg swing frequency zeroed (useFrame early return)
- camera lerp snaps to the target (`t = 1`)
- minimap CSS class `minimap-reduced` desaturates the minimap palette

The avatar still updates position from simulation state — only the cosmetic motion is suppressed. Mission truth is preserved.

## Responsive layout

`responsiveLayout(width)`: `narrow` (<600 px), `medium` (600–1024 px), `wide` (≥1024 px). The Phase 7 spike CSS uses a single breakpoint at 960 px to collapse the sidebar into a stacked column, satisfying the "narrow layout" test in the Phase 7 spec.

## Keyboard-only and Preview

`PreviewControls` listens to `keydown` on `window`, ignoring keys fired from `textarea`/`input`/`select`/`[contenteditable]` so editor focus does not double-fire. The touch pad renders 4 large buttons (≥ 56 px) satisfying 44×44 touch targets. Preview state never enters the simulation reducer — it only mutates a local "preview" `SimulationState` in the spike. Verified in `PreviewControls.test.tsx` (3 tests).

## Test results

```
pnpm --filter @codequest/renderer test
```

yields:

```
✓ src/world/worldTransform.test.ts (6 tests)
✓ src/animation/commandAnimationSystem.test.ts (9 tests)
✓ src/quality/qualityTier.test.ts (8 tests)
✓ src/preview/PreviewControls.test.tsx (3 tests)
✓ src/minimap/Minimap.test.tsx (2 tests)

Test Files  5 passed (5)
     Tests  28 passed (28)
```

## Gate status — partial

```
pnpm lint      → passed locally
pnpm typecheck → passed locally
pnpm test      → passed locally (145 tests)
pnpm build     → passed locally
```

## Direct evidence

Open `/spikes/phase-7` while `pnpm dev` is running. The page renders:

- The Phase 7 greybox street (ground, fog, lighting, route tiles for M01).
- The M01 mission objects: spawn marker, beacon goal (collectible glow), grass decor.
- The avatar rig (girl preset default, boy preset button toggles theme).
- The minimap (top-down SVG, avatar facing indicator, step counter).
- The camera mode buttons (Coding/Preview/Strategic) and the Reset button.
- The Preview pad and WASD/arrow binding (only active when "Preview: on").
- The Run code / Reset Scene buttons.
- The Trace card showing every applied/rejected/fault event with source line.
- The Current command card showing the active command's kind, line, movement, and avatar cell.

## "Do not proceed until" check — open

The Phase 7 spec says "do not proceed until avatar, minimap, trace, line highlight, and simulation agree on current command." In the spike:

- The avatar's animation state is `deriveAnimationState(events, state).movementState` — derived directly from the same `RunEventSchema` stream the trace card renders.
- The minimap reads `state.avatar` from the same `SimulationState` the simulation reducer produces.
- The trace card renders the same `RunEventSchema` items in order with their source line.
- The editor must wait for Phase 6's real source mapping; it may not treat the current ordinal as a line number.

The scene, minimap, and trace share the coordinator event stream and reducer state. The editor surface does not exist yet, and the source-location requirement is therefore not met.

## Asset and performance dashboard

| Surface | Triangles | Lights | Notes |
|---|---|---|---|
| avatar rig | ~720 (boy/girl) | 0 | low-poly primitives only |
| mission objects (M01) | ~640 | 1 (goal beacon) | 3 objects in M01 |
| environment | ~16 | 2 (ambient + directional) | shadow map 512 px on medium |
| total (M01 baseline) | ~1,376 | 3 | well under 8,000 triangle budget |

The full mission-budget envelope (`maxMissionObjects: 24`, `maxTriangles: 8,000`) leaves headroom for M02–M30's larger scenes.

## Required before Phase 8 starts

1. Complete Phase 6's immutable command queue and real source mapping.
2. Implement and test camera-line occlusion, then capture laptop/tablet/mobile performance evidence for quality tiers.
3. Establish a production bundle budget and reduce the current renderer route payload before adding the editor.
4. Once the preceding gates pass, Phase 8 must reuse `deriveAnimationState` for the `AvatarAnimationController`; no second implementation.
