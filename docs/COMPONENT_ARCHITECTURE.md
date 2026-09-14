---
meta:
  contentType: Reference
---

# Structure the CodeQuest 3D components

This reference defines the production component tree, package ownership, data flow, and file structure for CodeQuest 3D. Follow it when converting the Starter into the 30-mission game. It maps the product requirements, level contracts, implementation architecture, and delivery plan to reusable building blocks.

## Use this document as a build contract

This document serves engineering, level design, curriculum, art, accessibility, and quality assurance. It describes the target production structure, not the current three-file Starter.

Use the documents in this order when two rules appear to conflict:

1. [Requirements teardown](GAME_REQUIREMENTS_TEARDOWN.md) defines product, safety, privacy, and release constraints
2. [Feature specification](FEATURE_SPEC.md) defines player-facing behavior and acceptance contracts
3. [Level design](LEVEL_DESIGN_30_MISSIONS.md) defines curriculum order and mission invariants
4. [Implementation architecture](IMPLEMENTATION_ARCHITECTURE.md) defines package and runtime boundaries
5. This document defines component ownership and source placement
6. [Implementation plan](IMPLEMENTATION_PLAN.md) defines delivery order and evidence gates

Do not resolve a conflict inside a component. Record the conflict as an Architecture Decision Record (ADR), update the authoritative documents, then implement the approved result.

## Protect six architecture laws

Every source file must preserve these laws:

1. **The simulation owns game truth.** React and Three.js display state but never decide mission results
2. **Mission content stays declarative.** A mission package defines layouts, goals, copy, hints, and validators. A React component never contains a level answer
3. **The coordinator owns each run.** The editor, runner, simulation, renderer, trace, and save system communicate through one run coordinator
4. **One concept has one owner.** A component or service has one authoritative implementation. Variants use props, composition, registries, or content data
5. **Accessibility has an equivalent surface.** Canvas visuals have semantic Hypertext Markup Language (HTML) or Scalable Vector Graphics (SVG) equivalents
6. **Package dependencies point inward.** Domain contracts have no browser dependency. Features consume contracts through public package interfaces

## Target repository structure

The production repository uses a pnpm workspace. The Starter remains at the root only until Phase 3 creates this structure.

```text
codequest/
  apps/
    web/
      src/
        app/
          App.tsx
          AppProviders.tsx
          AppRouter.tsx
          AppErrorBoundary.tsx
        routes/
          BootRoute.tsx
          OnboardingRoute.tsx
          MapRoute.tsx
          ZoneRoute.tsx
          MissionRoute.tsx
          CollectionRoute.tsx
          SettingsRoute.tsx
          HelpRoute.tsx
          RecoveryRoute.tsx
        features/
          onboarding/
          map/
          mission/
          collection/
          settings/
          help/
          recovery/
        coordinators/
          createMissionCoordinator.ts
          MissionCoordinator.ts
        styles/
          tokens.css
          global.css
          utilities.css
        main.tsx
      public/
        manifest.webmanifest
        icons/
      vite.config.ts
  packages/
    domain/
      src/
        ids.ts
        commands.ts
        events.ts
        mission.ts
        simulation.ts
        settings.ts
        saves.ts
        runner.ts
        errors.ts
        schemas/
    simulation/
      src/
        createSimulation.ts
        reduceCommand.ts
        collisions.ts
        interactions.ts
        objectives.ts
        replay.ts
        snapshots.ts
        validators/
    content/
      src/
        registry.ts
        zones/
          meadow/
          forest/
          lagoon/
          cliffs/
          observatory/
        authoring/
          validateMission.ts
          validateRegistry.ts
          validateAssets.ts
          validateSolvability.ts
    renderer/
      src/
        SceneCanvas.tsx
        MissionScene.tsx
        avatar/
        camera/
        environment/
        objects/
        effects/
        systems/
        quality/
    editor/
      src/
        CodeWorkspace.tsx
        CodeEditor.tsx
        createEditorState.ts
        extensions/
        diagnostics/
        trace/
        console/
        reference/
        planning/
    code-runner/
      src/
        worker.ts
        RunnerBridge.ts
        protocol.ts
        runtime/
        limits.ts
        errorMapping.ts
    persistence/
      src/
        openDatabase.ts
        repositories/
        migrations/
        backup/
        recovery/
    ui/
      src/
        controls/
        feedback/
        dialogs/
        layout/
        accessibility/
    test-fixtures/
      src/
        missions/
        commands/
        saves/
        runner/
  public/
    assets/
      manifest.json
      avatars/
      zones/
      objects/
      audio/
  e2e/
    fixtures/
    pages/
    specs/
  docs/
    adr/
    evidence/
    playtests/
```

### Apply file placement rules

Use these rules before creating a file:

- Put pure identifiers, schemas, and shared types in `packages/domain`
- Put deterministic state transitions in `packages/simulation`
- Put authored mission values and learner copy in `packages/content`
- Put Three.js and React Three Fiber code in `packages/renderer`
- Put CodeMirror code in `packages/editor`
- Put untrusted-code execution in `packages/code-runner`
- Put IndexedDB, migration, backup, and recovery logic in `packages/persistence`
- Put reusable semantic HTML controls in `packages/ui`
- Put route composition and feature orchestration in `apps/web`
- Put binary assets in `public/assets`, referenced through the asset manifest

