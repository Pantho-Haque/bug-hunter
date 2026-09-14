---
meta:
  contentType: Reference
  phase: 2
  status: In progress
---

# Exercise the Phase 2 technical risks

Open `/spikes/phase-2` while the Vite development server is running. The route is excluded from production behavior by an `import.meta.env.DEV` guard.

## Keep the spikes disposable

The lab proves technical capabilities without defining production packages or contracts. Phase 3 establishes the source layout and Phase 4 defines schemas. Do not import Phase 2 modules into the player experience.

## Spike 01: six by six 3D arena

The fixed arena renders:

- A six by six logical grid
- A highlighted seven-cell route
- An articulated humanoid proxy
- A perspective third-person overview
- Low and balanced presentation tiers
- A reduced-motion traversal option
- Median, one-percent-low, route-duration, and frame-count samples
- Rendering suspension when the lab is hidden or the document is in the background

The scene deliberately does not own gameplay truth. Positions are benchmark inputs rather than a production simulation.

## Spike 02: CodeMirror learning editor

The editor exercises:

- JavaScript syntax highlighting
- Line numbers, selection, history, search, indentation, and bracket pairing
- Game API completion for `moveForward()` and `console.log()`
- Syntax-tree diagnostics and keyboard diagnostic navigation
- Line wrapping and a high-contrast focus state
- Programmatic source replacement for recovery tests

The diagnostics are a proof adapter, not the production curriculum linter.

## Spike 03: restricted runner

The runner uses one release-sync QuickJS WebAssembly variant inside a dedicated module worker. Each Run creates and disposes a fresh QuickJS runtime and context.

Current limits:

| Limit | Spike value |
|---|---:|
| Evaluation time | 750 ms internal interrupt |
| Host fallback termination | 1,200 ms |
| QuickJS memory | 8 MB |
| QuickJS stack | 512 KB |
| Command requests | 64 |
| Console messages retained | 20 |

Only `moveForward()` and a bounded `console.log()` are exposed. Browser globals are absent by default. The UI terminates and recreates the worker for explicit cancellation or host-timeout recovery.

The spike proves isolation mechanics, not the final security claim. Phase 6 still requires protocol schemas, hostile fixtures, origin and Content Security Policy review, capability versioning, source ranges, and complete fault disposal tests.

## Spike 04: IndexedDB recovery

The storage spike:

- Writes one versioned current source record
- Retains one last-valid recovery record
- Validates data before use
- Recovers when the current record is deliberately malformed
- Exercises a simulated `QuotaExceededError` without overwriting valid data
- Deletes only the disposable Phase 2 database when reset

The database name and schema are not production save contracts.

## Continue the evidence work

Before closing Phase 2:

1. Run the arena and editor protocol on physical minimum laptop, tablet, and representative mobile devices.
2. Record exact operating system, browser, CPU, memory, GPU, viewport, input, power, and quality settings.
3. Measure camera occlusion and controller capsule behavior in the collision variant.
4. Run the full hostile-code fixture set against QuickJS.
5. Run a real browser-quota pressure test in addition to the deterministic simulated failure.
6. Compare queued and `await` teaching examples with curriculum review.
7. Lock DR-01, DR-02, DR-03, and DR-05 only after their evidence thresholds pass.

