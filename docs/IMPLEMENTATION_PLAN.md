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

## Phase 4 — Domain contracts and content schema

**Goal:** define the stable language used by authors, simulation, renderer, editor, and saves.

**Work:** define runtime schemas for levels, maps, objects, goals, rewards, hints, examples, and copy; define typed IDs, state, commands, events, validation results, settings, and saves; define content/API/save versioning; encode the `MissionPackage` contract from the level design; model M01 entirely as data with completion invariants, concept evidence, known solutions, and failure fixtures; add a development-only Level Lab that discovers those fixtures from the content registry.

**Deliverables:** schema package, sample `level.json`, content handbook, migration policy, and a traceability report from every M01 field to its consumer and test.

**Tests:** invalid IDs, duplicate objects, unreachable goals, missing hints/examples, unknown rewards, incompatible API versions, and malformed imports fail validation.

**Do not proceed until:** M01 requires no level-specific UI code.

**Status:** Implementation complete. Domain schemas in `packages/domain/src/{ids,ids-schemas,cells,commands,mission-objects,mission-package}.ts`. Persistence in `packages/persistence/src/{schemas,migrations}.ts`. Content registry + M01 fixture in `packages/content/src/{registry,missions/m01-first-steps,validation}.ts`. Handbook at `docs/content/HANDBOOK.md`. Traceability at `docs/evidence/phase-4/E-03-contract-test-report.md`. Test totals: domain 29, persistence 14, content 9, test-fixtures 16.

## Phase 5 — Deterministic simulation engine

**Goal:** implement game rules without 3D graphics.

**Work:** implement pure reducers for spawn/move/turn/collect/interact/reset/objective validation; implement collision, facing, interaction range, object state machines, and snapshots; generate trace entries with command ID, source line, before/after state, and child-readable reason; implement replay and Step.

**Deliverables:** simulation package, validator adapter, development trace viewer, M01–M06 reference traces.

**Tests:** every command/result branch, pause/step/restart, repeat collect, exact replay, and 30/60-FPS-independent outcomes.

**Do not proceed until:** headless M01 has byte-for-byte equivalent trace and end state on replay.

**Status:** Implementation complete. Simulation package (`packages/simulation`) ships `createSimulation`, `reduceCommand`, `replayCommands`, `createSnapshotStore`, `validateMissionObjectives`. M01 reference traces replay deterministically; 19 tests cover every command branch. Dev-only trace viewer at `/spikes/phase-5`. Report at `docs/evidence/phase-5/E-04-simulation-trace-report.md`.

## Phase 6 — Secure player-code runner

**Goal:** allow JavaScript learning logic without exposing browser/app/local data.

**Work:** build runner protocol, fresh-runtime lifecycle, budgets, cancellation, frozen learning API, and coordinator-side message validation; map faults to source line, child copy, technical detail, and next action; dispose runtime on every exit path.

**Deliverables:** runner package, API capability manifest, threat model, hostile-code fixtures.

**Tests:** infinite loop, recursion, allocation growth, blocked globals, malformed command, bad arguments, double Run, Pause during run, and route exit during run.

**Do not proceed until:** hostile fixtures cannot freeze UI, access browser capability, mutate simulation directly, or leak between runs.

**Status:** Implementation complete. `packages/code-runner` ships `protocol.ts` (Zod schemas + parseHost/parseWorker + capability manifest), `capabilities.ts` (mission→allow-list), `coordinator.ts` (worker→simulation reducer with lifecycle), `fault-mapping.ts` (runFault + child-copy presentation), `worker.ts` (sandboxed QuickJS host with memory + stack + interrupt budgets, lifecycle resource cleanup). 29 tests cover protocol, fault-mapping, and 10 hostile-fixture scenarios including double Run, Pause, Step, and route-exit cancel. Dev-only runner lab at `/spikes/phase-6`. Threat model at `docs/evidence/phase-6/E-05-runner-threat-model.md`; hostile-code report at `docs/evidence/phase-6/E-06-hostile-code-report.md`.

## Phase 7 — 3D greybox and camera/animation contract

**Goal:** make code execution legible as third-person 3D action.

**Work:** implement the React Three Fiber scene adapter, perspective streets and trails, third-person follow camera, shared avatar rig, boy and girl low-poly mesh presets, controller capsule, objects, blockers, and minimap from simulation data. Add WASD, arrow, touch, and camera controls for Preview only. Reset the authored scene before Code mode and map command IDs to movement and animation states. Implement camera collision, Coding View, strategic view, camera reset, reduced-motion behavior, low-quality tier, and responsive layout. Enforce object and asset budgets.

