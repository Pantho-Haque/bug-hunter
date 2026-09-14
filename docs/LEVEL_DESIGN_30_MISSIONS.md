# CodeQuest 3D — 30-Mission Level Design

This document defines the curriculum sequence and build contract for all 30 required missions. It describes target release content, not the current Starter shell. Use the [feature specification](FEATURE_SPEC.md) for shared interaction behavior.

## Design contract

This is the production mission plan for the requirements in `GAME_REQUIREMENTS_TEARDOWN.md`. Missions are authored, deterministic 3D puzzle arenas. The player writes JavaScript to command a third-person 3D avatar; manual controls are Preview-only and cannot complete a challenge. Each mission has one core concept, a visible objective, a non-spoiling analogous example, progressive hints, and at least two valid solutions unless marked otherwise.

**Run syntax assumption (Open decision DR-03):** examples use queued calls such as `moveForward();`. The runner queues them deterministically. If `await` is later selected, the curriculum and all examples must be migrated together—never mixed.

| Zone | Levels | Primary concepts | Required result |
|---|---:|---|---|
| Meadow of Moves | 01–06 | sequence, facing, interaction, functions | avatar understands basic commands |
| Echo Forest | 07–12 | functions, parameters, reuse | player removes repeated code purposefully |
| Loop Lagoon | 13–18 | counting loops, conditions, nesting | player makes repetition visible and controlled |
| Logic Cliffs | 19–24 | booleans, branches, variables | player chooses actions from world state |
| Maker Observatory | 25–30 | arrays, debugging, planning, capstone | player builds and explains a complete solution |

## Global mission format

Every level opens with a pausing card: story sentence, goal, concept, success checklist, Read Aloud, Preview, analogous example, and Start. The play layout is left 3D scene/minimap/HUD and right code editor/console. Each scene stages its puzzle on a street, trail, courtyard, bridge, dock, or room with visible depth, landmarks, and a walkable route. “Coding View” shows grid cells, facing, interaction range, current line, and route preview. Required collectible count is always explicit; optional collectibles never block progression.

## Learning and validation contract

Each mission separates three concerns:

- **Completion evidence**: simulation-state invariants plus any briefing-declared syntax constraint that decides whether the mission succeeds
- **Concept evidence**: syntax or trace observations used for feedback and curriculum research
- **Challenge evidence**: optional efficiency or structure goals that never block the required route

Do not reject a valid world-state solution because its source differs from an authored answer. If a mission requires a JavaScript structure, state that requirement in the briefing and validate a typed syntax summary rather than source-text matching.

### Required level package

Every mission package contains these fields:

```typescript
interface MissionPackage {
  identity: MissionIdentity;
  curriculum: LearningContract;
  startState: SimulationState;
  objects: MissionObject[];
  allowedApi: ApiCapability[];
  briefing: BriefingContent;
  starterCode: string;
  hints: [Hint, Hint, Hint, Hint];
  analogousExample: ExampleMission;
  completion: CompletionContract;
  conceptEvidence: SyntaxOrTraceRule[];
  knownSolutions: KnownSolution[];
  expectedFailures: FailureFixture[];
  accessibility: AccessibilityNotes;
  budgets: MissionBudgets;
}
```

The content validator rejects missing fields, unknown object IDs, inaccessible goals, duplicate rewards, unavailable APIs, unsatisfied known solutions, and examples that can complete the current mission unchanged.

The Level Lab discovers mission packages from the content registry. Every known solution and failure fixture must be directly launchable, so authors and quality-assurance contributors can reproduce a state without changing source code.

### Command and feedback sequence

For every accepted command, the simulation emits one event with command ID, source line, before state, after state, and reason. The editor, trace, avatar, camera, minimap, sound, and heads-up display consume that event. A rejected command emits the same context plus a child-readable reason and suggested next inspection.

### API unlock sequence

| First mission | Capability | Child-facing meaning | Rejected-state feedback |
|---|---|---|---|
| M01 | `moveForward()` | Walk one cell in the facing direction | Show the blocker or map edge ahead |
| M02 | `turnRight()` | Turn 90 degrees without changing cells | Show the new compass direction |
| M03 | `collect()` | Pick up a collectible on the current cell | Highlight the collectible’s cell or say the cell is empty |
| M04 | `interact()` | Use an adjacent mission object | Show interaction range and the required facing |
| M05 | `turnLeft()` | Turn 90 degrees left without changing cells | Show the new compass direction |
| M16 | `canMoveForward()` | Check whether the next cell is traversable | Return a visible true or false state without moving |
| M17 | `isPearlHere()` | Check whether the current cell contains a pearl | Return a visible true or false state without collecting |
| M19 | `isWindSafe()` | Read the current authored wind state | Pair color and motion with text output |
| M20 | `signPointsLeft()` | Read the seeded sign direction | Test both authored directions in validation |
| M21 | `hasLantern()` | Read whether the inventory contains a lantern | Keep inventory and condition trace synchronized |

