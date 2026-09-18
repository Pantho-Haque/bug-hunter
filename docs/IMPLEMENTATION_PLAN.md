# CodeQuest 3D — Implementation Plan

This is the authoritative delivery sequence for the [feature specification](FEATURE_SPEC.md), requirements, [30-level design](LEVEL_DESIGN_30_MISSIONS.md), and architecture documents. It separates uncertain decisions, technical proof, production work, and release validation. Architecture checkpoints describe dependency order, while the phase numbers in this document control scheduling. A phase may not start dependent work until its **Do not proceed until** gate is met.

## Working rules

- Maintain a decision record for every Open item in the requirements teardown.
- Build one vertical slice before scaling content. A working M01 is worth more than a partly built 30-level map.
- Simulation state is authoritative; animation, minimap, editor highlighting, audio, and HUD reflect typed run events only.
- Test every child-facing change with keyboard, reduced motion, text scale, and one low-performance configuration.
- Every level is data plus tests. Never hard-code a mission answer in UI or scene components.

## Phase 1 — Product constraints and success criteria

**Implementation status:** Product baseline approved; specialist and physical-device evidence pending. Use the [Phase 1 product constraints](phase-1/PHASE_1_PRODUCT_CONSTRAINTS.md), [device and browser matrix](phase-1/DEVICE_BROWSER_MATRIX.md), [child-safety checklist](phase-1/CHILD_SAFETY_PRIVACY_CHECKLIST.md), [success measures](phase-1/SUCCESS_MEASURES.md), and [gate record](phase-1/PHASE_1_GATE.md). Decision status is tracked under [E-02](evidence/phase-1/E-02_DECISION_LOG.md).

**Goal:** turn high-level intent into fixed launch constraints.

**Work:** confirm age range, reading level, countries, browsers, minimum laptop/tablet, offline promise, and explicit v1 exclusions. Define child-playtest measures: first-mission completion, independent next action, concept transfer, frustration recovery, and accessibility blockers. Create DR-01 through DR-06.

**Deliverables:** device matrix, privacy/safety checklist, success-measure rubric, decision-record template.

**Risks:** late device choice causes 3D rework; broad age range makes copy inconsistent.

**Do not proceed until:** product, technical, and curriculum owners approve supported devices and child-safety scope.

## Phase 2 — Technical proof spikes

**Implementation status:** In progress. The development-only [Phase 2 evidence lab](phase-2/PHASE_2_SPIKES.md) contains the four proof surfaces. Initial local results are recorded in the [spike report](evidence/phase-2/PHASE_2_SPIKE_REPORT.md); physical target-device and specialist evidence remains open.

**Goal:** prove risky foundations independently before coupling them.

**Work:** greybox a 6×6 third-person arena; prototype CodeMirror completion/lint/line highlighting; prototype IndexedDB save/recovery/storage-full states; prototype restricted runner source-in/command-out/timeout/cancel; measure rendering, editor responsiveness, memory, and cancellation on target devices.

**Deliverables:** four disposable proof demos, measured performance report, recommended camera/cell/collision/code-execution values.

**Decisions locked:** DR-01 rendering stack, DR-02 cell/camera values, DR-03 queued calls versus `await`, DR-05 quality tiers.

**Do not proceed until:** greybox reaches 30 FPS on minimum target, editor stays responsive, and runaway code cannot lock the page.

## Phase 3 — Development foundation

**Goal:** establish a maintainable project before game rules are written.

**Work:** apply the architecture package layout; add TypeScript strictness, formatting, linting, unit/browser tests, import-boundary checks, and CI; add fixture factories for level data, commands, saves, and runner messages; document local setup and asset naming.

**Deliverables:** green CI baseline, source layout, testing utilities, contributor guide.

**Tests:** clean clone → `pnpm install` → lint → unit test → build → browser smoke test.

**Do not proceed until:** contributors reproduce the build and package import direction is enforced.

**Status:** Partial. The pnpm workspace, strict TypeScript, package-boundary checker, fixtures, contributor guide, and GitHub Actions verification workflow are present. Root `pnpm test` now builds workspace packages before running leaf tests, avoiding stale `dist` imports. A clean-browser smoke test remains absent, so this gate is not closed.

## Phase 4 — Domain contracts and content schema

**Goal:** define the stable language used by authors, simulation, renderer, editor, and saves.

**Work:** define runtime schemas for levels, maps, objects, goals, rewards, hints, examples, and copy; define typed IDs, state, commands, events, validation results, settings, and saves; define content/API/save versioning; encode the `MissionPackage` contract from the level design; model M01 entirely as data with completion invariants, concept evidence, known solutions, and failure fixtures; add a development-only Level Lab that discovers those fixtures from the content registry.

**Deliverables:** schema package, sample `level.json`, content handbook, migration policy, and a traceability report from every M01 field to its consumer and test.

**Tests:** invalid IDs, duplicate objects, unreachable goals, missing hints/examples, unknown rewards, incompatible API versions, and malformed imports fail validation.

**Do not proceed until:** M01 requires no level-specific UI code.