Avoid `common`, `misc`, `helpers`, and root-level `utils` directories. Name a module after the capability it owns.

## Enforce package dependency direction

The allowed dependency graph is:

```text
domain
  ↑
  ├── simulation
  ├── content
  ├── code-runner
  ├── persistence
  ├── renderer
  ├── editor
  └── ui
        ↑
        └── apps/web

simulation ← apps/web coordinator → code-runner
content ────→ apps/web coordinator ← persistence
renderer ───→ apps/web mission feature ← editor
```

Additional rules apply:

- `domain` imports no React, browser, Three.js, storage, or worker APIs
- `simulation` imports only `domain`
- `content` imports only `domain` and authoring-time schema utilities
- `renderer` imports `domain`, never `simulation` internals
- `editor` imports `domain`, never the code-runner worker implementation
- `persistence` imports `domain`, never React components
- `code-runner` shares only typed protocol messages with the app
- `apps/web` composes public package interfaces but imports no package internals

Continuous integration must reject cycles and internal cross-package imports.

## Build the application component tree

The route tree keeps boot, navigation, mission play, and recovery concerns separate.

```text
App
└── AppErrorBoundary
    └── AppProviders
        └── AppRouter
            ├── BootRoute
            ├── OnboardingRoute
            ├── MapRoute
            ├── ZoneRoute
            ├── MissionRoute
            ├── CollectionRoute
            ├── SettingsRoute
            ├── HelpRoute
            └── RecoveryRoute
```

`AppProviders` contains stable application services only. It may expose settings, installed-content status, and persistence readiness. It must not store per-frame transforms, editor text, command queues, or active mission state.

### Compose the boot and recovery flow

```text
BootRoute
└── BootScreen
    ├── BootProgress
    ├── OfflineReadinessStatus
    └── StorageRecoveryDialog

RecoveryRoute
└── RecoveryScreen
    ├── RecoveryExplanation
    ├── RestoreSnapshotAction
    ├── ExportRawBackupAction
    └── ContinueWithoutSavingAction
```

`BootRoute` reads migration and cache state through application services. It never implements database migration logic. `RecoveryRoute` remains reachable when content, storage, or migration loading fails.

### Compose onboarding and avatar selection

```text
OnboardingRoute
└── OnboardingFlow
    ├── WelcomeStep
    ├── AvatarSelectionStep
    │   ├── AvatarPreviewScene
    │   ├── CallSignPicker
    │   ├── AvatarPresetPicker
    │   └── CosmeticPicker
    ├── ComfortDefaultsStep
    │   ├── CameraDistancePicker
    │   ├── MotionPreferencePicker
    │   └── AudioPreferencePicker
    └── OrientationPlaygroundStep
        ├── OrientationScene
        ├── InputPrompt
        └── OrientationChecklist
```

`AvatarPreviewScene` reuses `AvatarEntity` and `AvatarRig` from the renderer. It does not create a second avatar implementation. `OrientationScene` uses the production camera and preview controller with mission completion disabled.

### Compose the map and zone flow

```text
MapRoute
└── WorldMapScreen
    ├── WorldMap
    │   ├── MapTerrain
    │   ├── MapRouteLayer
    │   ├── ZoneMarker[]
    │   ├── CurrentLocationMarker
    │   └── MapLegend
    ├── RecommendedMissionCard
    └── ZoneSummaryPanel
        └── MissionSummaryList

ZoneRoute
└── ZoneOverview
    ├── ZoneHero
    ├── ZoneProgress
    ├── MissionList
    │   └── MissionCard[]
    └── ZoneRewardPreview
```

`WorldMap` reads `WorldMapDefinition` from content and `ProgressSnapshot` from persistence. It emits selection intent. It never unlocks a zone or writes progress. `MissionCard` is the only mission-selection card implementation across map, zone, replay, and recommendation surfaces. Context changes its density through props and container queries.

## Compose the mission route around one coordinator

`MissionRoute` creates one `MissionCoordinator` for the active level and disposes it on route exit. The coordinator is a TypeScript service, not a React context containing unrelated state.

```text
MissionRoute
└── MissionLoadBoundary
    └── MissionSessionProvider
        └── GameShell
            ├── MissionHeader
            ├── MissionBriefingDialog
            ├── GameWorkspace
            │   ├── PlaygroundPane
            │   │   ├── SceneCanvas
            │   │   ├── MissionHud
            │   │   ├── Minimap
            │   │   └── SceneTextAlternative
            │   └── LearningPane
            │       └── CodeWorkspace
            ├── WorkspaceModeTabs
            ├── HelpDrawer
            ├── PauseDialog
            └── CompletionDialog
```

`MissionSessionProvider` exposes a narrow subscription interface. Consumers select only the state they render. Per-frame scene state stays in Three.js objects or renderer stores. Editor documents stay inside CodeMirror. Neither state belongs in React context.

### Define the mission coordinator interface

The coordinator owns the complete run lifecycle. UI components send intents and receive immutable snapshots or events.

