# CodeQuest 3D — Implementation Architecture

This document defines the technical boundaries that implement the [feature specification](FEATURE_SPEC.md). It describes the target release architecture, not the current Starter shell.

Use the [component architecture](COMPONENT_ARCHITECTURE.md) for the production component tree, source placement, ownership rules, and requirement-to-component mapping.

## 1. Decision summary

Build the first release as one **offline-first TypeScript web application**: Vite + React + React Three Fiber/Three.js for presentation, CodeMirror 6 for the editor, a small deterministic simulation engine owned by the project, IndexedDB for saves, and an isolated code-runner worker/iframe boundary. There is no backend, account, database server, or router-driven API in v1.

This recommendation deliberately avoids a general game engine, a full server framework, multiplayer, physics engine, global state megastore, and a cloud code execution service. The product is a finite, authored coding-puzzle game; those additions create integration and security work before they create player value. React Three Fiber is a declarative React renderer for Three.js, while retaining direct access to Three.js capabilities.[^1] CodeMirror supplies separately configurable JavaScript support, lint gutters, autocomplete, undo history, and keymaps.[^2]

### Chosen stack

| Layer | Choice | Why it reduces chaos | Do not use it for |
|---|---|---|---|
| Language/build | TypeScript, Vite, pnpm | Fast local iteration; one typed language for UI, content, simulation, and tests. Vite can import workers directly.[^3] | Server rendering or a backend. |
| App UI | React | Clear component boundaries for menus, HUD, editor, settings, dialogs, and accessibility. | Per-frame game-state updates. |
| 3D presentation | Three.js + React Three Fiber; Drei only for audited utilities | Declarative scene composition alongside UI; standard Three.js escape hatch. | Simulation truth, gameplay validation, or persistence. |
| Game simulation | Custom pure TypeScript reducer/state machine | Deterministic grid commands are simpler and safer than physics/navmesh. | Rendering transforms or React state. |
| Editor | CodeMirror 6 + `@codemirror/lang-javascript` + custom completion/lint adapters | Modular, focused, browser-native editor; custom game API help is easy to own. | Executing code. |
| Player-code execution | Dedicated code-runner worker using QuickJS compiled to WebAssembly; host-defined capability API | Resource limits and interrupt handler are available in QuickJS documentation.[^4] Isolates user program from DOM/app. | Full browser sandbox guarantee by itself; use CSP and origin separation too. |
| Persistent data | IndexedDB via a thin repository layer; localStorage only for tiny boot preference if needed | Async, structured, versionable saves and recovery snapshots. | Cross-device sync. |
| Offline | Service worker/Cache Storage with explicit versioned asset manifest | Installed app shell and content work after first load. | Hiding a failed update. |
| Tests | Vitest unit/contract tests; Playwright end-to-end; manual target-device performance QA | Tests pure rules independently of 3D, then validates full child path. | Replacing playtests with children. |

### Rejected for v1

- **Unity/Unreal/Godot web export:** viable later, but adds a separate primary language/editor/runtime and makes the embedded code editor/local-first browser UX more complex. Reconsider only if the required art/animation scope exceeds web performance after the greybox spike.
- **Next.js/full backend:** no server-side user value exists in v1; it adds deployment, auth, API, and privacy surface.
- **Rapier/physics-first movement:** the learning game needs deterministic one-cell code outcomes, not emergent physics.
- **Monaco + language server:** powerful but heavier and operationally unnecessary for a restricted learner API. Start with CodeMirror’s custom completions/lint. 
- **`eval`, `new Function`, or same-window execution:** prohibited. A sandboxed iframe must not combine `allow-scripts` and `allow-same-origin` for same-origin content, because it can undermine sandbox protection.[^5]

## 2. Architectural principles

1. **Simulation is truth.** The renderer, animation, minimap, HUD, trace, and validator receive immutable simulation events; none may alter a mission result.
2. **One-way data flow.** User intent → application coordinator → simulation/code runner → typed events → presentation/save. Do not let 3D components directly mutate save or mission state.
3. **Content is data.** Levels have declarative metadata and validators. Do not encode a level’s answer in a React component.
4. **No hidden behavior.** Engine defaults, random values, collision rules, API version, and asset budget are explicit in content/build configuration.
5. **Trust boundaries are real.** Player code, import files, cached content, and future remote content are untrusted inputs.
6. **Small public interfaces.** Every package exports a narrow contract; forbid cross-feature imports into internal state.

## 3. Repository layout