**Status:** Partial. Domain schemas, persistence schemas, the content registry, M01 fixture, handbook, and contract report are present. Unknown state invariants now fail closed. Validation coverage now demonstrates all seven promised cases with a distinct issue code each: `invalid-id`, `duplicate-object-id`, `unreachable-goal`, `missing-hints`, `missing-example`, `unknown-reward-asset`, `incompatible-api-version`, and `malformed-import`. Three were closed this round — `malformed-import` was declared but never emitted, so garbage input threw a `TypeError` instead of failing validation; `unknown-reward-asset` only fired when a caller passed `knownAssetIds`, which no caller does, so reward assets are now checked against the `asset.<group>.<name>` convention every shipped mission already follows; and `missing-example` was missing entirely, letting a mission ship with no worked example. Goal reachability is now gate-aware, matching `isBlockerOpen` in the simulation: a blocker carrying `unlockedByFlag` is a gate a learner can open, so it can no longer make a goal look unreachable. A parameterized test runs all six shipped missions through validation and asserts no issues, so drift fails the suite in either direction. The remaining exit item is the level-specific-UI proof, which Phase 8 now satisfies in practice: `MissionPreview` renders any registry mission from data alone and no mission has bespoke UI.

## Phase 5 — Deterministic simulation engine

**Goal:** implement game rules without 3D graphics.

**Work:** implement pure reducers for spawn/move/turn/collect/interact/reset/objective validation; implement collision, facing, interaction range, object state machines, and snapshots; generate trace entries with command ID, source line, before/after state, and child-readable reason; implement replay and Step.

**Deliverables:** simulation package, validator adapter, development trace viewer, M01–M06 reference traces.

**Tests:** every command/result branch, pause/step/restart, repeat collect, exact replay, and 30/60-FPS-independent outcomes.

**Do not proceed until:** headless M01 has byte-for-byte equivalent trace and end state on replay.

**Status:** Partial. `packages/simulation` ships `createSimulation`, `reduceCommand`, `replayCommands`, `createSnapshotStore`, and `validateMissionObjectives`; M01 reference traces replay deterministically. Blockers now carry an optional `unlockedByFlag`, so a gate opens once the matching interactable is used; this is the only simulation rule added after Phase 5 and it is covered by a reducer test. M01–M06 canonical routes replay deterministically to their objectives in `packages/test-fixtures`. Full timing-independence evidence is still missing, so this phase is a strong Meadow baseline rather than a closed simulation phase.

## Phase 6 — Secure player-code runner

**Goal:** allow JavaScript learning logic without exposing browser/app/local data.

**Work:** build runner protocol, fresh-runtime lifecycle, budgets, cancellation, frozen learning API, and coordinator-side message validation; map faults to source line, child copy, technical detail, and next action; dispose runtime on every exit path.

**Deliverables:** runner package, API capability manifest, threat model, hostile-code fixtures.

**Tests:** infinite loop, recursion, allocation growth, blocked globals, malformed command, bad arguments, double Run, Pause during run, and route exit during run.

**Do not proceed until:** hostile fixtures cannot freeze UI, access browser capability, mutate simulation directly, or leak between runs.

**Status:** In implementation. `packages/code-runner` has an isolated QuickJS worker, fail-closed capability resolution, bounded commands, cancellation, protocol validation, fault mapping, immutable host-side command queue, and authored source-line mapping. Host `advance()` and paused `step()` release one command only at a real host boundary; the mission player releases a later command only after the visible prior command completes. The browser-worker hostile-code gate is now closed by `pnpm hostile-check` (`scripts/hostile-code-harness.mjs`), which drives the **built** worker bundle in a real browser over the real postMessage channel and asserts containment of 12 hostile fixtures plus recovery afterwards: infinite loop, unbounded recursion, command flood, allocation growth, syntax error, a command the mission has not unlocked, the blocked globals `fetch`, `XMLHttpRequest` and `importScripts`, and escape attempts against the DOM, local storage, and the host message channel via a forged `postMessage`. All 13 checks pass and the harness runs in CI, so a regression fails the build. Results: [E-08](evidence/phase-6/E-08-browser-worker-hostile-report.md).

## Phase 7 — 3D greybox and camera/animation contract

**Goal:** make code execution legible as third-person 3D action.

**Work:** implement the React Three Fiber scene adapter, streamed continuous-looking districts, Strategic View as the default camera presentation, Preview View for third-person exploration, a shared mid-poly boy/girl avatar rig, controller capsule, objects, blockers, and minimap from simulation data. Add WASD, arrow, touch, and camera controls for Preview only. Reset the authored scene before Code mode and map command IDs to movement and animation states. Implement camera collision, optional coding overlay, camera reset, reduced-motion behavior, low-quality tier, responsive layout, level-of-detail assets, and visual chunk streaming. Enforce object and asset budgets.

**Deliverables:** complete WebGL street or trail greybox, articulated avatar proxy, production rig contract, animation contract, camera test matrix, and performance dashboard.

**Tests:** pause in every animation state, repeat Run, low FPS, camera occlusion, narrow layout, keyboard-only, and reduced motion.

**Do not proceed until:** avatar, minimap, trace, line highlight, and simulation agree on current command; quality tier never changes outcome.