**Deliverables:** complete WebGL street or trail greybox, articulated avatar proxy, production rig contract, animation contract, camera test matrix, and performance dashboard.

**Tests:** pause in every animation state, repeat Run, low FPS, camera occlusion, narrow layout, keyboard-only, and reduced motion.

**Do not proceed until:** avatar, minimap, trace, line highlight, and simulation agree on current command; quality tier never changes outcome.

**Status:** Implementation complete. `packages/renderer` ships the scene adapter (`SceneCanvas`, `SceneView`), shared avatar rig (`AvatarRig` with boy/girl presets), follow camera rig (`FollowCameraRig` with coding/strategic/preview modes + blocker occlusion + reset), mission object registry (`MissionObjectLayer` for every kind in the discriminated union), semantic minimap (`Minimap` SVG with avatar facing + collected/flags projection), preview controls (`PreviewControls` with WASD/arrow + touch pad), quality tier (`qualityTier` low/medium/high with reduced-motion probe + responsive layout helpers), animation contract (`commandAnimationSystem` mapping `RunEventSchema` → `AvatarMovementState` + active command marker), and world transform helpers (`worldTransform`). 28 renderer tests cover animation contract, quality resolution, world transform, minimap projection, and preview key binding. Dev-only greybox lab at `/spikes/phase-7`. Greybox + animation report at `docs/evidence/phase-7/E-07-greybox-animation-report.md`. The renderer consumes only `@codequest/domain` and never reaches into `simulation` or `content` internals (boundary check passes, 79 files scanned). Avatar, minimap, trace, and simulation agree on the current command via `deriveAnimationState(events, state)` which walks the same `RunEventSchema` stream the coordinator publishes.

## Phase 8 — Learning/editor vertical slice

**Goal:** connect child intent, code, and visible world result.

**Work:** configure CodeMirror; add API docs, completion, lint, undo/redo, Run/Pause/Step/Reset, speed, trace, errors, and route preview; add briefing, examples, progressive hints, planning cards, recap, and reflection; distinguish Reset Scene from Reset Code; save local drafts.

**Deliverables:** fully instrumented M01 with success, failure, retry, and accessibility paths.

**Tests:** first-time player identifies goal, facing, Run, Pause, Reset Scene, and Reset Code without adult instruction.

**Do not proceed until:** internal usability review shows a player can explain `moveForward()`.

## Phase 9 — Meadow of Moves MVP

**Goal:** deliver M01–M06 as one polished offline zone.

**Work:** author/greybox/test M01–M06 before art; implement onboarding, map, rewards, settings, collection preview, progress, export/import, recovery, service-worker caching, and offline/update states; complete accessibility, local-data, performance, and security checks.

**Deliverables:** first installable zone, six mission packages, local save/backup/recovery flows.

**Tests:** fresh player → onboarding → M01–M06 → close/reopen → replay → export/import → storage failure → recovery.

**Do not proceed until:** child playtests meet first-mission completion, independent-next-action, and error-recovery targets with no critical accessibility issue.

## Phase 10 — Playtest, revise, and lock conventions

**Goal:** stop unvalidated Meadow patterns from multiplying into 24 more levels.

**Work:** run moderated child playtests; record misunderstanding of camera, minimap, ordering, errors, hints, rewards, and resume flows; prioritize by safety/learning blockage/repetition; revise M01–M06 and update templates, camera contract, copy style, hint model, API guide, and asset rules from evidence.

**Deliverables:** playtest report, prioritized fixes, locked authoring conventions, updated decisions.

**Do not proceed until:** repeated critical confusion is fixed or explicitly accepted with evidence. Bulk content production is prohibited before this gate.

## Phase 11 — Scalable content production

**Goal:** build the remaining zones without content debt.

**Work:** build validators for schema, prerequisite, IDs, solvability, known traces, localization, budgets, and rewards. Produce each batch in order: Echo Forest M07–M12, Loop Lagoon M13–M18, Logic Cliffs M19–M24, Maker Observatory M25–M30. Each batch follows lesson design → greybox → valid-solution tests → accessibility/copy → playtest → art/audio → performance → lock. Version every new API and run saved-code migration tests.

**Deliverables per zone:** six mission packages, map/reward changes, valid traces, performance/playtest report.

**Do not proceed to the next zone until:** no progression dead end exists, two valid solutions pass where intended, and current-zone child tests meet comprehension/recovery targets.

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