```text
codequest/
  apps/web/                       # Vite app shell and browser entry
    src/routes/                   # URL routes / route loaders only
    src/features/                 # page-level UI orchestration
    src/styles/
  packages/
    domain/                       # types, IDs, schemas, pure rules
    simulation/                   # reducer, command queue, validator adapter
    content/                      # level definitions, examples, hints, copy
    renderer/                     # R3F scene, camera, avatar, object adapters
    editor/                       # CodeMirror setup, diagnostics, API docs
    code-runner/                  # worker protocol, QuickJS adapter, limits
    persistence/                  # IndexedDB repos, migrations, import/export
    ui/                           # accessible shared HTML components
    test-fixtures/                # sample levels and expected traces
  public/assets/                  # versioned static assets / manifest
  e2e/                            # Playwright flows
  docs/                           # ADRs, asset budget, content handbook
```

Dependency direction is strict: `domain` has no browser/React/Three imports; `simulation` depends only on `domain`; `content` depends only on `domain`; `renderer`, `editor`, and `persistence` consume domain contracts; `apps/web` composes packages. CI rejects dependency cycles and disallowed imports.

## 4. Runtime architecture

```text
Browser route/page
  ├─ React UI shell ───── Settings / HUD / CodeMirror / dialogs
  ├─ Scene adapter ────── R3F Canvas / camera / avatar / objects / minimap
  ├─ Game coordinator ─── owns run lifecycle and app state
  │    ├─ Simulation ──── pure state + command reducer + validator
  │    ├─ Content repo ── level data / copy / known-valid tests
  │    ├─ Save repo ───── IndexedDB records + migrations
  │    └─ Runner bridge ─ typed messages only
  └─ Code runner worker ─ QuickJS runtime, memory/stack/time budgets,
                           no DOM/network/storage; emits approved commands
```

### Run lifecycle

1. Route loads level metadata, checks prerequisites/API version, and requests assets.
2. Coordinator creates a fresh simulation from `level.startState` and a run ID.
3. Editor source is linted and saved with debounce; Run is disabled only for fatal syntax/configuration errors.
4. Coordinator sends source, allowed API manifest, execution limits, and run ID to the runner bridge.
5. Runner executes program and emits `CommandRequested` messages. It cannot touch the scene or save data.
6. Coordinator validates each command against allowed API/state, passes it to pure simulation, receives `CommandApplied`/`CommandRejected` event.
7. Renderer subscribes to events and plays animation for that command ID; HUD/minimap/code-line trace update from same event.
8. When code finishes or budget is exceeded, coordinator flushes animations/trace, evaluates mission validator, persists current code/progress atomically, and displays outcome.
9. Pause/cancel terminates current runner and discards only unfinished run state; saved code and last completed level state remain intact.

### Important implementation boundary

Do not make the 3D avatar movement itself asynchronous game logic. The simulation updates logical cell/facing immediately for each accepted command. The renderer then interpolates to it. A command ID associates line number, simulation event, animation, audio, minimap update, and trace entry. This prevents frame rate or animation delay from changing a coding result.

## 5. Route map

Use React Router in browser history mode. Routes are deep-linkable only when the needed level is installed; route guards redirect safely to the map with a child-readable reason. No sensitive data appears in URLs.

| Route | Screen and responsibility | Loader / guard | Main components |
|---|---|---|---|
| `/` | Boot/restore screen; chooses onboarding or map | Restore settings/progress, check migrations/cache | `BootScreen`, `StorageRecoveryDialog` |
| `/onboarding/avatar` | Boy/girl 3D avatar selection and comfort defaults | Only fresh profile or explicit settings edit | `AvatarPreviewScene`, `AccessibilityDefaults` |
| `/map` | 3D/illustrated world map and progress | Requires valid local profile; available offline | `WorldMap`, `ZoneCard`, `MapLegend` |
| `/zone/:zoneId` | Zone detail: concepts, missions, rewards | Validate zone ID and prereqs | `ZoneOverview`, `MissionList` |
| `/level/:levelId` | Core split playground/editor experience | Validate content, asset readiness, prereqs, save migration | `GameShell`, `SceneCanvas`, `ThirdPersonController`, `AvatarRig`, `MissionHUD`, `CodeEditor`, `RunControls`, `Minimap`, `HelpDrawer` |
| `/level/:levelId/briefing` | Deep-linkable pausing mission briefing overlay | Same level guard | `MissionBriefingDialog` |
| `/level/:levelId/complete` | Completion recap and next-choice overlay | Requires last completed run matching level | `CompletionDialog`, `ReflectionCard` |
| `/collection` | Local cosmetics, lore, and earned rewards | Valid profile | `CollectionRoom`, `AvatarPreviewScene` |
| `/settings` | All local settings categories | Valid profile; no network required | `SettingsHome`, category panels |
| `/settings/data` | Export/import/clear storage | Valid profile; destructive actions confirmed | `BackupPanel`, `ImportPreview`, `ClearDataDialog` |
| `/help` | API reference, controls, accessibility, parent/teacher local note | None | `ApiReference`, `ControlsGuide` |
| `/recovery` | Safe fallback for migration/storage/content errors | Always reachable | `RecoveryScreen`, `ExportRawBackup` |
| `*` | Unknown route fallback | None | `NotFoundRedirect` → `/map` |