Functions such as `crossBridge()` and `walk(count)` are written by the learner. They are not hidden game APIs.

## Concept progression model

| Missions | Learner mental model | Required visible evidence | Teaching guardrail |
|---|---|---|---|
| M01–M06 | A program is an ordered plan that changes the world one command at a time | Current command, source line, facing, route cell, and resulting object state stay synchronized | Introduce one new world action at a time; never require functions to pass |
| M07–M12 | A function names a useful plan; a parameter lets one plan handle different values | Trace groups commands under the learner’s function name and shows argument values at each call | Accept linear solutions for completion unless the briefing explicitly requires structure |
| M13–M18 | A loop repeats a visible pattern; its condition or count controls when repetition stops | Iteration counter, condition result, and changed world object appear together in Step mode | Bound every loop and show off-by-one errors as incomplete or extra world actions |
| M19–M24 | A condition reads state before choosing an action; a variable remembers a value | Predicate result, selected branch, variable change, and affected route are inspectable in one timeline | Test every authored state variant; never teach a branch that only works for one seed |
| M25–M30 | An array orders related values; debugging compares intended and observed behavior | Current index/value, source line, command trace, and mission-state difference remain linked | Seed one explainable defect at a time before the open capstone |

Each checkpoint changes the story and layout while keeping the assessed concept recognizable. A checkpoint must measure transfer, not memory of a previous route.

### Required concept gates

The following missions require both their world-state invariants and the named syntax or trace evidence. The briefing must state the code constraint in child-readable language. In all other missions, concept evidence changes recap feedback or an optional challenge only.

| Missions | Required evidence |
|---|---|
| M07, M09 | Declare and call a function; M09 executes `interact()` inside that call |
| M08 | Call the same learner-defined function at least twice |
| M11 | Call one learner-defined function with two distinct numeric arguments |
| M13–M15 | Execute the repeated route from a `for` loop |
| M16 | Use a `while` loop whose condition reads `canMoveForward()` |
| M17 | Use a condition inside a loop to avoid empty collection |
| M19, M21, M22 | Use a conditional whose predicate reads the named world state |
| M20 | Use both `if` and `else` paths across the two authored variants |
| M23 | Declare, update, and compare one learner-owned variable |
| M25 | Read the authored array by index while activating pads |
| M26 | Iterate through an array and call a learner-defined delivery function |
| M28 | Use a corrected loop bound that produces four iterations |

## Meadow of Moves — learn the command → world connection

| ID / title | 3D arena and task | New API / starter idea | Success, feedback, hints, reward |
|---|---|---|---|
| M01 — First Steps | Sunny training yard; beacon is 3 cells north of spawn. Child watches third-person avatar in Preview, then programs it to reach beacon. | `moveForward()`; starter contains one commented example. | Stand on beacon. Each run highlights command/route. Hint 1: “The arrow points north.” Hint 2 shows one-cell preview. Reward: Spark 1 and camera-to-avatar tutorial complete. |
| M02 — Turn Toward Light | L-shaped garden path; beacon is 2 north, 1 east. | `turnRight()` plus `moveForward()`. | Reach beacon without wall hit. Pivot visibly happens before walk. Hint emphasizes facing arrow, not answer. Reward: compass badge. |
| M03 — Treasure at Your Feet | Straight path ending at a glowing seed pod. | `collect()`; sequence. | Reach pod and collect it. Attempting collect too early triggers puzzled animation and line clue. Reward: Seed Satchel cosmetic. |
| M04 — The Gate Lever | Yard with a lever adjacent to a closed gate and beacon beyond. | `interact()`; ordered actions. | Use lever, gate state changes, then stand on beacon. Example uses a lantern rather than gate. Reward: restored path on map. |
| M05 — Short Safe Route | Three paths; one short route contains a decorative blocker and one works. | `turnLeft()` plus previous commands; Coding View. | Collect two required sparks and reach exit. More than one valid route. Route preview is optional. Reward: trail-color choice. |
| M06 — Meadow Checkpoint | Mini rescue arena: wake two beacon sprites in a prescribed order. | Sequence; comments as plan. | Interact with both, collect one required spark, exit. Completion recap asks “Which command changed direction?” Reward: Meadow unlocked + optional free explore. |