```typescript
interface MissionCoordinator {
  getSnapshot(): MissionSessionSnapshot;
  subscribe(listener: () => void): () => void;
  run(source: string): Promise<void>;
  pause(): void;
  step(): void;
  cancel(): void;
  restartScene(): void;
  dispose(): Promise<void>;
}
```

The implementation must:

1. Load and validate the mission package
2. Create the start-state simulation and run identifier
3. Send source and capabilities to a fresh runner
4. Validate runner messages
5. Reduce accepted commands through the simulation
6. Publish immutable run events
7. Evaluate mission completion
8. Save source and completed progress atomically
9. Dispose the runner on every exit path

No UI component may call the simulation, runner, or progress repository directly during a run.

## Assign mission interface components

Each component owns one visible responsibility.

| Component | Owns | Receives | Emits | Must not own |
|---|---|---|---|---|
| `GameShell` | Responsive mission composition | Session status and layout mode | Layout and route intents | Simulation, editor document, Three.js state |
| `MissionHeader` | Goal, concept, required count, map action | Briefing summary | Open briefing, return to map | Completion rules |
| `WorkspaceModeTabs` | Watch, Code, and Split layout choice | Supported modes and preference | Mode change | Duplicate pane trees |
| `MissionHud` | Current objective, command, inventory, status | Selected session snapshot | Inspect, pause, help intents | Direct progress writes |
| `SceneTextAlternative` | Semantic scene and object status | Simulation snapshot | Object focus intent | Hidden duplicate controls |
| `Minimap` | Position, facing, route, goal, landmarks | Simulation projection | Camera reset or landmark focus | Collision or navigation rules |
| `RunControls` | Run, Pause, Step, speed, Restart Scene | Run state and allowed actions | Coordinator intents | Reset Code behavior |
| `MissionBriefingDialog` | Story, goal, criteria, controls | Briefing content | Start, hear, preview, review later | Final answer |
| `HelpDrawer` | Four-stage hint ladder and example | Help content and hint state | Reveal hint, insert chosen scaffold | Silent code edits |
| `CompletionDialog` | Recap, reflection, reward, next choice | Validated completion result | Replay, map, next mission | Auto-navigation |

Render one `RunControls` instance. Change its placement with layout composition or CSS. Do not create separate desktop and mobile implementations.

## Structure the 3D renderer

The renderer projects simulation state into a third-person scene. It never calculates mission truth.

```text
SceneCanvas
└── MissionScene
    ├── LightingRig
    ├── EnvironmentLayer
    │   ├── GroundMesh
    │   ├── RouteMesh
    │   ├── LandmarkLayer
    │   └── DecorativePropLayer
    ├── MissionObjectLayer
    │   └── MissionObjectRenderer[]
    ├── AvatarEntity
    │   ├── AvatarRig
    │   ├── AvatarAppearance
    │   ├── AvatarAnimationController
    │   └── CosmeticAttachmentLayer
    ├── ThirdPersonCameraRig
    ├── CodingViewLayer
    ├── WorldFeedbackLayer
    └── AudioEmitterLayer
```

### Keep renderer responsibilities distinct

| Renderer building block | Responsibility | Input authority |
|---|---|---|
| `SceneCanvas` | Canvas lifecycle, device pixel ratio, WebGL fallback, quality context | Display settings |
| `MissionScene` | Compose scene layers from one `SceneDefinition` | Content package |
| `EnvironmentLayer` | Render terrain, roads, trails, rooms, and landmarks | Scene definition |
| `MissionObjectLayer` | Resolve object type to one registered visual adapter | Simulation snapshot and content |
| `AvatarEntity` | Compose shared rig, appearance, animation, and attachments | Avatar projection and settings |
| `AvatarAnimationController` | Map command events to named animation states | Run event stream |
| `ThirdPersonCameraRig` | Follow, collision, comfort distance, authored anchors | Avatar transform and camera settings |
| `CodingViewLayer` | Render cells, facing, ranges, route preview, and target cues | Simulation projection |
| `WorldFeedbackLayer` | Render one prioritized command or objective effect | Feedback events |
| `AudioEmitterLayer` | Position approved world sounds | Audio events and settings |

### Register mission objects once

Use a renderer registry instead of mission-specific conditions:

```typescript
type MissionObjectRenderer = (props: MissionObjectViewProps) => ReactNode;

const objectRenderers: Record<MissionObjectKind, MissionObjectRenderer> = {
  beacon: BeaconObject,
  blocker: BlockerObject,
  collectible: CollectibleObject,
  gate: GateObject,
  interactable: InteractableObject,
  sign: SignObject,
  trigger: TriggerObject,
};
```

Add a renderer only when a new object kind has a distinct visual state contract. Use asset and material variants for color, zone, or story differences. Do not create `MeadowGate`, `ForestGate`, and `CliffGate` components.

### Reuse one avatar implementation

`AvatarRig` loads one humanoid skeleton contract. `AvatarAppearance` selects meshes, skin tone, hair, and clothing. `CosmeticAttachmentLayer` uses the named `head`, `back`, `leftHand`, and `rightHand` attachment points.

Boy and girl presets share:

- Skeleton and animation clips
- Controller capsule and interaction reach
- Walk speed and command duration
- Camera target and occlusion behavior
- Gameplay abilities and mission API

Presentation differences never create a new controller or simulation branch.

