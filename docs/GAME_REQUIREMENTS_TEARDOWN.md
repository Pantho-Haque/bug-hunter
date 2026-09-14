# CodeQuest 3D — Requirements Teardown

This document defines product constraints and quality requirements. Use the [feature specification](FEATURE_SPEC.md) for player-facing behavior and acceptance contracts.

## 1. Product definition

**CodeQuest 3D** is a local-first, browser-based 3D adventure in which a child writes small JavaScript programs to guide a chosen boy or girl avatar through missions, collect objects, and unlock a hand-crafted world map. It is an introduction to real JavaScript, not a competitive social network and not a general-purpose cloud IDE.

The movement reference is a child-safe third-person exploration game: a full-body low-poly avatar walks or runs along authored streets, trails, and paths while a camera follows from behind. It is not a request for driving, combat, crime themes, traffic systems, crowds, or a large unrestricted city.

The emotional loop is: **notice an intriguing place → understand a small goal → write/run a short program → see the avatar act → receive specific, kind feedback → unlock a visible next adventure**. It has healthy, legible achievement feedback and player agency—not manipulative streaks, random rewards, scarcity, advertising, or pressure to return.

### Assumptions and product guardrails


| Item        | Decision for v1                                                                        | Reason / consequence                                                   |
| ----------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Audience    | Ages 8–12, early readers who can type simple English                                   | Validate language level with child testing; offer read-aloud support.  |
| Platform    | Recent desktop/tablet browser; keyboard and touch where viable                         | A full desktop editor is the primary experience.                       |
| Identity    | No account, no chat, no leaderboard, no ads, no purchases                              | Keeps the game private and avoids social comparison risks.             |
| Competition | Personal best, optional local “challenge medals,” never ranking against named children | Achievement-oriented rather than status-oriented.                      |
| Persistence | Only minimal progress/settings stored locally                                          | Clearing browser data loses progress unless the player exports it.     |
| Code        | Real JavaScript inside a deliberately small game API                                   | “Run any code” cannot mean unrestricted browser/device/network access. |




## 2. Outcomes and measurable success



### Product outcomes

1. A child can independently complete the first mission in under 10 minutes.
2. A child learns and can apply sequences, functions, loops, conditionals, variables, arrays, and debugging in later missions.
3. The play experience makes failure safe: every run is reversible, understandable, and retryable.
4. The player has a compelling reason to explore the world while learning, without requiring social comparison or data collection.



### North-star and acceptance measures


| Measure                      | Suggested v1 target                                                 | How to measure without accounts                        |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| First-mission completion     | ≥80% in moderated child playtests                                   | Research-session observation, not production tracking. |
| Independent next-level start | ≥70% after a success                                                | Research-session observation.                          |
| Concept transfer             | ≥60% solve a variant using the taught concept with at most one hint | Session rubric.                                        |
| Frustration recovery         | ≥80% resume after an error using feedback/hint                      | Session rubric.                                        |
| Accessibility defects        | 0 blockers before release                                           | Keyboard, screen reader, reduced-motion, contrast QA.  |


Do **not** make daily retention, playtime, streaks, purchase conversion, or rank the primary child KPI. The UK ICO’s Children’s Code recommends high-privacy defaults and data minimisation; a local-only architecture directly supports that posture.[^1]

## 3. Experience, world, and progression scope



### World map: “The Spark Isles”

The opening map is a colorful diorama with five visible but progressively reachable landmarks. Distant attractions are teasers, not paywalls: a lighthouse beam, floating loop-vines, a clockwork bridge, a crystal observatory, and a friendly village. Each landmark previews the next idea with a small animation and plain-language label. Tapping/clicking a level shows its goal, concept badge, estimated challenge (“short,” “medium”), collectibles remaining, and a non-spoiling example.


| Zone              | Coding concept                   | Story / mission fantasy         | Example collectible | Unlock condition              |
| ----------------- | -------------------------------- | ------------------------------- | ------------------- | ----------------------------- |
| Meadow of Moves   | sequence, facing, interaction     | Wake the beacon sprites         | Sparks              | Available from first launch   |
| Echo Forest       | reusable functions               | Teach fireflies a path          | Memory Leaves       | Complete M06                  |
| Loop Lagoon       | `for`, `while`                   | Repair a repeating tide machine | Tide Pearls         | Complete M12                  |
| Logic Cliffs      | booleans, `if` / `else`          | Choose safe bridge routes       | Compass Shards      | Complete M18                  |
| Maker Observatory | variables, arrays, debugging     | Build a personal rescue route   | Star Cores          | Complete M24                  |


Every zone contains six required missions. The sixth mission is a “show what you know” checkpoint. Authored missions may include optional remix goals and collectible paths, but optional content never blocks the 30-mission route. Early missions should need 3–8 commands; complexity increases one concept at a time. A level is never locked behind perfect collection or speed.

### Child-centered feedback rules

- Reward the **strategy** (“Your loop repeats this path neatly”), not ability labels (“You’re a genius”).
- Give a celebration after meaningful milestones, then return control quickly; honor `prefers-reduced-motion` and a mute option.
- Use collectibles to reveal lore, avatar accessories, map restoration, and creative choices—not power advantages or probability-based rewards.
- Treat mistakes as experiments. The avatar resets safely, keeps the player’s code, highlights the relevant step, and offers “Try again,” “See a clue,” and “Show an example.”
- Allow a child to pause, leave, and return without losing state or being shamed for stopping.



## 4. Functional requirements

Priority: **Must** = MVP release gate; **Should** = first post-MVP; **Could** = later.