## Echo Forest — use functions to name and reuse a route

| ID / title | 3D arena and task | New API / starter idea | Success, feedback, hints, reward |
|---|---|---|---|
| M07 — Name the Trail | Forest boardwalk has one repeated 3-step segment. | `function crossBridge() { ... }`; call function. | Define and call function to reach firefly lamp. Trace groups commands under function name. Reward: Memory Leaf 1. |
| M08 — Two Sleeping Fireflies | Two lamps use identical approach routes from a hub. | Reuse one function twice. | Wake both lamps; completion accepts repeated code but celebrates reusable function. Hint compares matching route shapes. Reward: firefly companion trail. |
| M09 — Function Door | A stone door opens after a reusable “ring bell” route. | Function with `interact()` inside. | Use function to ring two bells then pass door. Door reacts only after state machine has both flags. Reward: Echo Key accessory. |
| M10 — Pack a Path | Branches are visually similar but one turn differs. | Function body review; change one call-site sequence. | Reach three markers using one named shared segment plus individual turns. Hint warns: “Same beginning, different ending.” Reward: forest map restoration. |
| M11 — Give It a Number | Two bridges require walking different counts after same turn. | Define a parameterized function such as `function walk(count)`. | Call the learner-defined function with two values to gather leaves. The editor shows parameter name/value callouts. Reward: leaf cape. |
| M12 — Echo Checkpoint | Rescue three fireflies around a central tree. | Functions, parameters, and plan comments. | Rescue all fireflies and reach the exit. Completion uses world state; concept evidence records function reuse for recap feedback. Reward: Echo Forest unlocked. |

## Loop Lagoon — repeat clear patterns

| ID / title | 3D arena and task | New API / starter idea | Success, feedback, hints, reward |
|---|---|---|---|
| M13 — Tidal Steps | Four identical stepping stones reach a shell. | `for (let i = 0; i < 4; i++)`. | Collect shell. Current iteration displays as `1 of 4`; Step mode makes the loop readable. Reward: Tide Pearl 1. |
| M14 — Light the Buoys | Three buoys each need move + interact. | Loop body with two commands. | Light all buoys. Visual ring marks each completed repetition. Reward: buoy-glow trail. |
| M15 — Square Dock | Square dock needs equal forward/turn pattern four times. | Loop around a route. | Complete perimeter and collect center pearl. Hint asks “What repeats after every side?” Reward: sailor outfit. |
| M16 — Stop at the Reef | Corridor ends at a visible reef; number is not disclosed initially. | `while (canMoveForward())`; predicate introduced. | Stop safely before reef and interact with signal. The condition panel shows true/false each time. Reward: reef compass. |
| M17 — Pearls on Alternate Tiles | Six tiles; only every second tile has a pearl. | Counter loop + `if` preview, or authored `isPearlHere()` predicate. | Collect three pearls without attempting empty collection. This is a bridge level; code assist provides template. Reward: tide-map reveal. |
| M18 — Lagoon Checkpoint | Repair a tide wheel by repeating a 3-command pattern five times. | Loops + one prior function. | Wheel turns, route opens, exit reached. Challenge badge for fewer commands is optional. Reward: Loop Lagoon unlocked. |

## Logic Cliffs — inspect state and choose safely

| ID / title | 3D arena and task | New API / starter idea | Success, feedback, hints, reward |
|---|---|---|---|
| M19 — The Wind Flag | Two bridges; flag indicates safe direction. | `if (isWindSafe()) { ... }`. | Use safe bridge and collect compass shard. Flag has visual/text alternative. Reward: Logic Lens. |
| M20 — Fork in the Path | A random-looking but seeded sign shows left or right each run. | `if / else`; `signPointsLeft()`. | Reach goal for either authored sign state. Test runner evaluates both states. Reward: fork banner. |
| M21 — Lantern Check | Dark tunnel has lantern optional/required state. | Boolean predicate `hasLantern()`. | If lantern is not held, collect it; then exit. State appears in child-readable inventory HUD. Reward: lantern accessory. |
| M22 — Repair or Pass | A bridge is either broken or intact in two test variants. | Branch controls `interact()` or movement. | Solve both variants using one conditional. Analogous example uses a locked garden gate. Reward: repair sparks. |
| M23 — Count the Crystals | Three crystals affect a visible counter. | `let crystals = 0`; increment and compare. | Gather enough crystals (target 3) then activate console. Variable watch panel explains value changes. Reward: crystal trail. |
| M24 — Cliffs Checkpoint | Route has flags, lantern choice, and crystal gate. | Conditions + variable + loop review. | Finish three state checks. Completion shows a replay timeline and prompts one transfer question. Reward: Logic Cliffs unlocked. |