**Status:** Partial. `packages/renderer` provides the scene adapter, current low-poly boy/girl prototypes, camera modes, mission-object projection, semantic minimap, preview controls, quality tiers, and event-to-animation contract. The normal starter route now uses the shared renderer only as a non-executing M01 preview; learner code is never regex-parsed or directly executed there. Quality configuration is now applied to fog, shadows, and goal lights. The approved target adds Strategic View as default, Preview View, a Settings modal, mid-poly level-of-detail assets, and continuous-looking streamed environments. `pnpm perf-check` (`scripts/performance-harness.mjs`) now produces the performance dashboard and bundle budget as a committed report ([E-09](evidence/phase-7/E-09-performance-report.md)): frame profile, p95 frame time, JS heap, time-to-editor and time-to-runner-ready per quality tier, and the gzipped size of every precached asset. It also enforces the gate rule that a quality tier must never change the outcome, failing if any tier cannot solve the mission. The report describes the machine that ran it, so the target-device evidence is now one command away from whoever holds the low-end laptop and tablet. The remaining gate work is real camera-line occlusion, that target-device run, and the newly approved renderer scope. Do not treat the Phase 7 spike as the Phase 8 vertical slice.

## Phase 8 — Learning/editor vertical slice

**Goal:** connect child intent, code, and visible world result.

**Work:** configure CodeMirror; add API docs, completion, lint, undo/redo, Run/Pause/Step/Reset, speed, trace, errors, and route preview; add briefing, examples, progressive hints, planning cards, recap, and reflection; distinguish Reset Scene from Reset Code; save local drafts.

**Deliverables:** fully instrumented M01 with success, failure, retry, and accessibility paths.

**Tests:** first-time player identifies goal, facing, Run, Pause, Reset Scene, and Reset Code without adult instruction.

**Do not proceed until:** internal usability review shows a player can explain `moveForward()`.

**Status:** In implementation. The production mission route (`apps/web/src/starter`) now runs learner code only through the sandboxed QuickJS worker and reports a real result: Run/Pause/Step/Reset Scene against the host-controlled command queue, Reset Code kept distinct, CodeMirror with history-backed undo/redo and mission-command completion, progressive hints from the mission package, a per-command trace with authored line numbers, child-facing fault copy, the reflection question on success, and local drafts restored on reload. Verified end to end in Chrome: short route → "Not there yet", full route → "Goal reached!", blocked global → "That helper is locked for this level." The remaining gate work is the first-time usability script with children, touch and keyboard-only passes, runner-reported source lines on evaluation faults, and Reset Scene during an in-flight animation on a low-end device.

## Phase 9 — Meadow of Moves MVP

**Goal:** deliver M01–M06 as one polished offline zone.

**Work:** author/greybox/test M01–M06 before art; implement onboarding, map, rewards, settings, collection preview, progress, export/import, recovery, service-worker caching, and offline/update states; complete accessibility, local-data, performance, and security checks.

**Deliverables:** first installable zone, six mission packages, local save/backup/recovery flows.

**Tests:** fresh player → onboarding → M01–M06 → close/reopen → replay → export/import → storage failure → recovery.

**Do not proceed until:** child playtests meet first-mission completion, independent-next-action, and error-recovery targets with no critical accessibility issue.

**Status:** In implementation. The Meadow zone ships all six mission packages (M01–M06) in `packages/content`, each one replay-tested against the simulation so a layout change that makes a mission unsolvable fails the build. The map reads the mission registry rather than hardcoded React copy, unlocks each mission from its predecessor's completion, and stores progress and per-mission code drafts locally. Verified end to end in Chrome: a cleared profile plays M01–M06 in order, every mission reports "Goal reached!", locked rows open as their prerequisite completes, and progress survives a reload. Local data now runs through `packages/persistence`: settings, progress, and per-mission code drafts are schema-validated on every read, a damaged record is preserved as `<key>.corrupt` and replaced by defaults rather than blocking start-up, a full quota surfaces as a plain-language notice, and Settings can export a backup file and restore one (a malformed file is refused without touching the existing save). Verified in Chrome: play M01 → export → clear storage → import restores progress and drafts; a junk file changes nothing; a corrupted progress blob still boots. Onboarding, rewards, the collection preview, service-worker caching and the offline/update states are in. A generated service worker precaches every built asset (the file list comes from the bundle, so hashed names can never go stale); a new build surfaces an "A new version is ready" banner and only swaps when the player accepts.

**Production-build bugs found and fixed during this phase.** The app had never been exercised against a production build, only the dev server, and three defects were hiding there:

1. *Every run failed.* The runner's wall-clock deadline started when the worker received the run message, so booting QuickJS and building the context consumed the whole 4s budget and the interrupt handler aborted the learner's code before its first instruction. The deadline now starts immediately before `evalCode`, and the host budget is generous because `maxInstructions` — an interrupt count, unaffected by how much CPU the worker gets — is the real guard against runaway loops.
2. *A failed runner hung forever.* A worker that died left the child on "Running…" indefinitely. The worker now converts every failure path into a `runFault`, and the host has a watchdog that retires a silent runner, replaces it, and reports a fault.
3. *QuickJS booted too late.* Starting the worker on the first Run meant a 5–12s wait on a page still building the 3D scene. The runner is now warmed when a mission opens and announces itself with the protocol's `ready` message; Run stays disabled and labelled "Getting ready…" until then.

