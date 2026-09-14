---
meta:
  contentType: Reference
  evidenceId: E-01
  phase: 1
  status: Proposed baseline
---

# Test the supported devices and browsers

This matrix defines the target surfaces and the Phase 2 benchmark protocol. It is a support contract, not a statement that untested devices work.

## Use capability-based browser support

Support the current and previous major stable releases of these browser engines at release-test time:

| Surface | Required browser | Input expectation | Support state |
|---|---|---|---|
| ChromeOS school laptop | Chrome | Keyboard, trackpad, optional touch | Primary |
| Windows 11 laptop | Chrome and Edge | Keyboard and mouse or trackpad | Primary |
| macOS laptop | Safari and Chrome | Keyboard and trackpad | Primary |
| iPadOS tablet | Safari | Touch plus supported hardware keyboard for coding | Conditional primary |
| Android tablet | Chrome | Touch plus supported hardware keyboard for coding | Conditional primary |
| Windows or macOS accessibility check | Firefox | Keyboard and screen reader pairing where applicable | Compatibility |

Do not bind the contract to version numbers in prose. Record exact operating-system, browser, GPU, and driver versions in each evidence run.

The application checks required capabilities and shows a useful fallback before loading a mission. Required capabilities are:

- JavaScript modules and Web Workers
- WebAssembly for the restricted runner spike
- WebGL 2 for the production 3D route
- IndexedDB, service workers, Cache Storage, and secure-context behavior for installed offline use
- Pointer, keyboard, and touch events appropriate to the declared input mode
- `prefers-reduced-motion` and standard semantic HTML accessibility support

WebGL 1 is not a production target. A device without WebGL 2 receives a semantic mission explanation and unsupported-device guidance, not a blank canvas or broken controls.

## Define test tiers

### Tier A: minimum school laptop

| Property | Baseline |
|---|---|
| Form | Chromebook-class or Windows education laptop |
| CPU | Two physical cores or four low-power logical cores |
| Memory | 4 GB system memory |
| GPU | Integrated GPU with working WebGL 2 |
| Display | 1366 by 768 CSS-pixel layout target at 100 percent scale |
| Input | Physical keyboard and trackpad or mouse |
| Network | Offline after installation; throttled initial load test |
| Quality expectation | Low tier, 30 FPS floor, deterministic results |

### Tier B: standard school laptop

| Property | Baseline |
|---|---|
| CPU | Four modern low-power cores or better |
| Memory | 8 GB system memory |
| GPU | Modern integrated GPU with WebGL 2 |
| Display | 1440 by 900 or 1920 by 1080 class |
| Input | Physical keyboard and trackpad or mouse |
| Quality expectation | Balanced tier, stable 45 FPS target, 60 FPS preferred |

### Tier C: supported tablet

| Property | Baseline |
|---|---|
| Form | 10-inch-class iPadOS or Android tablet |
| Memory | 4 GB class or better |
| Display | At least 1024 by 768 CSS-pixel landscape workspace |
| Input | Touch for navigation; hardware keyboard required for full mission coding acceptance |
| Quality expectation | Low or balanced tier, 30 FPS floor |

A touch-only tablet may support Preview, map, help, and short edits, but it is not a fully supported coding device until Phase 2 proves that the editor, shortcuts alternative, virtual keyboard, viewport resizing, and 3D controls remain usable together.

### Tier D: development reference

Use a current 8 GB or greater laptop with a modern integrated or discrete GPU for visual authoring. Passing Tier D never substitutes for passing Tier A and Tier C.

## Exercise required viewport cases

| Case | Required result |
|---|---|
| 1366 × 768 landscape | Playground and editor remain available without horizontal page scrolling |
| 1024 × 768 landscape | Labelled workspace tabs preserve mission context and controls |
| Tablet portrait | Map, settings, and reading surfaces work; mission coding asks for landscape when necessary |
| 200% browser zoom | Required text and controls reflow without clipping or overlap |
| Browser UI and virtual keyboard reduce height | Focused editor line and primary action remain reachable |

Do not duplicate desktop and mobile component trees. Layout changes presentation while controls retain the same semantics and state.

## Run the Phase 2 benchmark

Use the same fixed 6 by 6 greybox scene, avatar proxy, camera route, editor document, and command trace on every device.

### Test sequence

1. Clear site storage and browser cache.
2. Record device, operating system, browser, power state, display scale, and accessibility settings.
3. Load the app under the throttled initial-load profile.
4. Record time to usable shell and time to interactive mission.
5. Move through the fixed 30-command route at normal and fast-forward speed.
6. Type continuously in the editor while the scene animates.
7. Rotate and reset the camera, toggle Coding View, and switch workspace mode.
8. Pause, Step, Restart Scene, and repeat Run.
9. Run the infinite-loop, cancellation, storage-full, and offline-reload fixtures.
10. Repeat with reduced motion, 200 percent zoom, and the low-quality tier.

### Capture for each run

- Median and one-percent-low frame rate during the route
- Long tasks over 50 milliseconds
- Peak JavaScript heap where the browser exposes it
- Initial and warm mission load time
- Editor keystroke delay and missed input observed during animation
- Runner cancellation time and page responsiveness
- WebGL context loss, console errors, unhandled rejection, or storage failure
- Screenshot or video of default, narrow, zoomed, reduced-motion, and failure states
- Deterministic trace hash and final-state hash

### Pass criteria

- Median frame rate is at least 30 FPS on Tier A and Tier C
- No sustained one-percent-low result below 20 FPS during ordinary route playback
- No input freeze or missed typing attributable to rendering
- No single non-loading long task above 200 milliseconds during ordinary play
- The editor accepts input immediately after runner cancellation
- Trace and final-state hashes match across quality tiers and frame rates
- Cold and warm mission loads meet the product constraints
- Required controls remain reachable at every viewport and zoom case

Failing a minimum-tier criterion blocks the corresponding DR-01, DR-02, or DR-05 choice. Record a reduced scope or a measured technical change; do not lower a requirement silently.

## Maintain the evidence record

Copy the test table in [E-01 benchmark results](../evidence/phase-1/E-01_DEVICE_BENCHMARK.md) for every physical device. Emulator-only results must be labelled and cannot approve a minimum tier.