### Separate preview control from code control

`PreviewController` converts keyboard, touch, and camera input into temporary exploration transforms. `CommandAnimationSystem` consumes accepted simulation events during Code mode. Both use the same avatar and camera components, but they never run together.

Preview state must not enter:

- Mission validators
- Progress records
- Required collectible state
- Known-solution traces
- Challenge scores

## Structure the editor and learning workspace

`CodeWorkspace` composes editor surfaces without executing source.

```text
CodeWorkspace
├── EditorToolbar
├── CodeEditor
├── CommandChipTray
├── DiagnosticsPanel
├── OutputTabs
│   ├── ConsoleOutput
│   ├── CommandTrace
│   ├── VariableWatch
│   └── ApiReference
├── PlanningTray
└── RunControls
```

| Component | Responsibility | Source of truth |
|---|---|---|
| `CodeEditor` | CodeMirror view, selection, undo, formatting, line decoration | CodeMirror state |
| `EditorToolbar` | Editor actions and assist level | Editor commands and settings |
| `CommandChipTray` | Insert real editable JavaScript | Capability manifest |
| `DiagnosticsPanel` | Syntax and runtime diagnostics with source links | Linter and run faults |
| `ConsoleOutput` | Sanitized learner logs | Runner output events |
| `CommandTrace` | Rewindable command, source, before, and after timeline | Run event history |
| `VariableWatch` | Approved variable and predicate observations | Instrumented runner events |
| `ApiReference` | Searchable unlocked API contracts and examples | Versioned content registry |
| `PlanningTray` | Plan cards that convert by explicit action to comments or code | Learner-owned draft |

`ResetCodeDialog` belongs to the editor package because it replaces source. `RestartSceneAction` belongs to mission controls because it resets simulation. Their labels, shortcuts, and confirmation behavior must remain distinct.

## Structure feedback and learning support

One feedback pipeline prevents competing toast, HUD, animation, and sound messages.

```text
FeedbackPolicy
  safety or error
       ↓
  current command
       ↓
  mission objective
       ↓
  collection
       ↓
  ambient response
```

`FeedbackPolicy` is a pure module. It returns one primary feedback item and optional secondary items. Components render those items through `InlineFeedback`, `WorldFeedbackLayer`, `StatusAnnouncer`, and `AudioEmitterLayer`.

Use these learning components across every mission:

- `MissionBriefingDialog` for orientation
- `ObjectiveChecklist` for observable completion criteria
- `HintLadder` for four progressive help stages
- `AnalogousExample` for a different but related problem
- `PlanningTray` for pseudocode and plan cards
- `CommandTrace` for observation and debugging
- `ReflectionCard` for concept transfer
- `CompletionDialog` for recap and player choice

Mission packages provide the values. Components provide the behavior and layout.

## Keep application state in one authority

Do not duplicate the same state in React, Three.js, CodeMirror, and IndexedDB.

| State | Authority | React receives | Persistence rule |
|---|---|---|---|
| Current route | React Router | Route params and navigation state | Save only current level identifier |
| Settings | Settings repository | Stable settings snapshot | Write validated versioned record |
| Editor source and selection | CodeMirror | Dirty and diagnostics summary | Debounce source only |
| Active run status | Mission coordinator | Selected session snapshot | Do not persist unfinished animation state |
| Logical avatar position | Simulation | Immutable projection | Save only authored checkpoint state when required |
| Visual avatar transform | Renderer | Nothing per frame | Never persist |
| Object and objective state | Simulation | Immutable projection | Persist completed progress, not transient render state |
| Trace and console | Coordinator run record | Visible event window | Keep current session unless a requirement names a save |
| Unlocks and rewards | Progress repository after validator success | Progress snapshot | Atomic validated write |
| Cached assets | Service worker and asset manifest | Readiness status | Version and hash each entry |

When two modules need the same value, they subscribe to its authority. They do not synchronize local copies with effects.

## Define content as the level-building interface

Each mission lives in one folder. Keep authored data, fixtures, and tests together.

```text
packages/content/src/zones/meadow/m01-first-steps/
  mission.ts
  scene.ts
  copy.ts
  hints.ts
  example.ts
  solutions.ts
  failures.ts
  accessibility.ts
  budget.ts
  mission.test.ts
```

`mission.ts` composes the package from typed exports. It contains no React or Three.js imports.

Every mission package includes:

- Immutable mission, zone, reward, object, and asset identifiers
- Curriculum goal, prerequisites, concept evidence, and estimated active time
- Start-state simulation snapshot and seeded variants
- Scene definition with terrain, path, camera anchors, objects, and decor
- Allowed application programming interface (API) capabilities and version
- Briefing, objective list, child copy, read-aloud copy, and technical copy
- Starter source, four hints, planning cards, and analogous example
- Completion invariants and optional challenge rules
- Two known-valid solutions where the level contract permits them
- Expected failures and child-readable responses
- Keyboard, touch, screen-reader, text-scale, and reduced-motion notes
- Object, geometry, texture, audio, memory, and load-time budgets

The authoring validator rejects a package before the game can load it when IDs collide, goals are unreachable, capabilities are unavailable, examples solve the same mission unchanged, required copy is missing, assets exceed budgets, or known solutions fail.

