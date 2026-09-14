# E-06 — Phase 6 Hostile-Code Report

> Phase 6 deliverable: hostile-code fixtures and the coordinator's responses.

The coordinator is exercised by `packages/code-runner/src/hostile-fixtures.test.ts`. These are coordinator-contract tests: they feed validated synthetic `WorkerToHostSchema` messages and assert lifecycle state and the emitted `RunEventSchema` stream. They are not a substitute for real-worker hostile-code integration tests.

| # | Fixture | Worker response sequence | Coordinator outcome |
|---|---|---|---|
| 1 | Infinite loop (`while (true) {}`) | `ready → runStarted → runFault{code: timeout}` | lifecycle `fault`, last event `runFault{code: timeout, reasonKey: 'interrupt'}` |
| 2 | Unbounded recursion | `ready → runStarted → runFault{code: memory}` | lifecycle `fault`, last event `runFault{code: memory, reasonKey: 'run.memory'}` |
| 3 | Command flood | `ready → runStarted → commandRequested × N → runFault{code: commandLimit}` | requested command count is bounded; lifecycle `fault` |
| 4 | Blocked global (`fetch`) | Worker reports `runFault{code: blockedApi}` | lifecycle `fault` |
| 5 | Malformed command (unknown `kind`) | Coordinator's `parseWorkerToHost` rejects before the reducer runs | lifecycle unchanged; event stream empty for that message |
| 6 | Bad arguments (`moveForward` into a blocker) | `commandRequested` → reducer rejects | `commandRejected{reasonKey: 'wall.solid'}` |
| 7 | Double Run | First `runStarted` runs, second `runStarted` replaces it | applied counter resets, prior worker's commands are discarded |
| 8 | Pause during run | Coordinator dispatch is stopped until resume | contract-only: not yet a worker command-boundary pause |
| 9 | Step during Pause | Coordinator permits one dispatch | contract-only: not yet a worker command-boundary step |
| 10 | Route exit during run | Host posts `cancel` → coordinator emits `cancelled` fault | lifecycle `cancelled`, last event `runFault{reasonKey: 'run.cancelled.route-change'}` |

## Direct evidence

```
pnpm --filter @codequest/code-runner test
```

yields:

```
✓ src/protocol.test.ts (10 tests)        14 ms
✓ src/fault-mapping.test.ts (7 tests)    11 ms
✓ src/hostile-fixtures.test.ts (13 tests)

Test Files  3 passed (3)
     Tests  30 passed (30)
```

## Gate status — partial

```
pnpm lint      → passed locally
pnpm typecheck → passed locally
pnpm test      → passed locally (root build-before-test path)
pnpm build     → passed locally
```

On 2026-09-15, `/spikes/phase-7` was exercised in a browser: the real QuickJS worker completed the M01 three-command run and the scene, trace, and minimap received the three events. This verifies the worker entry point, not the hostile-code gate.

## Required before closing Phase 6

1. Implement the DR-03 immutable host-side command queue and make real Pause/Resume/Step work at command boundaries.
2. Produce source locations from instrumented code or a reliable stack mapping; command ordinals cannot be used as editor lines.
3. Run infinite-loop, recursion, allocation, blocked-global, cancel, and stale-message fixtures against the actual worker.
4. Add the production CSP and browser-security evidence specified by the threat model.
