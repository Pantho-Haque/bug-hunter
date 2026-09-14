# E-06 — Phase 6 Hostile-Code Report

> Phase 6 deliverable: hostile-code fixtures and the coordinator's responses.

The coordinator and worker are exercised by `packages/code-runner/src/hostile-fixtures.test.ts`. Each fixture builds a real coordinator, feeds synthetic `WorkerToHostSchema` messages, and asserts the lifecycle state and the emitted `RunEventSchema` stream.

| # | Fixture | Worker response sequence | Coordinator outcome |
|---|---|---|---|
| 1 | Infinite loop (`while (true) {}`) | `ready → runStarted → runFault{code: timeout}` | lifecycle `fault`, last event `runFault{code: timeout, reasonKey: 'interrupt'}` |
| 2 | Unbounded recursion | `ready → runStarted → runFault{code: memory}` | lifecycle `fault`, last event `runFault{code: memory, reasonKey: 'run.memory'}` |
| 3 | Allocation growth (`new Array(1e9)`) | `ready → runStarted → 20×commandRequested → runFault{code: memory}` (at the 17th command) | applied+rejected ≤ maxCommands=16, lifecycle `fault` |
| 4 | Blocked global (`fetch`) | Worker throws `ReferenceError` (no `fetch` is bound) → `runFault{code: syntax}` | lifecycle `fault` |
| 5 | Malformed command (unknown `kind`) | Coordinator's `parseWorkerToHost` rejects before the reducer runs | lifecycle unchanged; event stream empty for that message |
| 6 | Bad arguments (`moveForward` into a blocker) | `commandRequested` → reducer rejects | `commandRejected{reasonKey: 'wall.solid'}` |
| 7 | Double Run | First `runStarted` runs, second `runStarted` replaces it | applied counter resets, prior worker's commands are discarded |
| 8 | Pause during run | Pause command stops dispatch until resume | applied count frozen while paused |
| 9 | Step during Pause | One command at a time | applied increments by exactly 1 per step |
| 10 | Route exit during run | Host posts `cancel` → coordinator emits `cancelled` fault | lifecycle `cancelled`, last event `runFault{reasonKey: 'run.cancelled.route-change'}` |

## Direct evidence

```
pnpm --filter @codequest/code-runner test
```

yields:

```
✓ src/protocol.test.ts (10 tests)        14 ms
✓ src/fault-mapping.test.ts (7 tests)    11 ms
✓ src/hostile-fixtures.test.ts (12 tests) 17 ms

Test Files  3 passed (3)
     Tests  29 passed (29)
```

## Gate status

```
pnpm -r typecheck → 10/10 packages
pnpm -r test      → 116 tests (29 code-runner, 19 simulation, 9 content,
                    29 domain, 14 persistence, 16 test-fixtures)
pnpm -r lint      → 10/10 packages
node scripts/check-package-boundaries.mjs → 60 files scanned
pnpm -r build     → all packages
```

## Open items for Phase 7

1. Add a `clock.now()` helper bound through the protocol so timed missions can read elapsed game-time without exposing `performance`.
2. Wire the renderer to consume the coordinator's event stream directly (no separate polling).
3. Add a CSP report header so the threat model can be exercised against the production build.