## Build 30 missions from shared capabilities

Do not build 30 route components or 30 scene components. Build reusable capabilities, then combine them through mission data.

| Mission range | Reused simulation capabilities | Reused visual building blocks | Reused learning surfaces |
|---|---|---|---|
| M01 to M06 | Move, turn, collect, interact, ordered flags, exit validation | Training route, beacon, seed pod, lever, gate, sparks, sprite | Sequence trace, facing cue, objective checklist |
| M07 to M12 | Prior actions plus function and parameter trace metadata | Forest trail, bridge, lamp, bell, door, route marker, firefly | Function group trace, call and argument labels |
| M13 to M18 | Prior actions plus bounded iteration and predicate results | Stepping stone, buoy, dock, reef, pearl, tide wheel | Iteration counter, condition result, Step mode |
| M19 to M24 | Prior actions plus seeded state, branches, inventory, variables | Wind flag, fork sign, lantern, bridge state, crystal, console | Branch highlight, variable watch, variant runner |
| M25 to M30 | Prior actions plus arrays, delivery state, debug comparison, capstone rubric | Color pad, station, lens, rescue objective, power cell, observatory | Array index viewer, trace comparison, planning tray, recap |

### Use level templates only for authoring defaults

Authoring templates may provide typed defaults for common arena shapes:

- `RouteMissionTemplate` for a start, route, and destination
- `CollectionMissionTemplate` for required and optional collectibles
- `InteractionMissionTemplate` for object state machines
- `VariantMissionTemplate` for seeded conditional states
- `CheckpointMissionTemplate` for multi-object transfer assessments

Templates return mission data. They are not React components and cannot hide validators, capabilities, or budget fields.

### Compose each mission from existing building blocks

This matrix identifies the distinct data and reusable systems each mission needs. It does not authorize mission-specific React components.

| Mission | Authored scene and object data | Shared systems and surfaces |
|---|---|---|
| M01 First Steps | Straight route, spawn, three cells, beacon | Move reducer, route cue, command trace, destination validator |
| M02 Turn Toward Light | L-shaped route, wall, beacon | Move and turn reducers, facing indicator, collision feedback |
| M03 Treasure at Your Feet | Straight route, seed pod collectible | Collection state machine, inventory HUD, early-action feedback |
| M04 The Gate Lever | Lever, gate, route, beacon | Interaction range, facing check, gate state machine, ordered validator |
| M05 Short Safe Route | Three routes, blocker, two sparks, exit | Left turn, blocker feedback, collection validator, optional route |
| M06 Meadow Checkpoint | Two sprites, spark, ordered route, exit | Multi-object objective, order flags, checkpoint recap |
| M07 Name the Trail | Boardwalk, repeated segment, firefly lamp | Function trace grouping, declaration and call evidence |
| M08 Two Sleeping Fireflies | Hub, two lamps, matching routes | Repeated function-call evidence, multi-target objective |
| M09 Function Door | Two bells, stone door, route | Bell and door state machines, interaction-in-function evidence |
| M10 Pack a Path | Three markers with shared route prefix | Ordered marker visits, grouped trace, call-site comparison |
| M11 Give It a Number | Two bridges with different lengths, leaves | Parameter value labels, numeric argument evidence |
| M12 Echo Checkpoint | Central tree, three fireflies, exit | Function and parameter recap, checkpoint validator |
| M13 Tidal Steps | Four stepping stones, shell | For-loop evidence, iteration counter, Step mode |
| M14 Light the Buoys | Three buoys on repeated route | Loop-body trace, buoy state machine, repetition feedback |
| M15 Square Dock | Four-sided dock, center pearl | Repeated move and turn pattern, perimeter validator |
| M16 Stop at the Reef | Corridor, reef blocker, signal | While-loop evidence, `canMoveForward()` result, budget guard |
| M17 Alternate Pearls | Six cells, three alternating pearls | Loop and condition evidence, `isPearlHere()` result |
| M18 Lagoon Checkpoint | Tide wheel, repeated three-command route, exit | Nested trace grouping, wheel state, checkpoint validator |
| M19 The Wind Flag | Two bridges, wind flag, shard | Seeded variant, `isWindSafe()` result, branch highlight |
| M20 Fork in the Path | Sign, left and right goals | Two seeded variants, if and else evidence, variant runner |
| M21 Lantern Check | Lantern, tunnel, two inventory starts | Inventory predicate, conditional evidence, tunnel blocker |
| M22 Repair or Pass | Intact and broken bridge variants | Bridge state machine, conditional interaction, variant runner |
| M23 Count the Crystals | Crystals, counter console, varied positions | Variable watch, increment and comparison evidence |
| M24 Cliffs Checkpoint | Flags, lantern, crystal gate, exit | Multi-variant objective, branch timeline, checkpoint recap |
| M25 Star List | Three ordered color pads | Array index viewer, ordered pad state, loop evidence |
| M26 Deliver the Samples | Sample list, three stations | Array item marker, delivery state machine, function trace |
| M27 Find the Bug | Route with one seeded wrong turn | Trace comparison, source-line action, reset-to-starter dialog |
| M28 Fix the Loop | Four lenses, three-iteration starter | Loop-bound comparison, Step timeline, lens state |
| M29 Plan the Rescue | Crystals, gate, tide wheel, two routes | Planning tray, compound objective, optional structure evidence |
| M30 CodeQuest Finale | Power cells, route check, consoles, star beacon | Full trace, capstone rubric, recap, local learning export |

