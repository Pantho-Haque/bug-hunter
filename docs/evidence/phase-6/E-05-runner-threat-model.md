# E-05 — Phase 6 Runner Threat Model

> Phase 6 deliverable: trust boundary, asset list, mitigation map, residual risk.

## Trust boundary

```
┌──────────────────────┐      postMessage (validated)      ┌────────────────────────┐
│  Main app (host)     │ ─────────────────────────────────▶ │ Dedicated Worker       │
│  Coordinator         │ ◀───────────────────────────────── │ QuickJS-WASM runtime   │
│  Simulation reducer  │      runEventSchema messages       │ Frozen learning API    │
└──────────────────────┘                                    └────────────────────────┘
        │                                                           │
        │                                                           │ uses
        │ uses                                                      ▼
        ▼                                                   quickjs-wasmfile-release-sync
┌──────────────────────┐                                            │
│  Domain contracts    │                                   setMemoryLimit(4 MB)
│  Persistence store   │                                   setMaxStackSize(512 KB)
└──────────────────────┘                                   setInterruptHandler(deadline)
```

Anything outside the worker is treated as untrusted user input. The worker itself is the only component that executes learner code; nothing in the main app or simulation reducer runs that code.

## Assets

- **Local saves** — IndexedDB content (settings, progress, level code, backups). Must never be readable from learner code.
- **App API surface** — the 5 game command kinds, the structured logs, the `console.log` helper. These are the only objects available inside the sandbox.
- **Browser capabilities** — `fetch`, `XMLHttpRequest`, `localStorage`, `indexedDB`, `navigator`, `self.parent`, `importScripts`, `eval`, dynamic `import()`, `WebAssembly`, `Web Worker`, `SharedArrayBuffer`, `MessageChannel`, `BroadcastChannel`, `WebSocket`. None of these are exposed to the runtime.
- **Renderer scene state** — never lives in the worker; the worker only emits `commandRequested` messages.

## Threat list and mitigations

| Threat | Vector | Mitigation |
|---|---|---|
| Infinite loop | `while (true) {}` | `runtime.setInterruptHandler` checks elapsed time against `deadlineMs` (default 4 s). On interrupt the runtime throws, the worker catches it and emits `runFault { code: 'timeout' }`. |
| Unbounded recursion | Deep call stack | `runtime.setMaxStackSize(512 KB)` plus the same interrupt handler catches runaway recursion before the stack grows past limits. |
| Allocation growth | `new Array(1e9)` | `runtime.setMemoryLimit(message.budgets.memoryBytes)` (default 4 MB). On exceedance QuickJS throws an out-of-memory error which we map to `runFault { code: 'memory' }`. |
| Blocked global access | Code calls `fetch` / `console` / `globalThis` | Sandbox only binds the 5 allowed command kinds plus an optional `console.log`. Every other global access throws `ReferenceError` inside the runtime, surfaced as `runFault { code: 'syntax' }` with the message preserved. |
| Malformed command | Worker emits a command not in the schema | Coordinator's `parseWorkerToHost` guard rejects the whole message before it reaches the reducer. The simulation reducer also rejects commands whose kind is not in `MissionPackage.allowedApi`. |
| Bad arguments | Command references an object that doesn't exist or is out of range | The simulation reducer handles wall collisions (`attemptMove`), facing/range checks (`attemptInteract`), repeat-collect idempotency (`attemptCollect`), each emitting a `commandRejected` event with a domain reason key. |
| Double Run | User clicks Run while a run is active | Coordinator overwrites the previous `runId` on the next `runStarted`, the previous worker is terminated by the host (`worker.terminate()`), and any stragglers from the prior run are dropped because `commandRequested` carries a `runId` the coordinator checks. |
| Pause during run | User clicks Pause | Coordinator transitions to `paused` and drops further `commandRequested` messages until `resume()` or `step()` is called. |
| Step during Pause | User clicks Step once | Coordinator toggles `stepping = true`, lets exactly one command through, then returns to `paused`. |
| Route exit during run | User navigates away | React route change tears down the React component; the host calls `worker.terminate()` and posts `{ type: 'cancel', runId, reason: 'route-change' }`. The worker flips `context.cancelled = true`, the interrupt handler raises, and the worker emits `runFault { code: 'cancelled' }`. |
| Spoofed message from worker | Worker tries to send a `runStarted` after `runFinished` | Coordinator's lifecycle machine is one-way per run; `runStarted` after a terminal state is a no-op for state transitions, but the coordinator still resets `applied`/`rejected` counters so a spoof can't inflate metrics. |
| Memory leak between runs | Worker holds QuickJS handles after disposal | `try/finally` around `jsContext.dispose()` + `runtime.dispose()` for every run. Verified by hostile-fixtures test "double Run isolates state". |

## Residual risk

1. **QuickJS-WASM escape** is outside the project. We inherit whatever guarantees the upstream library ships. Phase 7 (or 9) must include an external security review of the deployed bundle.
2. **Side-channel timing** — the interrupt handler leaks elapsed time to learner code via `performance.now()` if it ever gets exposed. We do not expose `performance`; if a future mission requires timing it must go through the protocol.
3. **Renderer coupling** — the renderer consumes the reducer output; a buggy renderer that trusts the worker's command payloads could be tricked into scene-graph corruption. Phase 7 must validate every command payload against the mission before mutating the scene.

## Mitigation coverage matrix

| Mitigation | Tested in |
|---|---|
| `setInterruptHandler` deadline → timeout fault | `hostile-fixtures: handles an infinite loop → timeout fault` |
| `setMaxStackSize` → memory fault on recursion | `hostile-fixtures: handles unbounded recursion → memory fault` |
| `setMemoryLimit` → memory fault on allocation | `hostile-fixtures: handles allocation growth → memory fault with budget reason` |
| Capability allow-list | `hostile-fixtures: emits a blocked-api event when a disallowed kind is requested` |
| `parseWorkerToHost` guard | `protocol.test.ts: rejects malformed runFinished, rejects unknown fault codes` |
| Reducer-level argument validation | `hostile-fixtures: rejects bad arguments at the reducer level (moveForward into a blocker)` |
| Coordinator lifecycle isolation | `hostile-fixtures: double-Run isolates state` |
| Pause/Step semantics | `hostile-fixtures: Pause during run keeps commands queued`, `Step mode emits one command at a time` |
| Cancel semantics | `hostile-fixtures: cancel during run produces a cancelled fault with route-change reason` |