The service worker also registered only from a `load` listener that had usually already fired, and reloaded the page on first install; both are fixed.

**Evidence (production build, Chrome).** M01–M06 all played to "Goal reached!" in order with progression and rewards; hostile fixtures (infinite loop, runaway commands, blocked global, deep recursion) are all stopped with child-facing copy and a live UI; the game loads and plays a full mission with the network cut; export → wipe → import restores progress and drafts, a malformed file is refused, a corrupted save still boots; the update banner appears after a new build and applies on request; axe-core reports zero WCAG 2.1 A/AA violations on the onboarding, map, and mission screens.

Still open for the phase gate: first-zone art and audio, target-device performance measurement, and the child playtests themselves.

## Phase 10 — Playtest, revise, and lock conventions

**Goal:** stop unvalidated Meadow patterns from multiplying into 24 more levels.

**Work:** run moderated child playtests; record misunderstanding of camera, minimap, ordering, errors, hints, rewards, and resume flows; prioritize by safety/learning blockage/repetition; revise M01–M06 and update templates, camera contract, copy style, hint model, API guide, and asset rules from evidence.

**Deliverables:** playtest report, prioritized fixes, locked authoring conventions, updated decisions.

**Do not proceed until:** repeated critical confusion is fixed or explicitly accepted with evidence. Bulk content production is prohibited before this gate.

**Status: PENDING — see the [Phase 10 gate record](phase-10/PHASE_10_GATE.md), which tracks every unticked box.** Blocked on sessions, not on engineering. The entry requirements are now in place: an end-to-end Meadow build that runs from a production bundle (see Phase 9), plus the [participant consent process](phase-10/PARTICIPANT_CONSENT_PROCESS.md) and the [playtest protocol](phase-10/PLAYTEST_PROTOCOL.md), which carries the session shape, moderator script, the seven observation questions, the observation sheet, the issue-classification rubric, and the report and exit-gate checklists. Both reuse the Phase 1 measures and assistance ladder rather than restating them. What remains is the part that cannot be produced from a keyboard: a privacy or legal reviewer must approve the consent process, and 5 to 8 moderated sessions with children aged 8 to 12 must actually be run. No session data may be simulated, estimated, or inferred — every downstream convention this phase locks depends on it being real.

Two things reduce what those sessions have to spend their time on. `pnpm copy-check` ([E-10](evidence/phase-10/E-10-copy-and-access-audit.md)) covers the mechanical half: a first-time player reaching a mission by keyboard alone through the onboarding modal, a visible focus indicator on every focused control, the editor reachable without a mouse, no clipped content or sideways scroll at 200% text, reduced motion honoured, and rendered copy at or below the grade-5 baseline. Reading level and fault copy are unit tests rather than browser checks, so CI enforces them: `packages/content/src/reading-level.test.ts` scores every authored child-facing string against DR-04's baseline, and the fault-copy case in `packages/code-runner` requires plain wording plus a next action for every runner fault. None of this measures comprehension, which is the whole point of the sessions.

[DR-07](phase-1/decisions/DR-07_PROCEED_WITHOUT_PLAYTESTS.md) records the option of opening Phase 11 without this evidence. It is **proposed, not accepted**: it recommends holding, and bounds the fallback to Echo Forest if production must start. Nothing may rely on it until it is signed.

## Phase 11 — Scalable content production

**Goal:** build the remaining zones without content debt.

**Work:** build validators for schema, prerequisite, IDs, solvability, known traces, localization, budgets, and rewards. Produce each batch in order: Echo Forest M07–M12, Loop Lagoon M13–M18, Logic Cliffs M19–M24, Maker Observatory M25–M30. Each batch follows lesson design → greybox → valid-solution tests → accessibility/copy → playtest → art/audio → performance → lock. Version every new API and run saved-code migration tests.

**Deliverables per zone:** six mission packages, map/reward changes, valid traces, performance/playtest report.

**Do not proceed to the next zone until:** no progression dead end exists, two valid solutions pass where intended, and current-zone child tests meet comprehension/recovery targets.

**Status:** All 30 missions authored and validated; produced under [DR-07](phase-1/decisions/DR-07_PROCEED_WITHOUT_PLAYTESTS.md) on owner instruction, ahead of the Phase 10 sessions. That record is still unsigned, and every mission here carries no playtest evidence.

**Validators.** `validateContentRegistry` checks the catalogue as a whole — duplicate level ids, duplicate ordinals within a zone, zone mismatches and unknown zones, dangling prerequisites, prerequisite cycles, progression dead ends, missing zone entry missions, object counts over budget, a declared solution that does not fit the mission's own command or step budget, missions with no known solution or failure fixture, and mixed locales. Solvability is catalogue-driven in `packages/test-fixtures`: every registered mission must have a canonical route that replays to its objectives with zero rejected commands, and a mission that ships without one fails the suite. A reading-level test holds every child-facing string at or below the DR-04 grade baseline.

