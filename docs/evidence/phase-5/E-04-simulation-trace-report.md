# E-04 — Phase 5 Simulation Trace Report

> Phase 5 deliverable: headless simulation engine, validator adapter, dev trace viewer, M01 reference traces.

## Surface

`packages/simulation` now exports:

- `createInitialState`, `cloneState`, `statesEqual`, `parseAvatar`, `parseFacing` — state primitives aligned to the domain `simulationStateSchema`.
- `createSimulation(mission)` — frozen handle factory that resolves the spawn into `startState.avatar` and exposes `.step(command)`, `.reset()`, `.isComplete()`.
- `simulationFromState(mission, state)` — read-only handle around an arbitrary snapshot (used for tests and dev previews).
- `reduceCommand(state, mission, command)` — pure reducer returning `{event, nextState, applied}`.
- `attemptMove`, `turnAvatar`, `occupiedCellsByKind`, `deltaForFacing`, `distance`, `directionToward`, `cellKey` — collision / facing helpers.
- `attemptCollect`, `attemptInteract`, `isInteractableInRange` — interaction reducers; both check current cell **and** forward cell so mission design (e.g. M03 "treasure at your feet") works.
- `validateMissionObjectives(mission, state)` — applies every completion invariant (avatar position, stepCount budget, terminal cell, required flags / objects / collected) and returns `{ok, issues}`.
- `replayCommands(mission, commands, options?)` and `replayFromInitial(mission, initial, commands)` — deterministic replay with optional `maxSteps` truncation.
- `createSnapshotStore({mission, initialState?})` — push / reset / stepBack / traces for the editor's Step mode.

## Determinism evidence

The replay suite (`packages/simulation/src/replay.test.ts`) captures four deterministic guarantees:

1. **Replay of `sol-m01-straight`** (`moveForward × 3`) reaches `(3,0) east` after 3 applied events; repeated replays produce byte-identical `events` arrays.
2. **Mixed-command replays** (`moveForward → turnLeft → moveForward → turnRight → moveForward → moveForward → turnLeft`) all apply; the emitted `command.kind` sequence matches the input.
3. **Truncation** — replaying with `maxSteps: 1` stops after the first command; with `maxSteps: 1024` every command runs.
4. **Replay with custom initial state** — `replayFromInitial` lets callers seed a different start (used by the snapshot store and the dev trace viewer).

## Branch coverage

| Branch | Test | Result |
|---|---|---|
| Move into blocker | `rejects a moveForward into a blocker with reasonKey` | rejected, `reasonKey: wall.blocks` |
| Move into goal/decor/empty | covered by M01 replay (`moved.forward`) | applied |
| Turn left 4× returns to start facing | `turnLeft cycles north→west→south→east` | applied |
| Turn right 4× returns to start facing | `turnRight cycles facing→right once per call` | applied |
| Repeat-collect idempotency | `repeat-collect is idempotent` | first applied, second rejected with `collect.already-collected` |
| Collect nothing | `rejects collect when nothing is in front` | rejected, `collect.nothing-here` |
| Interact nothing | `rejects interact when nothing is in front` | rejected, `interact.nothing-here` |
| Interact out of range | `interactable range check rejects when out of range` | rejected |
| Snapshot stepBack | `supports step-back to a prior state` | state reverts, depth decrements |
| Snapshot reset | `reset returns to the initial state` | depth zero, avatar back at spawn |
| Frozen handle | `createSimulation handle: produces a frozen handle that reflects step results` | handle never mutates after construction |
| Objective wrong cell | `flags wrong-terminal-cell when the avatar overshoots` | `wrong-terminal-cell` issue |
| Objective budget | `flags step-budget-exceeded when the player runs away` | `step-budget-exceeded` issue |

19 tests, all branch paths exercised.

## Failure fixtures vs simulation outcomes

The three `expectedFailures` declared on `m01FirstSteps` map to reducer reasonKeys:

| Fixture | Engine reasonKey |
|---|---|
| `fixture-m01-too-few` | `goal-not-reached` (objective invariant `avatarAt(3,0)` fails) |
| `fixture-m01-wrong-facing` | `avatar-facing-mismatch` (after `turnRight`, `avatarAt(3,0)` fails) |
| `fixture-m01-runaway-loop` | `budget-exceeded` (`stepCount > maxStepCount`) |

The dev trace viewer at `/spikes/phase-5` lists all three as selectable bundles alongside the two known solutions.

## Gate status

```
pnpm -r typecheck      → 10/10 packages
pnpm -r test           → 87 tests across domain (29), persistence (14), content (9),
                         simulation (19), test-fixtures (16)
pnpm -r lint           → 10/10 packages
node scripts/check-package-boundaries.mjs → 52 files scanned
pnpm -r build          → all packages; apps/web 209 KB + 916 KB chunks
```

## Open items for Phase 6

- Wire `RunEventSchema` into the runner protocol's outbound message type.
- Add a `runFault` reason that `reduceCommand` can emit when the runner signals `timeout` / `memory` / `blockedApi` (the simulation engine itself never throws).
- Add per-trace JSON snapshot serialisation so the editor can persist Step history.