Route state is navigation state only. The simulation run remains in coordinator memory while `/level/:levelId` is mounted; saved data is not passed through route state. Modal routes may render as overlays, but Back must close the overlay without throwing away code.

## 6. Data contracts

Use Zod (or equivalent runtime schemas) at every file/message boundary. IDs are branded strings in TypeScript; never use display text as identifiers.

```ts
type LevelId = string;
type Direction = 'north' | 'east' | 'south' | 'west';
type AvatarState = { cellX: number; cellZ: number; facing: Direction };
type RunEvent =
  | { type: 'commandApplied'; commandId: string; sourceLine: number; command: GameCommand; before: SimState; after: SimState }
  | { type: 'commandRejected'; commandId: string; sourceLine: number; reasonKey: string }
  | { type: 'runFault'; code: 'timeout' | 'memory' | 'syntax' | 'blockedApi'; sourceLine?: number };
```

Core persistence records:

| Store | Key | Contents | Rules |
|---|---|---|---|
| `settings` | `current` | UX/accessibility/avatar preset values | No PII, no behavioral analytics. |
| `progress` | `current` | completed levels, unlocked reward IDs, current map location | Versioned + recovery snapshot. |
| `levelCode` | `levelId:apiVersion` | source, cursor/selection optional, edit timestamp | Debounced save, size cap, validate on import. |
| `backups` | timestamp | export/recovery snapshots | One local rolling snapshot + explicit exports. |
| `contentMeta` | content version | installed content/asset manifest version | Used for migration/cache decisions. |

## 7. Code runner and security flow

The runner is an implementation risk, so it is built and reviewed before polish work. QuickJS provides documented memory, stack, and interrupt-handler controls, but those controls are only part of the defense.[^4]

1. Build a worker bundle that contains only QuickJS/WASM, an RPC protocol, and the approved game API shim.
2. Run it from a restricted origin/sandbox where feasible; apply strict CSP to main app and runner assets.
3. Construct a fresh runtime/context for every Run; set memory/stack limits and interrupt deadline.
4. Provide only frozen API functions that emit a validated command request; no globals for `fetch`, DOM, storage, navigation, timers, imports, dynamic module loading, or host object references.
5. Validate inbound/outbound message schemas, run ID, command enum, argument count/types, source range, and per-run command budget in the coordinator.
6. Terminate/dispose runtime on completion, cancel, timeout, memory breach, or route change.
7. Map technical errors to child copy and source location; retain technical details in a collapsible panel only.
8. Test hostile snippets: infinite loop, recursive growth, huge allocation, prototype manipulation, attempted network/storage/DOM access, malformed import, and repeated Run/Pause.

Do not claim absolute arbitrary-code safety until an external security review validates the final browser deployment. The product promise remains “write any JavaScript logic supported by the learning sandbox.”

## 8. Implementation sequence

These checkpoints explain technical dependency order. The [implementation plan](IMPLEMENTATION_PLAN.md) is authoritative for phase numbers, delivery gates, and release scheduling.

### Phase 0 — decisions and proof spikes

1. Record DR-01 through DR-06 from the requirements document.
2. Greybox a 6×6 cell arena with one avatar, one camera, one collectible, and a minimap on target school laptop/tablet.
3. Spike R3F scene loading, CodeMirror completion/lint, IndexedDB save/recovery, and code runner separately.
4. Set final device/asset budgets from measured results; reject unsupported targets explicitly.

**Exit:** M01 is possible end-to-end with hard-coded commands, 30 FPS minimum tier, no UI lockup, and accessible pause/reset.

### Phase 1 — pure game core