**New API, versioned.** Predicates are the first learner-callable APIs that return a value: `canMoveForward`, `isPearlHere`, `isWindSafe`, `signPointsLeft`, `hasLantern`, each behind its own `cap-sense-*` capability so a mission unlocks exactly the question it teaches. They read the world and change nothing, so they cost no command budget. Missions using them declare `apiVersion: 'v2'`; earlier zones stay on `v1`. Saved drafts are keyed per API version and a v1 draft is carried forward on a version bump, covered by migration tests in `packages/persistence`.

The architecture needed a change to make this possible. The worker used to evaluate a whole program ahead of the host, so there was no world to ask mid-run. It now mirrors the simulation as learner code executes, answering predicates synchronously, while the host reduces the same commands independently and stays authoritative; a `mirrorStepCount` check faults the run if the two ever disagree. Learner code cannot reach the mirror — it lives in the worker's own scope, outside QuickJS. A hostile fixture proves a predicate a mission has not unlocked does not exist inside the sandbox.

**Zones.** Meadow of Moves M01–M06, Echo Forest M07–M12 (learner-defined functions), Loop Lagoon M13–M18 (loops, first predicates), Logic Cliffs M19–M24 (conditionals, variables), Maker Observatory M25–M30 (arrays, debugging, the capstone). The map renders any zone the moment the registry ships missions for it, so it can never promise or hide content the package disagrees with.

**Evidence.** 283 tests across 8 packages; lint and package-boundary checks clean; 14/14 hostile fixtures contained; the copy and access audit passes all 7 checks. Verified in a production build in Chrome: M07 solved with a learner-defined function, M16 with `while (canMoveForward())`, M21 with `if (!hasLantern())`, and M30 played to completion across 20 commands with both rewards granted.

**Known limits, recorded rather than hidden.** `unlockedByFlag` watches a single flag, so M09's "door opens after both bells" is enforced by the completion contract instead of the gate; an `unlockedByFlags` array would make it literal. `interact()` sets a boolean per object with no counter, so M18's "five turns of one tide wheel" is authored as five pegs. A mission package has one `startState`, so M20 and M22 ship one seeded variant each with the other described in their fixtures; true two-variant testing needs a schema change.

**Not done.** Per-zone art and audio, target-device performance runs, and the per-zone child playtests each zone's own gate requires. No zone has passed its "do not proceed to the next zone" gate on evidence; they were produced in one pass.

**UX pass after Phase 11 (2026-09-18), on the owner's report that "a left command moves the agent backward-left".** Root cause was in the renderer, not the simulation: `facingToRadians` had north and south swapped for the rig's actual forward axis (+Z), so the avatar rendered facing away from its direction of travel on the north–south axis, and the follow camera sat north of the avatar looking south, which put east on the *left* of the screen while the minimap put it on the right. The mapping now has one source in `worldTransform.ts` (the two copies were deleted), Strategic view is north-up with east on the right like the minimap, and a geometric test asserts that rotating the rig's forward by the yaw yields the simulation's direction vector for all four facings. The same pass added per-mission URLs (`/mission/<id>`, with locked deep links bounced to the map), a map tracker ("You are in …, next up …, Continue"), a success celebration with a direct "Next mission" action, synthesised sound feedback and an ambient bed with a Settings toggle (no audio assets, nothing fetched), and a professional editor: line numbers, Dracula highlighting, friendly live diagnostics, bracket auto-close, snippets for loops/conditionals/functions, and a status line. `pnpm progression-check` plays all 30 missions through the production build as the Phase 12 progression gate.

A guidelines review (WCAG 2.2 AA plus usability, run against the map and mission screens) produced 28 findings, all of which were fixed. The three critical ones: the Suspense loading text was rendered in a near-invisible colour on the dark background; every run-control press unmounted the focused button, dropping keyboard focus to the page; and the "What Nova did" trace was force-closed the moment a run ended — exactly when a child debugging M27 needs it. Run controls are now one always-mounted Pause/Resume toggle with an `aria-disabled` Run button, the trace is only ever closed by the child, "Reset code" became "Start code over" with an Undo, the two "Map" buttons became "Top view" and "Back to the map", locked rows say "Finish Mission N first", the OS `prefers-reduced-motion` preference now drives playback timing (not just CSS), decorative glyphs are hidden from screen readers, trace lines read as sentences, and the map's stale "planned mission" branch and its hard-coded per-zone numbering were deleted in favour of the registry. Reachability validation was also bounded to the mission footprint after it began flooding a 513×513 grid per mission and timing out the test suite.

A second owner report ("the agent walks over the spikes", "the goal is always lit", camera feel) led to: scenery is now solid in the simulation — a `decor` cell stops movement with `scenery.blocks`, the validator's reachability agrees, and M13's decorative stepping stones, which sat on the walking lane and rendered as cone trees the avatar walked through, were removed (the water blockers already define the lane); the goal beacon is unlit until the avatar stands on it and only then glows and casts light; the follow camera no longer snaps the focus to the click point on pointer-down, eases orbit/zoom toward input targets every frame, normalises wheel deltas across mouse and trackpad (pinch arrives as ctrl+wheel), supports two-finger pinch on touch, and sets `touch-action: none` so a touch drag orbits instead of scrolling; and the avatar speaks in a bubble on the scene — "Tell me where to go!" before a run, a first-person reason when a command is refused ("There's nothing here to pick up."), "I'm stuck here. What should I do now?" or "I stopped here. Is this the right place?" when a run ends short of the goal, and "We did it!" on success.