### A. Onboarding, settings, and local profile


| ID    | Requirement                                                                                                                             | Priority | Acceptance criteria                                                                                  |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| FR-01 | Start with one tap/click and no account, email, age field, analytics identifier, or consent wall.                                       | Must     | A fresh install starts a playable intro offline after assets are cached.                             |
| FR-02 | Let the player choose a boy or girl **fully rigged 3D avatar**, then choose a preset call sign, skin-tone range, hair, clothing color, and unlocked accessories from child-safe options. | Must | Preset identifiers are saved locally and can change in Settings without losing progress. Every approved preset is equally capable. Free-text child names are not stored. |
| FR-03 | Provide Settings: avatar, audio, accessibility, display/camera, controls, learning/editor, local-data management, and parent/teacher information. | Must | Each setting previews or changes immediately, persists locally, and has a child-readable explanation. Clear requires a child-readable confirmation. |
| FR-04 | Explain local saving in child-readable language and give a parent/teacher note.                                                         | Must     | No opaque identifiers or remote profile are created.                                                 |
| FR-05 | Offer an optional local “challenge mode” (personal best moves/runs) after the child understands normal completion.                      | Should   | It is off by default; no timer or score is shown in core learning flow.                              |




### B. World map and navigation


| ID    | Requirement                                                                                                                                           | Priority | Acceptance criteria                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| FR-06 | Display an explorable 3D/2.5D world map with clear path, landmark previews, current location, completed state, and reachable/unreachable distinction. | Must     | Child can select any unlocked mission and return to map in ≤2 actions.                         |
| FR-07 | Never use a misleading lock, countdown, currency, or social ranking to gate learning progression.                                                     | Must     | Required path unlocks only from demonstrated core mission completion.                          |
| FR-08 | Include map attractions: animated landmarks, collectible counter, visible restoration changes, optional side paths, and “next recommended mission.”   | Must     | Attractions clarify exploration rather than obstruct selection.                                |
| FR-09 | Let users replay completed levels and see their prior solution or a reset starter.                                                                    | Must     | Replay does not overwrite a prior solution until the user explicitly saves/runs a replacement. |




### C. 3D playground, avatar, and minimap


| ID    | Requirement                                                                                                                                                       | Priority | Acceptance criteria                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| FR-10 | Render the mission as a readable 3D playfield left of the editor: avatar, goal, hazards/blocks, interactables, collectibles, and goal zone.                       | Must     | Camera framing makes the active route understandable; no required object is permanently obscured. |
| FR-11 | Animate all code-driven movement step-by-step and provide Run, Pause, Step, Restart, camera reset, and speed controls.                                            | Must     | Pause halts deterministically; Restart restores mission state and preserves code.                 |
| FR-12 | Present a minimap with avatar position/facing, objective, explored route, mission-relevant landmarks, and north/reset control.                                    | Must     | It is useful at small screen sizes and has a text alternative/list view.                          |
| FR-13 | Show floating, non-blocking mission information: goal, remaining required collectibles, current step, interaction prompt, and safe status messages.               | Must     | Information never covers the editor cursor or a required game control; it can be toggled.         |
| FR-14 | Make all game interactions possible through the learning API; direct manual movement is allowed only in preview/explore mode and cannot complete code challenges. | Must     | A completion audit shows the required actions were emitted by the mission API.                    |
| FR-14a | Use a close third-person follow camera inspired by open-world games: the child sees the avatar from behind/over-the-shoulder while it walks, turns, jumps only where explicitly supported, collects, and reacts to code commands. | Must | Camera avoids walls/occlusion, preserves a clear path to the objective, and has a reset/comfort distance setting. |
| FR-14b | Give the 3D avatar readable state animations: idle, walk, run/fast-forward, turn, collect, interact, celebrate, puzzled, safe-fail/reset, and optional emotes. | Must | Animation reflects the command trace within 250 ms and never changes mission state by itself. |
| FR-14c | Make preview/explore controls feel game-like (WASD/arrow keys or touch stick; camera drag; interact button), but display a clear “Preview—code will complete this mission” banner. | Should | Direct movement cannot trigger mission completion, unlock collectibles, or alter coding progress. |




### D. Mission flow and pedagogy


| ID    | Requirement                                                                                                                                | Priority | Acceptance criteria                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------- |
| FR-15 | Open each new level with a pausing mission briefing: story goal, real-world coding idea, controls, success criteria, and estimated effort. | Must     | “Start,” “Hear it,” “Review later,” and “Skip animation” are available; opening it later pauses safely. |
| FR-16 | State success criteria precisely, including which collectibles are required versus optional.                                               | Must     | A child can answer “what do I need to do?” from the briefing without reading the code.                  |
| FR-17 | Teach one primary concept per mission, activate only previously taught API commands, and use scaffolded starter code.                      | Must     | A new syntax feature is introduced with an explanation and immediately usable example.                  |
| FR-18 | Give progressive help: reminder → conceptual clue → highlighted relevant API/example → optional partial scaffold.                          | Must     | Hints never silently alter the child’s program; using a hint is never punished.                         |
| FR-19 | Show a worked **analogous** example, clearly labeled “Example—not this level’s answer.”                                                    | Must     | Its map/layout/values differ enough that copying it cannot directly complete the mission.               |
| FR-20 | Validate completion by game state, not exact source text; support multiple correct solutions.                                              | Must     | Equivalent valid paths succeed.                                                                         |
| FR-21 | At completion, show a compact recap: achievement, concept used, one reflection question, unlocked item/route, and next choice.             | Must     | Celebration is skippable and does not auto-start the next mission.                                      |
| FR-22 | Include a capstone per zone with planning cards/pseudocode and a creative optional route.                                                  | Should   | Rubric checks goal/state, not one solution.                                                             |