When this matrix names a new visual object, add one reusable object adapter only if the registry lacks its state contract. Represent mission placement, color, label, state values, and zone styling as content.

## Map requirements to component owners

This traceability table covers every numbered functional requirement. The non-UI authority remains responsible for truth and persistence.

| Requirement | Primary component owner | Non-UI authority | Required evidence |
|---|---|---|---|
| FR-01 | `WelcomeStep`, `BootScreen` | Boot service and offline cache | Fresh offline start without account or analytics |
| FR-02 | `AvatarSelectionStep`, `AvatarPreviewScene` | Settings repository and avatar manifest | Every preset shares mechanics and saves locally |
| FR-03 | `SettingsHome`, category panels | Settings repository | Immediate preview, persistence, category reset |
| FR-04 | `LocalSaveExplanation`, `ParentTeacherNote` | Persistence policy | No remote identity or opaque identifier |
| FR-05 | `ChallengeModeSettings`, `ChallengeResult` | Optional challenge validator | Off by default and absent from core flow |
| FR-06 | `WorldMap`, `MissionCard` | Content and progress repositories | Reachable state and two-action mission opening |
| FR-07 | `MissionCard`, `PrerequisiteNotice` | Progression rules | No currency, countdown, or social gate |
| FR-08 | `MapRouteLayer`, `ZoneMarker`, `RecommendedMissionCard` | World-map content | Landmark, restoration, side-path, and recommendation fixtures |
| FR-09 | `ReplayAction`, `SolutionChoiceDialog` | Level-code repository | Prior source remains until explicit replacement |
| FR-10 | `MissionScene`, `MissionObjectLayer` | Simulation projection | Required objects stay readable |
| FR-11 | `RunControls`, `AvatarAnimationController` | Coordinator and simulation | Deterministic pause, step, restart, and speed tests |
| FR-12 | `Minimap`, `SceneTextAlternative` | Simulation projection | Facing, route, goal, landmarks, and text alternative |
| FR-13 | `MissionHud`, `StatusAnnouncer` | Feedback policy | HUD never covers required controls |
| FR-14 | `PreviewController`, `CommandAnimationSystem` | Simulation and coordinator | Preview never completes or saves an objective |
| FR-14a | `ThirdPersonCameraRig` | Camera contract and scene anchors | Occlusion, reset, comfort, and tight-room tests |
| FR-14b | `AvatarAnimationController` | Command event stream | Each state maps to the same command identifier |
| FR-14c | `PreviewControls`, `PreviewBanner` | Preview session | Keyboard and touch exploration without progression |
| FR-15 | `MissionBriefingDialog` | Briefing content | Start, Hear it, Preview, Review later, Skip animation |
| FR-16 | `ObjectiveChecklist` | Completion contract | A child identifies required and optional goals |
| FR-17 | `ConceptIntroduction`, `ApiReference` | Curriculum contract and capability manifest | One new concept and available scaffold |
| FR-18 | `HintLadder` | Hint content and reveal state | Four stages and no silent source mutation |
| FR-19 | `AnalogousExample` | Example validator | Copying the example cannot solve the mission unchanged |
| FR-20 | `CompletionDialog` | Simulation validator | Multiple valid source forms reach the same invariant |
| FR-21 | `CompletionDialog`, `ReflectionCard` | Completion result and progress repository | Skippable recap and no automatic next mission |
| FR-22 | `PlanningTray`, `CheckpointBriefing` | Checkpoint content and validator | One checkpoint per zone with optional creative route |
| FR-23 | `GameShell`, `WorkspaceModeTabs` | Layout preference | Watch, Code, and Split remain usable at each breakpoint |
| FR-24 | `CodeEditor`, `EditorToolbar` | CodeMirror configuration | Editing, undo, find, lint, completion, autosave |
| FR-25 | `ApiReference`, `CommandChipTray` | Versioned capability manifest | Searchable unlocked API and predictable contract |
| FR-26 | `BlockedCapabilityFeedback` | Isolated runner and coordinator validation | No DOM, network, storage, navigation, popup, or host access |
| FR-27 | `RunControls`, `RunStatus` | Runner limits and coordinator | Timeout, memory, instruction, and cancellation tests |
| FR-28 | `DiagnosticsPanel`, `TechnicalDetailsDisclosure` | Runner error mapping | Child summary, line, details, and next action |
| FR-29 | `ConsoleOutput`, `CommandTrace` | Sanitized runner and simulation events | No browser or device data appears |
| FR-30 | `CurriculumExample`, `ResetCodeDialog` | Content and editor state | Read-only example and confirmed source-only reset |
| FR-31 | `SaveStatus`, settings and collection screens | Versioned persistence repositories | Minimal product-owned records only |
| FR-32 | `SaveStatus`, `RecoveryNotice` | Level-code repository | Debounced save and safe corrupt-state fallback |
| FR-33 | `BackupPanel`, `ImportPreview`, `ClearDataDialog` | Backup and recovery services | Validate and preview before overwrite |
| FR-34 | No production analytics component | Network policy and build audit | No analytics or advertising request |