Follow-ups from the owner's screenshots: the interactable post was drawn dead-centre of a cell the avatar is meant to walk onto after using it, so she stood on top of it — the post now sits in the cell's corner over a floor plate that glows once used, so nothing solid is ever drawn where her body will be; the result banner could collapse to a sliver when the trace was expanded, because the fixed-height workspace grid was over-subscribed and the banner's `overflow: hidden` let its row shrink — the workspace is now content-sized with a fixed-height editor and the aside scrolls; scrollbars are thin and in the app's blues everywhere; and the camera's occlusion test, which was purely two-dimensional, now also requires the sight line to pass below a blocker's top, so an elevated camera looking over a low wall is no longer pulled in.

Mission completion is now a modal celebration (`CompletionDialog`, a native `<dialog>` like Settings and Onboarding): it opens 900 ms after success so the child sees the beacon light up first (immediately under reduced motion), carries the confetti, names the mission and the reward, asks the reflection question, and leads with "Next mission: …" as the focused primary action, with "Play this one again" and "Back to the map" beneath. Esc and a backdrop click dismiss it; the inline banner and its actions remain for after it is closed. The confetti was removed from the banner so the win is celebrated once.

Guidance is now concrete. `describeGuidance` in `packages/editor` turns the simulation's objective issues and the last refused command into the avatar's own next steps: which interactable has not been used ("I have not used the gate lever yet. Stand right in front of it and call interact()"), which item is still uncollected, why the last step was refused (a gate names the lever that opens it, a failed collect says to walk onto the item first), how far and in which direction the goal is with the exact turn needed ("3 cells east from me. I am facing north, so I need turnRight() first"), and whether turning is even available in this mission. The headline goes to the speech bubble and the full list replaces the generic "route stopped somewhere else" in the banner; five unit tests pin the wording. Collectibles were redrawn from a glittering sphere with its own light into a gold gem hovering and slowly turning over a marked ring — the classic pick-up cue — and the motion stops under reduced motion.


## Phase 12 — Release hardening and launch

**Goal:** prove the complete game is safe, stable, accessible, and supportable.

**Work:** run full progression, migration, corruption, import/export, offline/update, browser/device, low-quality, security, and license tests; complete WCAG 2.2 AA, keyboard, screen-reader, reduced-motion/flash, and child-copy audits; verify no analytics/accounts/ads/remote code/accidental network calls; complete launch-country privacy/legal review; freeze and tag content/API versions.

**Deliverables:** release candidate, quality-evidence pack, approvals, parent/teacher guide, support/rollback plan.

**Do not release until:** every Must requirement passes with evidence, critical security/accessibility issues are closed, and all 30 levels succeed on supported device tiers.

## Dependency map

```text
1 Constraints → 2 Spikes → 3 Foundation → 4 Contracts → 5 Simulation → 6 Runner
                                                              ↓
                                                   7 3D Greybox → 8 Learning Slice
                                                              ↓
                                                   9 Meadow MVP → 10 Playtest Lock
                                                              ↓
                                                   11 Zone Production → 12 Release
```

Phases 5 and 6 can run in parallel only after Phase 4 contracts lock. Phase 7 may consume stable simulation events but may not create new simulation rules. Phase 11 is sequential by zone so the next zone benefits from evidence from the previous one.

## Scope control: the v1 delivery boundary

The 12 phases deliver a local-first browser game with 30 authored missions, a third-person 3D avatar, a JavaScript learning editor, and local progress only. This scope is deliberately narrower than a general 3D game platform.

| Included in v1 | Explicitly excluded from v1 | Requires a new requirements decision |
|---|---|---|
| 30 authored missions, five zones, replay, optional local challenge goals | Procedural/open world, player-built public levels, user uploads | Any procedural generation or level sharing |
| Boy/girl 3D visual presets with equal mechanics | New character classes, stats, combat, health, violence | Any gameplay-affecting avatar variation |
| Restricted learning JavaScript API and browser sandbox | Device/file/network access, external packages, arbitrary browser `eval` | New player-code capability or global API |
| Local IndexedDB save, export/import, offline cached experience | Accounts, authentication, cloud sync, parent dashboard | Any remote persistence or server call |
| Personal best/optional challenge medals | Public leaderboards, social comparison, chat, multiplayer | Any social/competitive feature |
| Child-safe rewards, cosmetics, lore, local collection room | Ads, purchases, premium currency, loot boxes, streaks | Any monetization or retention mechanic |
| Keyboard/touch support where documented, accessibility baseline | Native mobile app, VR, console release | New platform target |

### Scope-change process

