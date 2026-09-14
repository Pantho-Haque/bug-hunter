---
meta:
  contentType: Evidence
  phase: 2
  status: Development-device pass; target devices pending
---

# Record the Phase 2 spike results

## Run context

- Date: 2026-09-14
- Environment: local Vite development server
- Browser: Codex in-app browser
- Hardware classification: development device, not an approved Tier A or Tier C device
- Route: `/spikes/phase-2`
- Network: local loopback

## Results

| Spike | Test | Result | State |
|---|---|---|---|
| 3D arena | Seven-cell low-quality route | 60 median FPS, 56 one-percent-low FPS, 3,254 ms, 196 frames | Development pass |
| CodeMirror | JavaScript load and edit | Source editable with syntax highlighting and editor commands | Development pass |
| CodeMirror | Malformed `moveForward(;` | Diagnostic available through F8 navigation | Development pass |
| Runner | Seven queued commands | 14 ms evaluation; seven command requests; expected console output | Development pass |
| Runner | Browser globals | `window`, `fetch`, and `indexedDB` each reported `undefined` | Development pass |
| Runner | Infinite loop | Interrupted at the 750 ms internal budget; page remained responsive | Development pass |
| Runner | Explicit cancel | Worker terminated and clean-worker restart remained available | Development pass |
| Runner | 65 command requests | Rejected at the 64-command budget | Development pass |
| Runner | Recursive call fixture | Stack overflow was contained to the worker; the page remained responsive | Development pass |
| Runner | Allocation-growth fixture | Out-of-memory error was contained to the worker; the page remained responsive | Development pass |
| Persistence | Corrupt current record | Loaded the last valid recovery record | Development pass |
| Persistence | Simulated storage full | Failed without replacing stored data | Development pass |
| Browser | Console inspection | No browser console error observed after the test sequence | Development pass |

## What this evidence supports

- The selected React Three Fiber stack can render the fixed arena on the development device.
- A CodeMirror 6 editor can coexist with the scene in a lazily loaded development route.
- QuickJS can run inside a worker with internal budgets and host termination.
- The worker exposes only deliberate capability functions in this spike.
- A validated current plus recovery record can handle a malformed IndexedDB value.
- The Browser pass covers representative hostile-code failure modes (infinite loop, recursion, allocation growth, blocked globals, and command flood) without taking down the page.

## What this evidence does not support

- Minimum laptop, tablet, or mobile performance approval
- Touch-only coding acceptance
- Final collision, camera, command timing, or asset budgets
- A production sandbox or unrestricted-JavaScript security claim
- Real storage exhaustion behavior across supported browsers
- Curriculum acceptance of queued API calls
- Public worldwide launch approval

## Open evidence

| Evidence | Required for |
|---|---|
| Physical Tier A laptop benchmark | DR-01 and DR-05 |
| Physical Tier C tablet benchmark with hardware keyboard | DR-01 and DR-05 |
| Representative mobile responsive and WebGL check | Responsive compatibility scope |
| Collision and camera greybox | DR-02 |
| Queued versus `await` curriculum and security review | DR-03 |
| Real quota, corruption, reload, and offline browser matrix | Persistence recommendation |
| Hostile code suite and repeated lifecycle test | Runner recommendation |

## Browser verification boundary (2026-09-14)

The in-app Browser can verify the development-device route and deterministic runner fixtures, but it cannot certify a physical minimum laptop, tablet, or mobile device. The current Browser bridge also exposes no viewport emulation or physics instrumentation for this route, so collision, camera, and controller values remain unverified. Storage-full coverage is currently a deterministic simulated quota failure; deliberately exhausting a real browser quota is not part of this safe pass.

The queued-command behavior is observable and currently works as a bounded batch, but the curriculum/security choice between queued calls and `await` still requires an explicit DR-03 review. These limits mean DR-01, DR-02, DR-03, and DR-05 remain open rather than locked.

Phase 2 remains **in progress** until these physical-device and specialist evidence items are complete.