## Map cross-cutting requirements to shared building blocks

The interaction and quality gaps use shared systems instead of feature-specific patches.

| Requirement group | Building blocks |
|---|---|
| Code-to-world causality | `MissionCoordinator`, `CommandTrace`, editor line decorations, `CommandAnimationSystem`, `CodingViewLayer` |
| Planning and debugging | `PlanningTray`, `CommandTrace`, `TraceScrubber`, `VariableWatch`, source-line navigation |
| Physical delight | `AvatarAnimationController`, `WorldFeedbackLayer`, `AudioEmitterLayer`, camera framing |
| Focus and reading load | `WorkspaceModeTabs`, `FocusMode`, copy-limit validator, `ReadAloudAction` |
| Replay and creative agency | `ReplayAction`, optional challenge validator, `CollectionRoom`, future constrained remix route |
| Orientation | `OrientationPlaygroundStep`, `InputPrompt`, `OrientationChecklist` |
| Deterministic synchronization | Command identifiers shared by simulation, coordinator, renderer, editor, HUD, and minimap |
| Visible rules | `CodingViewLayer`, `ApiReference`, object range cues, facing indicator |
| Safe destructive actions | `ConfirmDialog`, repository snapshots, separate scene and code reset actions |
| Recovery and offline | `BootScreen`, `OfflineReadinessStatus`, `RecoveryScreen`, backup services |
| Sensory safety | `FeedbackPolicy`, reduced-motion mode, flash budget, audio settings, pause |
| Asset performance | `SceneCanvas`, quality policy, asset manifest, level budget validator |
| Update compatibility | Versioned domain schemas, migration services, legacy code viewer |
| Child research | Development-only Level Lab and versioned evidence documents, never production telemetry |

## Apply accessibility, safety, and performance at each boundary

These concerns do not belong to one late-stage component.

### Accessibility requirements

- Pair `SceneCanvas` with `SceneTextAlternative` and semantic controls
- Keep DOM order equal to visual and keyboard order
- Use one control instance when layouts change
- Maintain 44 by 44 CSS pixel touch targets
- Announce command, failure, save, and completion status through one polite status region
- Preserve focus when changing Watch, Code, and Split modes
- Restore focus to the triggering control when dialogs close
- Support keyboard, touch, text scaling, high contrast, captions, and reduced motion
- Never encode required words in textures
- Pair color, motion, and sound with a text or shape cue

### Security and privacy requirements

- Treat player source, imports, saves, and cached content as untrusted
- Execute learner code only in the isolated runner
- Validate every worker message and imported record at runtime
- Render imported or runner text as text, never HTML
- Expose no network, storage, clipboard, device, window, or Document Object Model capability to learner code
- Create no account, analytics identifier, advertising request, chat, or public sharing surface in v1
- Dispose the runner after success, fault, cancel, timeout, and route exit

### Performance requirements

- Lazy-load `renderer`, `editor`, Level Lab, collection, and settings routes
- Keep the map and boot path independent of Three.js when no 3D preview is visible
- Keep per-frame transforms outside React state
- Reuse geometries, materials, textures, and animation clips
- Apply level-of-detail models and compressed assets through the asset manifest
- Cap the active scene to one player, zero to three lightweight non-player characters, one shadow-casting directional light, and two local shadow lights
- Preserve 30 frames per second on the minimum tier and responsive editor input under 100 ms
- Change only presentation when reducing quality

## Organize styles without duplicate layouts

Use three style layers:

1. `tokens.css` defines color, spacing, type, radius, elevation, motion, and z-index tokens
2. `global.css` defines reset, document defaults, focus, and reduced-motion behavior
3. Component-scoped CSS Modules define local structure and visual states

Use CSS Grid for page-level two-dimensional layouts and Flexbox for one-dimensional control groups. Use container queries when a component changes because of its allocated width. Use media queries for viewport-wide mode changes and accessibility preferences.

Do not create `GameShellMobile`, `GameShellDesktop`, `RunControlsMobile`, or duplicate map cards. Render one semantic tree and change its layout with CSS.

## Apply component and module conventions

Production code follows these conventions:

- Use PascalCase filenames for React components
- Use camelCase filenames for services, reducers, schemas, and hooks
- Use named exports
- Keep private prop interfaces beside the component
- Put shared public types in `domain`, not a component file
- Colocate `Component.test.tsx` and `Component.module.css` with the component
- Keep one primary component per file
- Extract a child when it gains independent state, reuse, tests, or responsibility
- Avoid a barrel file inside feature folders; use one package public entry only
- Prefer explicit imports that show package ownership
- Use discriminated unions for commands, events, errors, and object states
- Use composition for optional regions instead of long boolean prop lists

A file length alone does not require a split. Split when a file owns more than one reason to change.

## Decide whether a new component belongs

Before adding a component, answer these questions:

1. Does existing content data express the difference? Add data, not a component
2. Does an existing component support the same behavior with a named variant? Extend that contract
3. Does the behavior represent a new domain or simulation rule? Implement it outside React first
4. Does it render a new mission object state contract? Add one object renderer and registry entry
5. Does it serve two features with the same semantics? Move the stable primitive to `packages/ui`
6. Does it only shorten a file without adding ownership, reuse, or tests? Keep it local