### E. JavaScript editor and coding model


| ID    | Requirement                                                                                                                                                                                 | Priority | Acceptance criteria                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| FR-23 | Use a split view: responsive playground on left; editor and console on right.                                                                                                               | Must     | At narrow widths, panels switch via labelled tabs without hiding mission context.               |
| FR-24 | Provide a real-JavaScript editor with syntax highlighting, line numbers, indentation, undo/redo, find, keyboard shortcuts, auto-close brackets, autosave, lint diagnostics, and completion. | Must     | Invalid syntax is diagnosed before Run when possible; suggestions cover game API and taught JS. |
| FR-25 | Offer a small, documented level API such as `moveForward()`, `turnLeft()`, `collect()`, `interact()`, `canMoveForward()`, and `atGoal()`.                                                   | Must     | API documentation is contextual, searchable, and indicates unlocked commands.                   |
| FR-26 | Allow arbitrary JavaScript expressions/statements **within the sandboxed execution environment**, with no network, storage, navigation, popups, parent-window access, or unapproved APIs.   | Must     | Attempts to access blocked capability fail safely with an understandable message.               |
| FR-27 | Run code against a deterministic command queue with an instruction/time/memory limit and cancellation.                                                                                      | Must     | Infinite loops/timeouts stop without freezing UI; the player can edit immediately afterward.    |
| FR-28 | Display runtime errors in child-readable terms plus the actual error details behind a “Technical details” control.                                                                          | Must     | Error references source line and relevant game state, where possible.                           |
| FR-29 | Provide a console that shows program messages and a trace of game API calls; never expose sensitive browser/system data.                                                                    | Should   | A child can inspect why a command was blocked or why a condition was false.                     |
| FR-30 | Include read-only curriculum examples and a reset-to-starter action.                                                                                                                        | Must     | Reset asks confirmation and only replaces current-level code.                                   |




### F. Progress and data


| ID    | Requirement                                                                                                                                                                         | Priority | Acceptance criteria                                                                |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| FR-31 | Persist minimal local data: schema version, settings, selected avatar preset, completed level IDs, optional collectible IDs, local bests, current level, and per-level source code. | Must     | Data fits a documented schema and is stored only under product-owned browser keys. |
| FR-32 | Autosave code after a short debounce and before navigation; recover interrupted work.                                                                                               | Must     | Closing/reopening restores the last stable source; corrupt data falls back safely. |
| FR-33 | Export/import a human-readable, versioned progress backup and allow delete-all.                                                                                                     | Should   | Import validates schema and confirms before overwriting local data.                |
| FR-34 | Do not transmit telemetry in v1. If later introduced, make it opt-in, aggregate/minimal, documented, and subject to legal review.                                                   | Must     | Network inspection of v1 shows no analytics or advertising calls.                  |

### G. Interaction gaps to close

The original scope has a strong learning loop, but these are the most important interaction gaps. They should be converted into backlog items before content production begins.

| Gap | Requirement to add | Priority |
|---|---|---|
| Code-to-world connection | Highlight the executing line, draw a short route preview, show the current command above the avatar, and let the player step one command at a time. | Must |
| Planning before typing | Add optional draggable mission-plan cards (`move`, `turn`, `collect`, `repeat`) that become starter JS/pseudocode. | Must |
| Debugging | Add a rewindable execution timeline: command, avatar position, expected/actual result, and a “go to line” action. | Must |
| Physical delight | Add responsive avatar animation, object reactions, camera framing, and proximity-based environmental detail. | Must |
| Agency outside the answer | Let collectibles unlock cosmetics, photo spots, low-stakes exploration interactions, and a personal “Code Cabin”; never sell or randomize them. | Should |
| Cognitive load | Offer **Watch**, **Code**, and **Split** focus modes; retain one primary call to action and let children hide floating UI. | Must |
| Different learning speeds | Support “show me,” “tell me why,” and “let me try” help styles; never penalize hints. | Should |
| Replay value | Add optional routes, collectible challenges, “use fewer commands” puzzles, and free explore after normal completion. | Should |
| Input confidence | Offer tappable command chips and read-aloud help; chips insert real editable JavaScript rather than hiding it with blocks. | Should |
| Adult handoff | Add a local-only, exportable “What I learned” summary per zone; no account/dashboard. | Could |

### G2. Second-pass gaps: interaction reliability and long-term quality