1. Define schemas for level, object, command, simulation state, result, save, and runner messages.
2. Implement pure reducer: movement, turns, collision, interaction state machines, collection, reset, validator hooks.
3. Add deterministic seeded test fixtures for every command and failure mode.
4. Build run coordinator and command-ID trace; no 3D animation dependency.

**Exit:** Command traces and validator results are identical in unit tests and a headless browser run.

### Phase 2 — playable vertical slice

1. Add R3F canvas, third-person camera, avatar controller/animation adapter, level-object renderer, Coding View, and minimap.
2. Bind renderer only to `RunEvent` stream; add pause/step/speed/restart.
3. Implement CodeMirror with highlights, autosave, API completion, lint diagnostics, line focus, and child-friendly error panel.
4. Build QuickJS runner bridge and all abuse/cancellation tests.
5. Implement M01–M06 as the first content pack, including briefings, examples, hints, rewards, and export/import.

**Exit:** A child can complete Meadow from fresh boot offline; save/reload, low quality, keyboard, and reduced-motion paths pass.

### Phase 3 — product shell and quality

1. Build onboarding, map, zone cards, settings, collection room, help, recovery, and PWA install/update UI.
2. Add content author validation CLI: schema, duplicate IDs, unreachable cells, solvability, known-solution trace, localization keys, object budgets, and asset manifest checks.
3. Add E2E flows for onboarding, run, error recovery, pause, import/export, storage failure, and completion.
4. Run moderated child tests; fix observed navigation/confusion before adding new zones.

**Exit:** MVP quality gate in requirements document passes with M01–M06.

### Phase 4 — curriculum scaling

1. Author missions M07–M30 in zone batches, never all at once.
2. For each batch: greybox → valid solution tests → accessibility → playtest → art/audio → performance check → content lock.
3. Introduce API functions only with the documented lesson, update API version and editor docs, and rerun all saved-code migrations/tests.
4. Ship a content update only after map, assets, saves, and all prerequisite links validate together.

**Exit:** 30 playable levels, all core progression/recovery/accessibility tests pass, and no cloud features are introduced without a new requirements review.

## 9. Test strategy and release gates

| Layer | What to test | Minimum gate |
|---|---|---|
| Domain/simulation | Reducer, collisions, turns, state machines, validators, serialization | 100% of command/result branches; deterministic replay fixtures. |
| Content | Schema, IDs, prereqs, reachable goal, known solutions, hint/example presence | Every level validates in CI. |
| Runner | Limits, API allowlist, cancellation, hostile-code cases, source locations | No UI freeze or prohibited capability access. |
| Renderer | Camera occlusion, avatar state events, object state mapping, low quality | Same simulation outcome across quality/FPS tiers. |
| UI/accessibility | Keyboard, focus, dialogs, text scale, contrast, captions, reduced motion | WCAG 2.2 AA review plus manual screen-reader pass. |
| E2E | Fresh player through M01–M06, save/reload, import/export, offline, recovery | Green on supported browsers/devices. |
| Human validation | Child comprehension, frustration recovery, reading load, parent/teacher clarity | Moderated test evidence before expanding each zone. |

## 10. Operational rules

- Pin dependency versions and update them in dedicated maintenance pull requests after test suite/security scan passes.
- Keep 3D binary assets out of feature-code commits where possible; version them through an asset manifest with size/hash checks.
- Add an Architecture Decision Record for any new package, cross-package dependency, browser permission, remote call, new game API, or cloud feature.
- Never add analytics/ads/remote configuration as a shortcut for debugging. Use local development diagnostics and consented moderated research.
- Keep a performance budget dashboard in CI for JS bundle, level asset pack, and mission object count; fail build on regression beyond agreed tolerance.

## Sources

[^1]: React Three Fiber. [“Introduction.”](https://r3f.docs.pmnd.rs/) Accessed September 2026.
[^2]: CodeMirror. [“List of Core Extensions.”](https://codemirror.com/docs/extensions/) Accessed September 2026.
[^3]: Vite. [“Features: Web Workers.”](https://github.com/vitejs/vite/blob/main/docs/guide/features.md) Accessed September 2026.
[^4]: Fabrice Bellard. [“QuickJS documentation: memory handling and execution timeout.”](https://github.com/bellard/quickjs/blob/master/doc/quickjs.texi) Accessed September 2026.
[^5]: MDN Web Docs. [“`<iframe>`: The Inline Frame element.”](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) Accessed September 2026.