1. Write a decision record with the requested behavior, child benefit, technical cost, privacy/security impact, performance impact, affected phases, and tests.
2. Classify it as **clarification**, **small additive change**, or **scope expansion**. If it affects a locked contract, player data, code execution, platform, or child safety, it is scope expansion.
3. Do not start implementation until product, technical, curriculum, and safety owners approve the record.
4. Update the requirements, architecture, level design, plan, test matrix, and affected acceptance evidence together.
5. Re-run the earliest affected gate. For example, a new player-code API returns the work to Phases 4, 6, and 8—not merely Phase 11.

## Roles and required evidence

One person may hold multiple roles on a small team, but the responsibilities must remain separate in review.

| Role | Accountable for | Required sign-off evidence |
|---|---|---|
| Product owner | v1 scope, priority, launch choice, exclusions | Approved decision records and phase gates |
| Technical lead | architecture, performance, security boundaries, migrations | Design review, benchmarks, threat-model/test results |
| Gameplay engineer | simulation, event contracts, level validator | Determinism and integration test evidence |
| 3D engineer/artist | avatar/camera/object readability, asset budgets | Device capture, occlusion and low-quality checks |
| Curriculum designer | learning progression, examples, hints, reading level | Lesson rubric and child-test observations |
| UX/accessibility owner | controls, focus, copy, sensory comfort, recovery | Keyboard/screen-reader/reduced-motion evidence |
| QA owner | regression plan, device matrix, release evidence | Signed test run and known-issue list |
| Privacy/legal reviewer | child data, jurisdiction, asset/license posture | Approved privacy/asset review before launch |

## Cross-phase workstreams

These workstreams continue across phases; they are not “done once” tasks.

| Workstream | Starts | Continues through | Mandatory output |
|---|---:|---:|---|
| Decision records | 1 | 12 | Dated, approved decisions and reversibility note |
| Security/threat model | 2 | 12 | Updated trust boundaries and hostile-test suite |
| Accessibility | 1 | 12 | Requirement mapping, manual test evidence, defects |
| Performance | 2 | 12 | Device measurements, asset budgets, regression trends |
| Curriculum/content | 1 | 11 | Lesson map, level packages, examples/hints, child observations |
| Local data/migrations | 2 | 12 | Versioned schemas, migration fixtures, recovery tests |
| Asset/license register | 3 | 12 | Source, license, attribution, file size, approval state |
| Release evidence | 3 | 12 | Traceable gate checklist, known-issue register, release notes |

## Phase-by-phase scope ledger

This ledger is the operational supplement to the phase descriptions above.

### Phase 1 ledger — constraints

**Entry:** requirements and level-design documents exist.
**In scope:** device/browser matrix; target learner definition; legal jurisdictions; metrics; v1 exclusions; owner assignments.
**Out of scope:** selecting a game engine by preference; writing missions; production assets; implementation code beyond the existing starter.
**Evidence:** signed DR backlog, device matrix, measurement plan, privacy boundary statement.
**Exit handoff:** approved constraints delivered to Phase 2 spike owners.

### Phase 2 ledger — proof spikes

**Entry:** Phase 1 constraints and test devices are available.
**In scope:** throwaway experiments only: 3D greybox, editor, save, runner, and performance measurements.
**Out of scope:** polished art, map, progression, full route structure, reusable feature abstractions.
**Evidence:** reproducible spike repos/branches, recorded device results, ADRs selecting/rejecting options.
**Exit handoff:** measured configurations and a list of hard limits to Phase 3–4.

### Phase 3 ledger — engineering foundation

**Entry:** chosen stack and accepted hard limits.
**In scope:** package boundaries, tooling, CI, test harnesses, code conventions, fixtures, developer docs.
**Out of scope:** gameplay behavior, visual polish, content expansion, cloud deployment.
**Evidence:** a clean-environment CI log, dependency-boundary check, baseline bundle report.
**Exit handoff:** stable workspace for Phase 4 contracts.

### Phase 4 ledger — contracts

**Entry:** test tooling and project boundaries exist.
**In scope:** schemas, ID policy, event protocol, API manifest, save versions, level format, reward links, migration policy.
**Out of scope:** renderer logic, animation state machines, unversioned content fields, convenience shortcuts that bypass validation.
**Evidence:** schema tests, M01 data fixture, documentation generated from the contract.
**Exit handoff:** versioned contracts that Phases 5 and 6 implement independently.

### Phase 5 ledger — simulation

**Entry:** Phase 4 data/API contracts are frozen for the first zone.
**In scope:** pure deterministic state transitions, validation, trace, reset/replay/step, tests.
**Out of scope:** Three.js transforms, audio, UI state, persistence I/O, direct editor integration.
**Evidence:** headless replay suite, command branch coverage, M01–M06 expected traces.
**Exit handoff:** immutable run events consumed by renderer and coordinator.

### Phase 6 ledger — runner

**Entry:** Phase 4 command/message contracts are frozen.
**In scope:** isolated runtime, capability API, resource limits, cancellation, protocol validation, error mapping.
**Out of scope:** scene rendering, browser privileges, user file/network access, adding APIs because a mission seems easier.
**Evidence:** hostile-code suite, time/memory measurements, threat-model review, isolation test report.
**Exit handoff:** trusted command stream for coordinator only.

### Phase 7 ledger — 3D greybox