| Gap | Requirement to add | Priority |
|---|---|---|
| First-time 3D orientation | A child may not know whether the camera, avatar, or minimap is the thing they control. Start with a 30-second playable “camera and avatar” toy before the first code puzzle, using prompts that disappear after success. | Must |
| Animation and simulation disagreement | A beautiful animation that finishes late or misses a command breaks trust in coding. The simulation is authoritative; command state, animation state, HUD, minimap, and completion checks must share a command ID and recover after a dropped frame. | Must |
| Ambiguous APIs | `moveForward()` may be unclear at intersections or slopes. Every API command needs a visual precondition, plain-language contract, example, failure reason, and predictable effect. | Must |
| Invisible boundaries | Children cannot plan routes when collision, grid cells, interaction range, or facing direction are hidden. Offer a toggleable “coding view” that reveals traversable tiles, facing arrow, interaction radius, and objective path. | Must |
| Accidental destructive actions | Restart, reset code, import, clear data, and avatar changes can cause loss/confusion. Give undo where feasible, confirm consequential actions in simple language, and distinguish “restart the scene” from “erase my code.” | Must |
| Progress recovery | Local-only save can disappear due to storage clearing or shared school devices. Surface a gentle export reminder only after a milestone, auto-create a local recovery snapshot, and provide an import preview before overwrite. | Should |
| Content dead ends | A faulty/misconfigured level can block a child indefinitely. Each level requires author-time solvability validation, a known-valid reference solution, reachable-objective test, and escape/skip-for-review route. | Must |
| Mission pacing | A long task produces fatigue; a tiny task feels patronizing. Tag each mission with estimated active time and split anything over 10–12 minutes into checkpoints with safe stopping points. | Must |
| Mastery versus completion | Reaching a goal once does not prove concept understanding. Add one small transfer prompt after key lessons where the layout changes but the concept remains; it is supportive, not a punitive exam. | Should |
| Language and reading load | Story text, hints, and errors may exceed reading ability. Cap critical prompts at one short sentence, support read-aloud, use illustrated verbs, and localize content without embedding words in textures. | Must |
| Sensory safety | Celebrations can be overwhelming or unsafe. Set particle/audio/flash limits, avoid flashing patterns, queue simultaneous rewards, and allow one-tap quiet mode from pause. | Must |
| Asset download weight | High-quality 3D characters/worlds risk excluding slower devices. Use compressed meshes/textures, LODs, streamed zone assets, offline cache progress UI, and a functional low-quality mode. | Must |
| Touch/editor collision | On small screens the keyboard can obscure the world and code. Specify tablet breakpoints, a full-screen editor toggle, command chip row, and preserved camera snapshot when switching panels. | Should |
| No-internet state | First launch may occur without connectivity. Define a clear installed/offline readiness state; never show a broken map or blank level without a child-readable recovery option. | Must |
| Update compatibility | A new game version can invalidate code or saves. Version APIs and level schemas, migrate saves, preserve a legacy code view, and test import from the last supported release. | Must |
| Moderation-free safety | Even without chat, imported files can be malicious or inappropriate. Validate import schemas, size-limit files, discard unknown fields, never execute imported code until it passes the same sandbox, and never render imported text as HTML. | Must |
| Creative ownership | A child who finishes lessons needs a meaningful “I made this” moment. Plan a constrained offline remix sandbox with approved level pieces and share-disabled-by-default export; defer public sharing until separately approved. | Could |
| Playtest feedback loop | No production telemetry means issues can be invisible. Define recurring moderated child playtests, observation scripts, consent process, and a severity rubric for confusion/fatigue/access barriers. | Must |

### G3. New acceptance tests for interaction

- A first-time player can identify the avatar’s facing direction, objective, Run, Pause, Reset Scene, and Reset Code without adult instruction.
- When a command fails, the child can answer what happened and navigate to the responsible code line.
- Pressing Run repeatedly, pausing mid-animation, changing playback speed, and restarting yields the same final world state for the same program.
- A child can complete a mission using keyboard only, touch only where supported, and reduced-motion/high-contrast settings.
- A full local-storage save, a deliberately corrupted save, a full-storage condition, and an import from the prior schema all fail safely without silent progress loss.
- On the lowest supported hardware tier, all objective objects, avatar commands, editor typing, and Pause remain usable even when visual fidelity is reduced.

### H. Local settings: UX and storage contract

Settings make the game feel like the child’s own world and remove repeated friction. Save them in one versioned local record such as `codequest.settings.v1`; settings are small primitives/preset IDs only—never typed names, voice, images, contacts, or behavioral histories. Apply a change immediately where safe, show a short preview, and use “Reset this category” rather than an unexplained global reset.

| Category | Local settings | UX behavior |
|---|---|---|
| Avatar | `presentation`, `skinToneId`, `hairId`, `outfitId`, `accessoryIds`, `emoteId` | A rotating 3D preview confirms the choice before “Done.” Cosmetics never change ability. |
| Camera & display | `cameraDistance`, `cameraSide`, `cameraSensitivity`, `qualityMode`, `showMinimap`, `showRoutePreview`, `uiScale` | Offer **Near / Standard / Far** rather than raw numbers. Preview safely; default to Standard. |
| Controls | `inputMode`, `moveBindings`, `interactBinding`, `pauseBinding`, `runBinding`, `codeFontSize` | Simple defaults plus remapping and left-handed/touch layouts; never force a detected keyboard. |
| Audio | `masterVolume`, `musicVolume`, `effectsVolume`, `voiceVolume`, `captionsEnabled`, `readAloudEnabled` | Mute All and individual sliders; captions enable automatically with narration. |
| Comfort & access | `textSize`, `highContrast`, `reducedMotion`, `colorAssistMode`, `screenShake`, `flashReduction`, `dyslexiaFriendlyFont`, `focusMode` | Respect system reduced-motion initially; never rely on color, flashing, or sound alone. |
| Learning/editor | `hintStyle`, `codeAssistLevel`, `autoCompleteEnabled`, `lintEnabled`, `autoFormatEnabled`, `runSpeed`, `confirmResetCode` | Start with assistance and lint on. “Explorer” reduces prompts but does not change the lesson. |
| Privacy/data | `lastBackupReminderDismissed`, `exportFormatVersion` | State “Your game is saved on this device.” Provide Export, Import, Clear My Game, and Storage Help. |

Recommended separation of local data:

```json
{
  "codequest.settings.v1": {
    "avatar": { "presentation": "girl", "hairId": "curl-02", "outfitId": "starter-teal" },
    "camera": { "distance": "standard", "showMinimap": true, "showRoutePreview": true },
    "accessibility": { "textSize": "medium", "reducedMotion": false, "captionsEnabled": true },
    "editor": { "codeAssistLevel": "guided", "autoCompleteEnabled": true, "runSpeed": "normal" }
  },
  "codequest.progress.v1": { "completedLevelIds": ["meadow-01"], "unlockedAccessoryIds": [] }
}
```

First-launch defaults: standard third-person camera; captions on if narration is enabled; code assistance, minimap, and route preview on; normal movement animation; no timer. If storage is unavailable/full, keep the session playable, explain this calmly, and offer export when possible.

### I. Third-person 3D avatar specification

The avatar should feel like the playable character in a third-person open-world game—not a top-down token. Yet the player is programming it, so each movement must make program intent obvious.

Use a stylized low-poly art direction with a complete human silhouette. The avatar has a visible head, torso, arms, legs, hands, feet, hair, clothing, and face. Boy and girl presets share one humanoid rig, controller capsule, speed, abilities, and animation timing. Primitive shapes are acceptable for the engineering Starter only.

- **Camera:** Follow behind the avatar at a comfortable elevated angle. During execution use gentle auto-framing; do not take camera control away for long. Provide camera reset and a static strategic view.
- **Movement:** `moveForward()` produces a visible walk cycle, footstep/dust cue, and directional marker. `turnLeft()` visibly pivots the body before the next step. Fast-forward changes playback speed, never physics or outcomes.
- **World reactions:** Nearby collectibles glow subtly; interaction range has a simple prompt and contextual animation. Collection removes the object, updates HUD, and gives a brief sound/visual response.
- **Failure:** A wall/unsafe tile safely stops the avatar, plays a puzzled animation, and points to the causal command/line. Avoid falls, violence, damage meters, or shame language.
- **Comfort/performance:** Require clip prevention, indoor transparency/fade, field-of-view limits, reduced-motion alternative, and camera reset. Low quality may simplify shadows/particles/draw distance, but not readable movement or mission logic.

## 5. Non-functional requirements


| Area            | Requirement / measurable target                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Privacy         | Local-first and data-minimal. No account, PII, precise location, ads, behavioral profiling, third-party trackers, chat, or user-generated sharing. Assess COPPA/GDPR/UK Children’s Code applicability with counsel before any cloud feature; COPPA generally requires verifiable parental consent before collection of personal information from under-13s.[^2]                                  |
| Security        | Treat player code as hostile. Execute outside the app’s origin/privileges; capability-based game API only; validate all messages; strict CSP; dependency review; no secrets in client code. A sandboxed iframe must not combine `allow-scripts` and `allow-same-origin` for same-origin content, because that can undermine the sandbox.[^3]                                                     |
| Reliability     | Deterministic level simulation; autosave; no lost current code on ordinary navigation; recover from code crash/render failure; content version migration tests.                                                                                                                                                                                                                                  |
| Performance     | First interactive scene on a target school laptop within 5 seconds on warm cache and 10 seconds on typical broadband cold cache; ≥30 FPS target, with quality fallback; editor input stays responsive (<100 ms perceived response). Validate hardware targets in real devices.                                                                                                                   |
| Offline         | Core intro, installed/cached content, and saved progress work without a network after first load. Clearly state when an optional update is unavailable.                                                                                                                                                                                                                                          |
| Accessibility   | Target WCAG 2.2 AA: keyboard-accessible controls/editor alternatives, visible focus, semantic labels, contrast, text scaling, captions/transcripts, reduced motion, no color-only instruction, remappable/alternative controls, and no time-critical actions. W3C advises WCAG 2.2 for future applicability.[^4]                                                                                 |
| Inclusion       | Avatar options avoid stereotypes; pronoun-free/default-neutral copy where practical; visual/audio concepts have alternatives; test with children with varied reading ability, motor access needs, sensory preferences, and confidence levels. UNICEF calls for safety, data protection, transparency, fairness, accountability, and meaningful child participation in child-centred systems.[^5] |
| Usability       | Plain language; one action per instruction; persistent Help; no required reading wall; all destructive actions confirm; no dead end. Test with children rather than relying on adult review.                                                                                                                                                                                                     |
| Maintainability | Data-driven levels (level JSON + assets + validation rules), versioned save schema, reusable mission templates, component tests for engine/API, and authoring checklist.                                                                                                                                                                                                                         |
| Observability   | In development builds only: local debug panel and test event logs. Production v1 has no remote telemetry.                                                                                                                                                                                                                                                                                        |
| Legal/content   | Own/license all assets; no external embeds in child flow; age-appropriate content review; privacy notice and parent/teacher guide before public release; legal review by launch jurisdictions.                                                                                                                                                                                                   |




### Safe code-execution architecture

“Full authority” should mean freedom to write any JavaScript *logic*, not permission to reach a child’s device or the internet. Browser workers run in a separate global context,[^6] but are not, by themselves, a complete policy boundary. Use a separate, sandboxed execution realm on a distinct origin where feasible, expose only audited RPC commands, and enforce budgets in a host-controlled runner.

```
Editor source → parser/linter → execution sandbox → validated command messages →
deterministic simulation → renderer/minimap/console → completion validator → local save
                              ↑ cancellation + time/instruction budget ↑
```

