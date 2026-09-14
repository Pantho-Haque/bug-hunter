# Build the CodeQuest 3D learning experience

This specification defines the player-facing features, shared interaction loop, ownership boundaries, and release acceptance criteria for CodeQuest 3D. Read it with the requirements, architecture, level design, and implementation plan.

## Document goal and audience

This document helps product, curriculum, design, engineering, art, and quality-assurance contributors make compatible implementation decisions. It describes release behavior, not the current starter’s capabilities.

## Product status vocabulary

Use these labels in tickets and decision records:

- **Starter**: present in the repository shell, but not production-ready
- **Planned**: approved release behavior with implementation work remaining
- **Decision blocked**: dependent on an unresolved decision record
- **Validated**: implemented and supported by automated or human evidence

No release feature is currently Validated. The repository contains a Starter five-zone mission map and one WebGL mission demonstration with a procedural avatar, third-person follow camera, manual Preview movement, a textarea, and `moveForward()`-driven route feedback.

## Core learning loop

Every mission implements the same seven-state loop:

1. **Orient**: show one story goal, required objects, and completion condition
2. **Inspect**: let the player select world objects and read their state without completing the mission
3. **Plan**: connect the selected object to one available JavaScript concept or game API command
4. **Write**: edit real JavaScript with contextual completion and diagnostics
5. **Run**: execute the program in a fresh restricted runtime and produce typed command requests
6. **Observe**: animate accepted commands in order while synchronizing the scene, code line, trace, and minimap
7. **Reflect**: explain success or failure, preserve the code, and offer retry, help, replay, or the next mission

The player’s code causes every required mission-state change. Preview controls may move the camera or avatar, but Preview cannot collect objects, satisfy validators, unlock rewards, or modify coding progress.

## Code-to-world interaction contract

Every required game object exposes the same states:

| State | World presentation | Editor or heads-up display response | Allowed player action |
|---|---|---|---|
| Unknown | Visible silhouette or landmark | Name the goal, not the solution | Inspect or open briefing |
| Inspectable | Highlight, focus ring, and text alternative | Show current state and relevant unlocked API | Plan or edit |
| Planned | Optional route preview from parsed valid commands | Highlight related code and assumptions | Edit or Run |
| Active | One command animation and current-step marker | Highlight source line and trace event | Pause or Step |
| Completed | Persistent world-state change | Mark the objective complete and explain the result | Continue or inspect |
| Blocked | Safe stop, puzzled avatar, or rejected interaction | Name the cause, affected line, and one next action | Edit, retry, or request a hint |

Direct selection never changes simulation truth. It changes focus and explanation only.

## Feature areas and acceptance contracts

### World map and mission selection

The map shows five zones and 30 required missions. Each zone contains six missions, with the sixth serving as a checkpoint. Optional goals live inside authored missions and never block the required route.

Release acceptance:

- An unlocked mission opens in no more than two actions
- Every locked mission names its prerequisite without using time, currency, or collection pressure
- Replaying a mission preserves the saved solution until the player confirms a replacement
- Map restoration reflects completed missions but does not hide incomplete missions
- Keyboard, touch, and screen-reader users can identify current, complete, locked, and recommended missions

### Mission briefing

The briefing pauses gameplay and gives the player enough information to start without reading hidden documentation.

Each briefing contains:

- One story sentence
- One observable goal
- Required and optional object counts
- The new concept and previously learned concepts
- Available controls and API commands
- A completion checklist
- **Start**, **Hear it**, **Preview**, and **Review later** actions

The briefing does not show the mission’s final answer.

### Developer level lab

Development builds include a clearly labeled Level Lab that is absent from production builds. It lets contributors open any of the 30 missions without prerequisites, choose an authored state variant or failure fixture, inspect the capability manifest, and reset mission data without changing release progression.

The Level Lab must use the same mission packages, runner, simulation, renderer, and validators as normal play. It may bypass navigation locks only; it may not bypass mission rules or introduce test-only gameplay behavior.