**Entry:** stable simulation events and measured rendering choice.
**In scope:** one arena, avatar/controller visuals, camera, minimap, occlusion, quality tiers, event-to-animation mapping.
**Out of scope:** final zone art, complex NPC behavior, physics puzzles, any renderer-owned rule.
**Evidence:** target-device video/captures, FPS/memory chart, trace/animation synchronization tests.
**Exit handoff:** reusable scene components that obey the Phase 5 event contract.

### Phase 8 ledger — learning slice

**Entry:** command stream and greybox scene work.
**In scope:** real editor, diagnostics, controls, briefing, hints, examples, planning, errors, accessible UI, M01 learning flow.
**Out of scope:** all 30 lessons, broad reward system, parent account, open-ended code APIs.
**Evidence:** first-time usability script, keyboard and touch results, code-to-world understanding observations.
**Exit handoff:** a complete M01 behavior pattern for content creators.

### Phase 9 ledger — Meadow MVP

**Entry:** M01 vertical slice passes the Phase 8 gate.
**In scope:** M01–M06, onboarding, map entry, settings, local persistence, rewards, offline/cache, recovery, first-zone art/audio.
**Out of scope:** later zones, public competition, native app release, full collection/creative mode.
**Evidence:** end-to-end test logs, save/recovery cases, offline build result, child-facing acceptance checklist.
**Exit handoff:** playable test build for Phase 10 research.

### Phase 10 ledger — research lock

**Entry:** an end-to-end Meadow build and approved participant/consent process.
**In scope:** moderated sessions, observation, issue classification, fixes to existing first-zone patterns, convention updates.
**Out of scope:** interpreting retention telemetry, scaling content before evidence, changing scope for individual preference without a decision record.
**Evidence:** anonymized session notes, issue list, before/after fixes, updated authoring handbook.
**Exit handoff:** proven conventions and a prioritized production backlog.

### Phase 11 ledger — zone production

**Entry:** Phase 10 conventions are locked.
**In scope:** M07–M30 in four sequential zones, content-validator tooling, zone-specific art/audio/rewards, migration work for intentional new APIs.
**Out of scope:** unplanned mechanics, features not reusable by at least one current lesson, “fix it later” blocked routes.
**Evidence:** one complete level package per mission, valid traces, accessibility/copy review, budget report, zone playtest result.
**Exit handoff:** a complete release candidate after M30 passes its zone gate.

### Phase 12 ledger — launch

**Entry:** all content zones have signed acceptance evidence.
**In scope:** regression, device/browser matrix, security, privacy/legal, licensing, install/offline/update, support and rollback.
**Out of scope:** new gameplay, new API, new platform, untested visual overhaul.
**Evidence:** release checklist, issue disposition, version tags, signed approvals, known-limitation statement.
**Exit handoff:** production release or explicit no-go decision.

## Acceptance evidence index

Every gate needs durable evidence rather than an oral “looks good.” Store it under a versioned `docs/evidence/` location when implementation begins.

| Evidence ID | Required artifact | Used by phases |
|---|---|---|
| E-01 | Supported-device/browser matrix and benchmark protocol | 1, 2, 7, 12 |
| E-02 | Architecture and decision-record log | 1–12 |
| E-03 | Schema/API/save contract test report | 4, 5, 6, 11, 12 |
| E-04 | Deterministic replay and validator report | 5, 7, 9, 11, 12 |
| E-05 | Runner threat model and hostile-code results | 6, 9, 12 |
| E-06 | 3D camera/animation/performance capture | 7, 9, 11, 12 |
| E-07 | Accessibility test checklist and defect resolution | 1, 8–12 |
| E-08 | Child-playtest observation summary and fixes | 9–11 |
| E-09 | Save/offline/import/migration recovery report | 2, 9, 11, 12 |
| E-10 | Asset license and content approval register | 3, 9, 11, 12 |

## Backlog sizing and sequencing rules

- A ticket may span **one package boundary only**. Split a ticket that changes editor, runner, simulation, and renderer into a contract ticket plus individual consumers.
- A mission ticket is not “done” until its data, validator, valid traces, copy, hints, example, reward, accessibility notes, and test cases exist together.
- A visual asset ticket includes its source/license, mesh/texture budget, LOD/quality behavior, collision/interaction classification, and screenshot review.
- A new code API ticket includes its lesson, syntax example, completion/lint documentation, sandbox capability decision, runner test, simulation behavior, saved-code version plan, and hostile-input cases.
- Limit active work to one cross-cutting foundation item and one content/visual item per owner; avoid starting the next zone during unresolved playtest fixes.

## Release readiness questions

Before moving from any major milestone, answer these questions in writing:

1. What exact player behavior is now supported, and what is still intentionally unsupported?
2. What simulation state changes, and what component is authoritative for each change?
3. What happens on error, cancellation, pause, reload, device slowdown, storage failure, and offline launch?
4. Can a child understand the next action without adult intervention or reading hidden technical detail?
5. Is the same experience accessible without color-only cues, animation, sound, mouse precision, or fast typing?
6. Which saved data changes, how is it migrated, and how can the player recover it?
7. Which test, device capture, or child observation proves the work meets its gate?

If a question cannot be answered, the work is not ready to move forward.