Required controls: AST validation or interpreter/transform that blocks imports and dangerous globals; `postMessage` schema validation; no `fetch`, WebSocket, DOM, `localStorage`, `indexedDB`, navigation, popup, clipboard, camera/mic, or cross-window bridge; wall-clock and instruction quotas; isolated error boundary; CSP with allowlisted resources; content/dependency security review. The exact implementation needs a security design review before claiming arbitrary-code support.

## 6. Scope plan



### MVP — playable learning slice

Ship one polished six-mission zone (“Meadow of Moves”) with optional goals inside authored missions, one chosen avatar presentation flow, 3D playfield, minimap, pause briefing, analogous examples, safe run/step/restart loop, JavaScript editor/lint/completion for the starter API, local save, settings, and accessibility baseline. The goal is to prove that an 8–12-year-old can learn the loop before building the other four zones.

### Release 1

Add all five zones, functions/loops/conditionals/variables/arrays/debugging, capstones, map restoration, progressive hints, local export/import, broader device quality tiers, content-authoring pipeline, formal child safety/accessibility QA, parent/teacher guide, and playtest-informed tuning.

### Explicitly out of scope until separately approved

- Accounts, sign-in, cloud sync, parental dashboards, cross-device recovery
- Public/global leaderboards, multiplayer, chat, friend lists, sharing player code
- Ads, in-app purchases, loot boxes, premium currency, timed events, streak pressure
- AI tutor/chatbot, open web browsing, user uploads, external code packages
- Native mobile apps, VR, open-world procedural generation, level editor/community marketplace



### Key decisions / risks to resolve


| Decision                            | Why it matters                                             | Recommended next action                                                                   |
| ----------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Target countries and exact age band | Sets privacy, accessibility, copy, and consent obligations | Choose launch jurisdictions; obtain child-privacy legal review.                           |
| Engine choice                       | Determines performance, editor integration, asset workflow | Spike a small 3D scene plus editor on target school hardware.                             |
| “Any code” interpretation           | Sandbox design is a safety-critical constraint             | Adopt the capability-limited definition above; threat-model before implementation.        |
| Learning efficacy                   | Game appeal can obscure whether concepts transfer          | Run moderated prototype playtests with an age-diverse cohort and a simple concept rubric. |
| Local-data loss                     | Browser clearing is common on shared devices               | Make export/import prominent; decide whether a future consented parent sync is needed.    |




## 7. Delivery backlog and quality gates



### Recommended build order

1. Define the simulation contract, level data schema, save schema, and sandbox threat model.
2. Build one rectangular test arena with deterministic movement/collection and command trace.
3. Add the editor, lint/completion, run/step/cancel, safe error states, and test harness.
4. Implement the first six missions and briefing/hint/example pattern.
5. Add the polished map, avatar choice, minimap, feedback, settings, and local export.
6. Conduct child playtests and accessibility/security/performance testing; revise content before expanding zones.



### Definition of done for each mission

- Learning objective, prerequisites, success state, optional objective, and likely misconceptions are written.
- Starter code, API documentation, four-stage hint path, and analogous example are present.
- At least two materially different valid solutions work.
- Failure states are reversible and explain the next useful action.
- Keyboard/touch path, captions/text alternative, reduced motion, contrast, and narrow-layout checks pass.
- Save/reload/replay and sandbox-abuse tests pass.



## 7A. Production 3D conventions and build contracts

This section is intentionally concrete. **Confirmed** means required. **Proposed** is the prototype default to validate. **Open** must be decided before dependent work begins. Do not silently turn a Proposed or Open item into gameplay behavior.

### 7A.1 Product boundary and world model

| Topic | Convention | Status | Build rule |
|---|---|---|---|
| Game shape | Small, authored 3D streets, trails, courtyards, bridges, and rooms connected by a visual world map. | Confirmed | Each level loads its own perspective simulation scene and returns to the map on exit. |
| Player role | The child programs a human 3D avatar; manual input is preview/exploration only. | Confirmed | Only API command events can satisfy mission objectives. |
| Camera | Third-person, behind-avatar learning view with optional strategic coding overlay. | Confirmed | No first-person or free combat camera in v1. |
| Physics style | Grid-aware, deterministic navigation with 3D presentation; not free-form physics platforming. | Proposed | Levels use authored nodes/cells and facing directions. |
| Combat/danger | No combat, health, death, loot drops, or punitive fail loop. | Confirmed | Hazards safely stop/reset and explain the needed plan. |
| World scale | One game unit = one traversal-cell edge; a move command crosses one cell. | Proposed | Authoring tools expose cells/coordinates; rendering smooths visuals only. |

### 7A.2 Coordinate, facing, and movement contract

The simulation uses X/Z as the horizontal plane and Y as vertical. `0°` faces north/+Z, `90°` east/+X, `180°` south/−Z, and `270°` west/−X. Child UI uses compass labels; degrees appear only in tools. Logical avatar state is `{ cellX, cellZ, facing, inventory, flags }`. Transform and animation are visual projections—not source of truth.

| Item | Rule | Acceptance test |
|---|---|---|
| Move | `moveForward()` requests exactly one adjacent cell. If blocked, state does not change and `BlockedMove` is emitted. | Same input/state has the same result at 30 or 60 FPS. |
| Turn | `turnLeft()`/`turnRight()` changes facing by 90° on the logical tick before visual pivot. | Minimap, trace, and avatar agree after pause/resume. |
| Interaction | `collect()`/`interact()` require an authored target within cell/range and valid facing. | Out-of-range usage gives a readable reason, not a silent no-op. |
| Run | Run produces immutable command list plus seeded snapshot. | Replay gives the same position, flags, collection, and result. |
| Pause/step | Pause ends after atomic command transition; Step performs one atomic command. | Pause cannot duplicate collection or half-complete a turn. |
| Reset | Reset Scene restores level-start snapshot; Reset Code restores starter source after confirmation. | The two actions are visually and shortcut-distinct. |