Reject a component when its only purpose is a level identifier, breakpoint, color, zone theme, or copy variation.

## Mirror production structure in tests

Each layer proves its own contract:

```text
packages/domain/src/**/*.test.ts
packages/simulation/src/**/*.test.ts
packages/content/src/zones/**/mission.test.ts
packages/renderer/src/**/*.test.tsx
packages/editor/src/**/*.test.tsx
packages/code-runner/src/**/*.test.ts
packages/persistence/src/**/*.test.ts
apps/web/src/features/**/*.test.tsx
e2e/specs/*.spec.ts
```

Minimum test ownership follows these rules:

- Domain tests validate schema boundaries and branded identifiers
- Simulation tests cover every command and result branch with exact replay
- Content tests validate all 30 packages, known solutions, failures, prerequisites, rewards, and budgets
- Runner tests cover blocked capabilities, malformed messages, infinite loops, memory limits, cancellation, and disposal
- Renderer tests verify event-to-animation mapping, object registry coverage, camera fallback, and quality independence
- Editor tests verify editing, diagnostics, completion, line focus, reset confirmation, and assist insertion
- Persistence tests cover migration, corruption, full storage, import preview, atomic replacement, and recovery
- Web integration tests cover route guards, dialogs, focus, responsive modes, and status announcements
- End-to-end tests cover fresh play through Meadow, save and resume, replay, offline launch, export and import, and recovery

Child playtests supplement automated tests. They do not replace deterministic, accessibility, security, or performance tests.

## Migrate the current Starter without preserving its shortcuts

The current files are prototypes. Migrate their useful visual work into the target boundaries:

| Current file | Production destination | Required change |
|---|---|---|
| `src/App.tsx` | `apps/web/src/app` and route components | Replace local screen booleans with routes and feature composition |
| `src/AdventureMap.tsx` | `apps/web/src/features/map` | Move zone and mission values into `packages/content`; consume progress state |
| `src/ThirdPersonWorld.tsx` | `packages/renderer` avatar, camera, environment, object, and system folders | Replace hard-coded positions and command counts with scene definitions and run events |
| `src/styles.css` | App tokens, global styles, and component CSS Modules | Split by ownership without duplicating selectors |

Do not promote these Starter shortcuts:

- Counting `moveForward()` source lines with a regular expression
- Letting a Three.js component decide completion
- Hard-coding M01 scene positions inside renderer components
- Keeping map mission data inside a React file
- Storing all screen and run state in `App`
- Treating primitive avatar geometry as the production rig

## Follow the implementation sequence

Component work follows the phase gates in the implementation plan:

1. Phase 3 creates the workspace, package boundaries, linting, tests, and import rules
2. Phase 4 defines domain schemas and converts M01 into a complete data package
3. Phase 5 implements deterministic simulation without React or Three.js
4. Phase 6 implements the isolated runner and validated protocol
5. Phase 7 builds reusable renderer components against simulation events
6. Phase 8 composes the editor and learning experience around M01
7. Phase 9 builds map, onboarding, settings, persistence, recovery, and M01 to M06
8. Phase 10 updates components and templates from child playtest evidence
9. Phase 11 adds M07 to M30 through data and existing building blocks
10. Phase 12 freezes public contracts and verifies release evidence

Do not start production component extraction before domain and event contracts exist. Do not build later-zone components before the Meadow playtest gate locks shared patterns.

## Require evidence before accepting a component

A component is ready for implementation when its ticket names:

- Player action and visible result
- Owning package and public interface
- Domain state and event inputs
- Intents or callbacks it emits
- Loading, empty, blocked, failure, retry, cancel, and recovery states
- Keyboard, touch, focus, screen-reader, text-scale, contrast, and reduced-motion behavior
- Minimum-device performance and asset effect
- Unit, integration, browser, and playtest evidence
- Related requirement identifiers and mission identifiers

A component is complete when:

- It has one documented responsibility
- It imports only allowed package surfaces
- It contains no mission-specific rule or answer
- Its variants reuse the same semantic tree
- Its tests cover success and failure behavior
- Its accessibility checks pass without relying on Canvas content
- Its quality tier does not alter simulation outcomes
- Its requirement and evidence links are recorded

## Keep unresolved decisions visible

The following decisions block dependent production work:

- DR-01 confirms the rendering stack and supported devices
- DR-02 confirms cell scale, capsule, command duration, and camera values
- DR-03 chooses queued synchronous-looking calls or explicit `await`
- DR-04 confirms first-zone learning order and reading level through child sessions
- DR-05 confirms quality tiers on the supported hardware matrix
- DR-06 confirms launch countries and privacy posture

Mark affected tickets as Decision blocked. Do not encode an unapproved choice as a component default.

## Review architecture changes

Require an ADR when work introduces:

- A new package or dependency direction
- A new global provider or store
- A new mission object kind
- A new learner-facing API capability
- A second implementation of an existing visual or control
- A new persistence record or migration
- A browser permission, remote request, account, or cloud feature
- A change to avatar mechanics, camera rules, or deterministic movement

The review must update requirements, component ownership, content schemas, tests, and implementation gates together.