### Interactive 3D playground

The playground is a deterministic projection of simulation state. The renderer never decides collisions, collection, success, failure, inventory, or unlocks.

The primary play view is a perspective WebGL world, not a flat board or a top-down token map. Each mission sits inside a continuous-looking district with streets, trails, courtyards, bridges, or rooms that give the full-body avatar space to walk and run toward visible goals. The game opens in Strategic View so the player can inspect the avatar, route, and objective before running code.

“Open-world-style” describes the camera, character control, spatial freedom, and readable street or path staging only. Terrain, roads, landmarks, and sky extend beyond the active mission area so the screen never ends at a visible board edge. Mission logic remains deterministic: only authored cells and objects can change progress. Preview exploration can roam through connected environment chunks without completing a mission.

Preview mode and Code mode use the same scene, avatar, collision layout, and camera rig. Preview accepts WASD, arrow keys, touch controls, and camera input for exploration. Code mode resets to the authored start state and moves the avatar only from validated program commands. Preview never completes objectives or changes progression.

Required behavior:

- Open in Strategic View; offer Preview View for third-person exploration and never present Coding View as a camera mode
- Render streamed terrain, roads, landmarks, sky, and distant decoration beyond the active mission area; hide no visible board edge behind a wall or fog cutoff
- Keep the active objective, avatar, and next traversable route readable
- Let players select relevant objects with mouse, touch, and keyboard
- Give each object a visible state, short name, text alternative, and interaction-range cue
- Animate one command at a time and keep Pause, Step, speed, and Restart Scene available
- Preserve the player’s code when restarting the scene
- Provide a minimap and equivalent landmark list
- Apply quality settings only to presentation

### Avatar behavior

The avatar communicates program state through motion and expression. Avatar presentation presets use the same skeleton, collision capsule, timing, and abilities.

The production avatar is a detailed stylized mid-poly child character with a head, torso, arms, legs, hands, feet, hair, clothing, and a readable face. Boy and girl presentation presets may change hair, clothing, and silhouette details, but they share one humanoid rig and gameplay dimensions. Asset variants use level-of-detail models so quality settings preserve readable silhouettes on weaker devices. The primitive Starter avatar is a development proxy, not the final character asset.

The animation contract includes:

- Idle and inspect
- Walk, run or fast-forward, turn, and stop
- Collect and interact
- Puzzled and safe-stop
- Celebrate
- Reset

The command event starts the matching animation within 250 ms. Reduced-motion mode replaces travel animation with short state transitions while preserving order and meaning.

### JavaScript editor

The editor teaches standard JavaScript inside a restricted learning API. It is not a general browser development environment.

Release acceptance:

- Syntax highlighting, line numbers, indentation, undo, redo, find, and bracket pairing work
- Completion lists only standard taught JavaScript and APIs unlocked for the mission
- Diagnostics distinguish syntax, runtime, blocked capability, invalid command, and mission-state errors
- Run, Pause, Step, Restart Scene, Reset Code, and speed controls use distinct labels
- Autosave stores the source locally without blocking typing
- Reset Code requires confirmation and does not reset progress or settings
- The console shows program output and command trace without exposing browser or device data

### Restricted code execution

The runner accepts source plus an allowed capability manifest and returns typed messages. It cannot access the Document Object Model (DOM), network, browser storage, navigation, parent window, timers, imports, or host objects.

Release acceptance:

- Each Run creates and disposes a fresh runtime
- Time, stack, memory, and command budgets stop hostile or accidental programs
- The coordinator validates every message, run ID, command, argument, and source range
- Cancel, route exit, timeout, memory failure, and completion dispose the runtime
- The page stays responsive during infinite loops and allocation growth
- Technical details remain available behind child-readable error copy

### Feedback and help

Feedback names the observed outcome before suggesting a correction. It never changes code silently or penalizes help use.

The help ladder contains:

1. A reminder of the visible goal
2. A conceptual clue tied to world state
3. A relevant API or syntax pattern
4. A partial scaffold that the player chooses to insert