Not permitted in v1: slopes that change movement distance, moving collision objects, ragdolls, unpredictable physics, navmesh pathfinding, random spawns, or frame-rate-dependent command results. These require a change request and lesson-design review.

### 7A.3 Camera and readable 3D staging

| Behavior | Convention | Status |
|---|---|---|
| Default rig | Spring-smoothed pivot follows behind avatar; avatar sits low-middle so route is visible ahead. | Proposed |
| User control | Mouse/touch rotates in Preview/Explore; code run permits it but gentle follow re-engages after idle. | Proposed |
| Occlusion | Raycast camera-to-avatar; fade/clip only blocking props. Never hide avatar or required objective. | Must |
| Tight rooms | Blend closer or use fixed authored camera anchor; never invert controls or force sudden 180° flip. | Must |
| Coding view | High strategic angle with grid, facing arrow, targets, and route preview; same rules as normal view. | Must |
| Comfort | Conservative FOV/smoothing/shake; settings can reduce or disable them. | Must |
| Cinematics | Maximum 5 seconds, immediately skippable, never contain required-only instruction. | Must |

Camera values are authored per level: `minDistance`, `maxDistance`, preferred yaw, collision volumes, and no-go zones. Reject a level if a required target is hidden for more than one second in default camera without minimap/strategic cue.

### 7A.4 Avatar, animation, and interaction convention

Boy and girl presentations use one shared skeleton contract, collision capsule, movement timing, and gameplay API. Differences are visual presets only—never speed, collision, or ability differences.

| Character property | Production convention | Prototype gate |
|---|---|---|
| Form | Complete stylized low-poly human with a readable silhouette at gameplay distance | Recognizable from the default camera on the minimum display size |
| Rig | One humanoid skeleton with root, hips, spine, head, arm, hand, leg, and foot joints | Walk, run, pivot, interact, puzzled, celebrate, and reset clips retarget without mesh-specific code |
| Presets | Boy and girl base presentations plus child-safe hair, skin-tone, and clothing options | Every preset uses the same capsule, speed, reach, and animation timings |
| Geometry | Proposed cap of 12,000 visible triangles for the player at the highest v1 quality tier | Establish the final cap during the target-device greybox spike |
| Materials | Shared, compressed texture atlas or a small palette-based material set | Changing a preset does not trigger a new gameplay bundle or shader path |

| Animation state | Trigger | Gameplay rule |
|---|---|---|
| Idle/look-at | No active command; a nearby objective can receive subtle look-at. | Cosmetic only; never points to hidden answer. |
| Walk | Successful `moveForward()`. | Logical cell changes at command event, not animation end. |
| Pivot | Successful turn. | Locks facing for the current command. |
| Collect/interact | Valid target. | Target changes once using idempotent target ID. |
| Puzzled | Blocked command/safe fail. | Emphasize error line; no damage or ridicule. |
| Celebrate | Milestone/completion. | Skippable; cannot hide next choice. |

Use named attachment points (`head`, `back`, `leftHand`, `rightHand`) for cosmetics and effects. Test cosmetic clipping on every base/outfit. Character collision uses a simple controller capsule, never the render mesh.

### 7A.5 Mission arena and authoring contract

Each mission is a small authored puzzle arena: visually rich, but fully inspectable in coding view. Decorative props cannot create hidden collision or fake interactability.

| Object | Required fields | Rules |
|---|---|---|
| Spawn | `id`, `cell`, `facing` | Exactly one active spawn. |
| Goal | `id`, `cell`, `successConditions` | Declarative, testable, visually distinct. |
| Collectible | `id`, `cell`, `required`, `collectionEffect` | Required/optional state is shown in briefing/HUD; one transition only. |
| Blocker | `id`, `occupiedCells`, `reasonKey` | Visible, with declared reason and collision. |
| Interactable | `id`, `cell`, `requiredFacing`, `actionKey`, `stateMachine` | Explicit state transitions validate against API. |
| Trigger | `id`, `cells`, `condition`, `effect` | Never surprise-fail; visually/signpost hinted and deterministic. |
| Decor | `id`, `assetId`, `bounds`, `interactive=false` | Cannot block a required route unless declared Blocker. |

Every level package contains `level.json`, scene/layout, localized copy keys, starter code, known-valid solutions, validator, hint ladder, analogous example, performance-budget report, and automated solvability tests. No level depends on an undocumented engine default.

### 7A.6 Player-facing code API contract

First zone exposes `moveForward`, `turnLeft`, `turnRight`, `collect`, and `interact`. Predicates such as `canMoveForward` arrive only with the lesson that needs them. Never expose engine objects, teleport coordinates, or mutable world internals.

| Convention | Rule |
|---|---|
| Naming | Verb-first; one action/question per function; no abbreviations. |
| Async model | **Open.** Choose queued synchronous-looking calls (MVP recommendation) or explicit `await` after curriculum/security spike; do not mix models. |
| Return values | Action calls return structured internal results; early child lessons use predicates/events, not fragile result objects. |
| Errors | Each error has code, child copy, source line, technical details, and next action. |
| Versioning | API version belongs in level metadata; saved code runs compatible API or tested migration. |

### 7A.7 Rendering, asset, and performance budgets