## Maker Observatory — combine, debug, and create

| ID / title | 3D arena and task | New API / starter idea | Success, feedback, hints, reward |
|---|---|---|---|
| M25 — Star List | Observatory pads show a fixed order of three colors. | `const stars = ["blue", "gold", "violet"]`; indexed loop. | Visit/activate pads in array order. Array viewer highlights current item. Reward: Star Core 1. |
| M26 — Deliver the Samples | Three stations have route names in a list. | Array + function reuse. | Deliver to all stations. World marker and array highlight remain synchronized. Reward: courier backpack. |
| M27 — Find the Bug | Starter code turns left where it should turn right. | Read trace, line focus, editing. | Correct one intentional bug and complete path. “Why did it stop?” is answered via a selectable reflection, not free text. Reward: Debugger goggles. |
| M28 — Fix the Loop | Starter loop runs one time too few. | Loop boundary debugging. | Repair loop to light four lenses. Timeline reveals three of four complete. Reward: lens glow effect. |
| M29 — Plan the Rescue | Mixed arena with two routes, crystals, gate, and tide wheel. | Pseudocode cards → comments → JS. | Complete all required objectives using any valid solution; optional challenge uses function and loop. Reward: Observatory restoration. |
| M30 — CodeQuest Finale | Observatory launch path: collect power cells, evaluate route state, activate consoles, reach star beacon. | All learned concepts; constrained API. | Plan, run, debug, and complete capstone. Uses rubric: correct outcome, safe code run, and optional explanation—not exact source. Reward: final avatar accessory, replay/remix prompt, local “What I learned” export. |

## Level implementation checklist

For every mission, the content team supplies: mission data/schema, playable greybox, 3D layout, objective list, allowed API version, starter code, valid solution set, expected trace, one analogous example, a four-stage hint ladder, accessible copy/captions, required/optional object IDs, map card, reward ID, performance report, and tests for success, each anticipated failure, reload, restart, pause/step, and low-quality mode.

## Build-ready mission validation matrix

The following tables specify the minimum state and test contract. Content authors may add optional objects, but they may not weaken these invariants.

### Meadow of Moves validation

| Mission | Required end-state invariants | Misconception represented in the world | Minimum fixtures |
|---|---|---|---|
| M01 | Avatar occupies the beacon cell | Too few or too many forward commands | Exact route, short route failure, boundary rejection, replay |
| M02 | Avatar occupies the beacon cell with no wall collision | Movement depends on facing | Correct turn route, missing turn, extra turn, wall rejection |
| M03 | Seed pod is collected and avatar remains in bounds | `collect()` acts on the current cell | Collect on pod, early collect, repeated collect, route reset |
| M04 | Lever is on, gate is open, avatar occupies beacon | Interaction needs range, facing, and order | Valid sequence, distant interact, wrong facing, closed-gate move |
| M05 | Both required sparks are collected and avatar occupies exit | A visually short route may be blocked | Two valid routes including a left turn, blocker rejection, one-spark failure, optional route |
| M06 | Both sprites wake in authored order, one spark is collected, avatar occupies exit | A correct action in the wrong order changes the result | Valid order, reversed order, missing interaction, restart after first flag |

### Echo Forest validation

| Mission | Required end-state invariants | Concept evidence for feedback | Minimum fixtures |
|---|---|---|---|
| M07 | Avatar reaches the firefly lamp | One function declaration and one call | Function solution, linear solution, uncalled function, invalid declaration |
| M08 | Both lamps are awake | The same function executes at least twice | Reused function, repeated linear route, one-lamp failure, extra safe call |
| M09 | Both bell flags are set, door is open, avatar passes door | An interaction command executes inside a called function | Valid function, second bell omitted, early door move, repeated bell |
| M10 | All three markers are visited in order | Shared route prefix appears in a function trace | Two valid call-site sequences, wrong final turn, skipped marker, replay |
| M11 | Both leaves are collected | One learner-defined function receives two distinct numeric arguments | Parameter solution, duplicated fixed functions, wrong count, missing argument |
| M12 | Three fireflies are awake and avatar occupies exit | Function call and parameter traces support recap feedback | Two valid solutions, one-firefly omission, route collision, hint-assisted retry |