The analogous example uses different values, objects, and layout. Label it **Example, not this mission’s answer**.

### Completion and progression

Completion requires mission-state invariants, not exact source text. A separate concept-evidence check may record whether the player used the intended construct, but it cannot reject an otherwise valid solution unless the briefing states that structural constraint.

The completion view includes:

- What changed in the world
- The primary concept
- One short transfer question
- Earned reward or map restoration
- Replay, return to map, and next-mission actions

No celebration starts the next mission automatically.

### Local data and offline behavior

CodeQuest stores settings, progress, level code, and one recovery snapshot in versioned local records. It does not create an account or behavioral analytics identifier.

Release acceptance:

- The installed app launches offline with all installed mission content
- Writes validate before replacing the current snapshot
- Export creates a portable versioned backup
- Import previews changes before replacing data
- Storage, migration, corruption, and update failures lead to a recovery screen
- Clear Data names exactly what it removes and requires confirmation

### Accessibility and child safety

The release targets Web Content Accessibility Guidelines (WCAG) 2.2 AA where applicable to the browser game.

Every feature must support:

- Keyboard operation and visible focus
- Touch targets of at least 44 by 44 CSS pixels
- Text alternatives for visual state and non-color status cues
- Text scaling without clipped controls or lost mission context
- Reduced motion and independent control of music, effects, and narration
- Pause for non-essential moving content
- No accounts, chat, ads, purchases, public ranking, streaks, or random rewards

## Feature ownership boundaries

| Concern | Authoritative package | Consumers |
|---|---|---|
| IDs, schemas, commands, events, save types | `domain` | All packages |
| Movement, collision, object state, mission result | `simulation` | Coordinator, tests |
| Mission content, copy, hints, known solutions | `content` | UI, simulation adapters |
| JavaScript execution and capability requests | `code-runner` | Coordinator |
| Scene, camera, avatar, object animation | `renderer` | Web application |
| Editor, diagnostics, completion, trace display | `editor` | Web application |
| Settings, progress, code, migrations | `persistence` | Web application |
| Run lifecycle and screen composition | `apps/web` | Player |

Presentation packages may request actions. They may not mutate simulation or persistence records directly.

## Feature definition of ready

Do not schedule a player-facing feature until its ticket identifies:

- The learner action and observable learning result
- Simulation state before and after the action
- Required commands, events, content fields, and save fields
- Loading, empty, blocked, failure, retry, cancel, and recovery states
- Keyboard, touch, screen-reader, text-scale, and reduced-motion behavior
- Performance and resource budgets on the minimum device
- Unit, integration, browser, and human-playtest evidence
- The decision record for any unresolved product or technical choice

A mockup alone is not a feature contract. A feature is ready when every consumer can implement against the same typed state and acceptance evidence.

## Release slices

Build features in these slices:

1. **M01 headless contract**: schema, simulation, trace, validator, and replay
2. **M01 secure run**: restricted runner, cancellation, budgets, and error mapping
3. **M01 playable slice**: 3D scene, avatar, editor, briefing, help, accessibility, and save
4. **Meadow zone**: M01 through M06, map, onboarding, settings, rewards, recovery, and offline support
5. **Remaining zones**: one six-mission zone at a time after Meadow playtest conventions lock
6. **Release candidate**: all Must requirements and evidence gates pass

## Traceability

Use these documents for deeper decisions:

- [Requirements teardown](GAME_REQUIREMENTS_TEARDOWN.md): product, safety, privacy, and non-functional requirements
- [Implementation architecture](IMPLEMENTATION_ARCHITECTURE.md): package boundaries, runtime flow, and security model
- [Component architecture](COMPONENT_ARCHITECTURE.md): component ownership, source structure, and requirement traceability
- [Thirty-mission level design](LEVEL_DESIGN_30_MISSIONS.md): curriculum sequence and mission contracts
- [Implementation plan](IMPLEMENTATION_PLAN.md): delivery phases, gates, roles, and evidence