These are prototype caps until the hardware spike establishes final targets.

| Resource | Cap per active mission arena | Rule |
|---|---:|---|
| Character rigs | 1 player + 0–3 simple NPCs | NPCs optional before MVP proof. |
| Player geometry | 12,000 visible triangles proposed; 4,000-triangle fallback | Validate both tiers on the minimum school device. |
| Visible collectibles | 30 | Prioritize silhouettes/readability. |
| Shadow lights | 1 directional + 2 local | Bake/static-light remaining scenery. |
| Textures | 1K main character/material group; 512 most props | Compressed GPU textures; shared atlases/materials. |
| Frame rate | 30 FPS minimum tier; 60 FPS preferred | Simulation tick independent of renderer. |
| Scene load | 10 s cold / 5 s warm | Child-readable progress; never blank/unresponsive. |

Quality tiers may change shadows, post-processing, particles, textures, draw distance, and animation blend detail—but never collision, code results, collectible availability, mission detection, minimap data, or API behavior.

### 7A.8 Feedback hierarchy

Feedback must reinforce code causality. One state change has at most one primary signal; effects queue instead of becoming noise. Priority: **safety/error → current command → mission objective → collection → ambient**.

| Event | Required feedback | Forbidden |
|---|---|---|
| Command begins | Editor-line highlight + command label + subtle avatar anticipation | Blocking popup/full-screen effect |
| Command succeeds | Animation + small world effect | Loud reward for normal movement |
| Command blocked | Puzzled avatar + line emphasis + one reason/next step | Damage sound, red screen, score penalty |
| Optional collectible | HUD count + short sparkle/chime | Countdown or reward roulette |
| Mission complete | Brief celebration + concept recap + next choice | Forced video, auto-advance, ranking screen |

### 7A.9 Save, versioning, and offline contract

Keep separate versioned records: `settings`, `progress`, and `levelCode`. `levelCode` is keyed by immutable `levelId` + API version. Application-level writes: write a new snapshot, validate, then mark current; retain one recovery snapshot. Do not synchronously write every keystroke.

| Case | Required behavior |
|---|---|
| Close during edit | Recover debounced source or previous snapshot. |
| Asset update | Continue cached compatible content; ask before large update; completed levels remain replayable. |
| Migration failure | Preserve original backup; safe default; raw-backup export. |
| Incompatible import | Version/reason plus preview; no partial overwrite. |
| Offline later launch | Load cached shell/last content; name unavailable downloads clearly. |

### 7A.10 Decision records that block implementation

The Phase 1 [decision log](evidence/phase-1/E-02_DECISION_LOG.md) links the complete record for every decision below. Proposed values are spike hypotheses until their approval tables and evidence gates are complete.

| ID | Decision | Evidence required | Blocks |
|---|---|---|---|
| DR-01 | Engine/rendering stack and supported devices | School-laptop/tablet spike | Scene, assets, editor integration |
| DR-02 | Cell size, capsule, command duration, camera values | Greybox + child observation | Mission authoring |
| DR-03 | Queued API vs `await` | Curriculum prototype + security review | Snippets and first zone |
| DR-04 | First-zone learning sequence/reading level | Curriculum review + 5–8 child sessions | Mission production |
| DR-05 | Quality-tier hardware matrix | Target-device performance capture | Asset acceptance/release |
| DR-06 | Launch countries/privacy posture | Product/legal decision | Public release/cloud feature |

### 7A.11 Non-hallucination checklist

Every implementation ticket must explicitly state: player action; simulation state before/after; UI/camera/animation feedback; error/retry path; keyboard/touch/accessibility path; local data read/written; performance effect; level/API version effect; and test cases. Missing information is **Open** and requires a decision record—not guessed behavior.

## 8. Research basis and limitations

The requirements above use child-privacy-by-default principles, WCAG 2.2, browser security documentation, and K–12 CS concepts as design inputs—not as a substitute for jurisdiction-specific legal counsel or child-development research. K–12 CS standards explicitly include named variables and combined control structures such as loops and conditionals, supporting the proposed learning sequence.[^7] A current study of programming educational games also reports immediate feedback as a perceived support for exploratory problem-solving, but it does not prove that one game design works for every age group.[^8]

## Sources

[^1]: Information Commissioner’s Office. [“Age appropriate design: a code of practice for online services.”](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/?search=core) Accessed September 2026.
[^2]: U.S. Federal Trade Commission. [“Verifiable Parental Consent and the Children’s Online Privacy Rule.”](https://www.ftc.gov/business-guidance/privacy-security/verifiable-parental-consent-childrens-online-privacy-rule) Accessed September 2026.
[^3]: MDN Web Docs. [“The `<iframe>` element.”](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) Accessed September 2026.
[^4]: W3C. [“Web Content Accessibility Guidelines (WCAG) 2.2.”](https://www.w3.org/TR/WCAG22/) 2023.
[^5]: UNICEF Innocenti. [“Guidance on AI and children.”](https://www.unicef.org/innocenti/reports/policy-guidance-ai-children) 2025.
[^6]: MDN Web Docs. [“Using Web Workers.”](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) Accessed September 2026.
[^7]: Computer Science Teachers Association. [“K–12 Computer Science Standards.”](https://oped.educacion.uc.cl/wordpress/wp-content/uploads/2024/01/CSTA_2017_K-12_Computer_Science_Standards.pdf) 2017.
[^8]: Gulevska et al. [“Educational games as a tool for teaching programming in digital extracurricular computer science education.”](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2026.1766830/full) *Frontiers in Computer Science*, 2026.
