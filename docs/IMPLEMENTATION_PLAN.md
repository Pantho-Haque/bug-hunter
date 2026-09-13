# CodeQuest 3D — Implementation Plan

This plan follows the requirements, 30-level design, and architecture documents. Each phase ends with a working, testable checkpoint; do not begin a dependent phase while its gate is unresolved.

## 1. Foundation and decisions

1. Confirm browser/device support, 3D renderer choice, code-runner model, cell size/collision, first-zone reading level, and legal launch scope (DR-01 through DR-06).
2. Keep this starter’s Vite/React/TypeScript shell; add tooling only when a phase needs it.
3. Add linting, formatting, unit-test, and browser-test configuration.
4. Define source layout and package boundaries from `IMPLEMENTATION_ARCHITECTURE.md`.

**Gate:** build/lint/test runs locally; target laptop/tablet is identified.

## 2. Deterministic game core

1. Define schemas for levels, cell maps, objects, player state, commands, run events, rewards, and save data.
2. Implement pure movement, turns, blockers, collect/interact state machines, reset, and completion validation.
3. Write unit tests for each command and failure outcome; replay the same trace at different frame rates.
4. Add a command-trace timeline before adding animation.

**Gate:** a headless M01 has identical results on every run.

## 3. Safe player-code runner

1. Build the runner message protocol and capability-limited game API.
2. Add execution, command, time, memory, cancellation, and error contracts.
3. Isolate player code from DOM, network, browser storage, and application state.
4. Test timeouts, loops, malformed programs, unsupported APIs, and repeated Run/Pause/Reset.

**Gate:** untrusted code cannot freeze the UI or access browser capabilities.

## 4. First real 3D vertical slice

1. Add Three.js/React Three Fiber only after the greybox performance spike passes.
2. Build one third-person arena: camera rig, cell grid, avatar controller, beacon, blocker, collectible, and minimap.
3. Connect visual movement/animation to simulation command IDs; add Coding View, Step, Pause, and Reset Scene.
4. Replace the starter textarea with CodeMirror, API completion, lint feedback, line highlighting, and local draft save.

**Gate:** M01–M06 are fully playable offline in the real 3D scene with keyboard, reduced motion, and low-quality paths.

## 5. Product shell and local experience

1. Build avatar onboarding, map, zone/level cards, settings, help, collection room, recovery, and import/export flows.
2. Persist settings, progress, and per-level code as separate versioned records in IndexedDB.
3. Add service-worker caching and clear offline/update states.
4. Implement child-readable error/recovery states and accessibility audit fixes.

**Gate:** a fresh player can complete Meadow, close the app, resume, export progress, and recover safely from a corrupted save.

## 6. Content authoring pipeline

1. Create level-data templates and content validation scripts.
2. Require starter code, valid traces, hints, analogous example, copy keys, accessibility notes, reward, and performance report for each level.
3. Greybox, test, and playtest M07–M12; then add art/audio only after learning flow works.
4. Repeat by zone for M13–M18, M19–M24, and M25–M30.

**Gate per zone:** all missions have two valid solutions where intended, no progression dead end, and moderated child playtests show acceptable comprehension/recovery.

## 7. Release hardening

1. Run save migration, offline, import, security, accessibility, device-performance, and full progression tests.
2. Verify no analytics, accounts, ads, remote code, or accidental network calls appear in the v1 build.
3. Perform legal/privacy and asset-license review for launch countries.
4. Freeze content/API versions; document supported browsers and known limitations.

**Gate:** all release requirements in `GAME_REQUIREMENTS_TEARDOWN.md` pass with evidence.