### Loop Lagoon validation

| Mission | Required end-state invariants | Misconception represented in the world | Minimum fixtures |
|---|---|---|---|
| M13 | Shell is collected and avatar stops on its cell | Loop count maps to visible iterations | Four iterations, three iterations, five iterations, Step replay |
| M14 | All three buoy flags are on | Every repetition needs movement and interaction | Complete loop, move-only loop, interact-only loop, early stop |
| M15 | Perimeter flags are visited and center pearl is collected | The turn belongs inside the repeated pattern | Four-side loop, missing turn, three sides, nested helper solution |
| M16 | Avatar stops before reef and signal is active | A `while` condition must become false | Predicate solution, fixed-count solution, blocked move, runaway-loop budget |
| M17 | Three pearls are collected with no empty-cell collection | A condition filters actions inside repetition | Conditional solution, empty collect rejection, missed pearl, boundary error |
| M18 | Tide wheel receives five complete patterns and avatar exits | Nested repeated actions still execute in order | Loop with helper, expanded sequence, four patterns, partial fifth pattern |

### Logic Cliffs validation

| Mission | Required end-state invariants | Variant coverage | Minimum fixtures |
|---|---|---|---|
| M19 | Avatar uses the safe bridge and collects the shard | Safe-left and safe-right wind states | Both seeds, ignored predicate, wrong bridge, text-alternative assertion |
| M20 | Avatar reaches the goal selected by the sign | Left-sign and right-sign states | One conditional solution across both seeds, left-only code, right-only code |
| M21 | Avatar has a lantern before entering the tunnel and reaches exit | Starts with and without lantern | Both inventory states, duplicate collect, dark-tunnel rejection, reset |
| M22 | Bridge is traversable and avatar reaches exit | Broken and intact bridge states | One conditional solution across both seeds, needless safe interact, skipped repair |
| M23 | Crystal count is at least three and console is active | Crystal positions may vary within authored seeds | Two valid routes, stale local variable, two-crystal failure, counter trace |
| M24 | All state checks pass and avatar reaches exit | Two authored combinations of flags, lantern, and gate state | Both variants, each isolated failure, pause during branch, full replay |

### Maker Observatory validation

| Mission | Required end-state invariants | Concept evidence for feedback | Minimum fixtures |
|---|---|---|---|
| M25 | Three pads activate in the authored color order | Array access visits indices 0 through 2 | Indexed loop, direct indexed calls, wrong order, out-of-range access |
| M26 | Every station receives its matching sample | Array item and route marker stay synchronized | Loop with function, expanded route, skipped station, duplicate delivery |
| M27 | Avatar completes the route after the seeded turn defect is fixed | Edited line produces a changed command trace | Correct fix, unchanged starter, opposite wrong turn, reset-to-starter |
| M28 | All four lenses are lit | Loop bound changes from three effective iterations to four | Correct boundary, unchanged loop, five iterations, Step comparison |
| M29 | Required crystals, gate, and tide wheel states pass and avatar reaches exit | Plan comments may map to trace groups | Two routes, each missing objective, optional structured solution, reload draft |
| M30 | Power cells collected, route state accepted, consoles active, avatar on star beacon | Recap summarizes arrays, functions, loops, and conditions observed | Two complete solutions, each objective failure, timeout, cancel, save and replay |

## Mission copy limits

Keep the first view readable for ages 8 through 12:

- Story sentence: 18 words or fewer
- Goal: one observable verb and 12 words or fewer
- Checklist: three required items before scrolling
- Hint: one idea and one suggested inspection
- Runtime error summary: 16 words or fewer, followed by one next action
- Object label: two words where possible
- Technical syntax remains exact JavaScript even when nearby copy uses child-readable language

Read-aloud text must not pronounce punctuation-heavy code as prose. Use authored speech text for API names and syntax examples.

## Progression validation

- Core route is M01–M30 in order. M05, M11, M17, M18, M24, and M29 include optional challenge objectives but never gate M30.
- Each new construct is introduced in a controlled mission, rehearsed in the next 1–2 missions, then assessed in a changed-context checkpoint.
- A player may replay any completed mission, change avatar/settings, use hints, or take breaks without penalty.
- Before content lock, test at least two valid solutions per level, both presentation presets, keyboard/touch where supported, Coding View, reduced motion, text scaling, and fresh/corrupt local-save recovery.
