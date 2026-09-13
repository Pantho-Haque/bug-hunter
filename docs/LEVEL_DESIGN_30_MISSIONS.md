# CodeQuest 3D — 30-Mission Level Design

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

Every level opens with a pausing card: story sentence, goal, concept, success checklist, Read Aloud, Preview, analogous example, and Start. The play layout is left 3D scene/minimap/HUD and right code editor/console. “Coding View” shows grid cells, facing, interaction range, current line, and route preview. Required collectible count is always explicit; optional collectibles never block progression.

## Meadow of Moves — learn the command → world connection

| ID / title | 3D arena and task | New API / starter idea | Success, feedback, hints, reward |
|---|---|---|---|
| M01 — First Steps | Sunny training yard; beacon is 3 cells north of spawn. Child watches third-person avatar in Preview, then programs it to reach beacon. | `moveForward()`; starter contains one commented example. | Stand on beacon. Each run highlights command/route. Hint 1: “The arrow points north.” Hint 2 shows one-cell preview. Reward: Spark 1 and camera-to-avatar tutorial complete. |
| M02 — Turn Toward Light | L-shaped garden path; beacon is 2 north, 1 east. | `turnRight()` plus `moveForward()`. | Reach beacon without wall hit. Pivot visibly happens before walk. Hint emphasizes facing arrow, not answer. Reward: compass badge. |
| M03 — Treasure at Your Feet | Straight path ending at a glowing seed pod. | `collect()`; sequence. | Reach pod and collect it. Attempting collect too early triggers puzzled animation and line clue. Reward: Seed Satchel cosmetic. |
| M04 — The Gate Lever | Yard with a lever adjacent to a closed gate and beacon beyond. | `interact()`; ordered actions. | Use lever, gate state changes, then stand on beacon. Example uses a lantern rather than gate. Reward: restored path on map. |
| M05 — Short Safe Route | Three paths; one short route contains a decorative blocker and one works. | Review all four commands; Coding View. | Collect two required sparks and reach exit. More than one valid route. Route preview is optional. Reward: trail-color choice. |
| M06 — Meadow Checkpoint | Mini rescue arena: wake two beacon sprites in a prescribed order. | Sequence; comments as plan. | Interact with both, collect one required spark, exit. Completion recap asks “Which command changed direction?” Reward: Meadow unlocked + optional free explore. |

## Echo Forest — use functions to name and reuse a route

| ID / title | 3D arena and task | New API / starter idea | Success, feedback, hints, reward |
|---|---|---|---|
| M07 — Name the Trail | Forest boardwalk has one repeated 3-step segment. | `function crossBridge() { ... }`; call function. | Define and call function to reach firefly lamp. Trace groups commands under function name. Reward: Memory Leaf 1. |
| M08 — Two Sleeping Fireflies | Two lamps use identical approach routes from a hub. | Reuse one function twice. | Wake both lamps; completion accepts repeated code but celebrates reusable function. Hint compares matching route shapes. Reward: firefly companion trail. |
| M09 — Function Door | A stone door opens after a reusable “ring bell” route. | Function with `interact()` inside. | Use function to ring two bells then pass door. Door reacts only after state machine has both flags. Reward: Echo Key accessory. |
| M10 — Pack a Path | Branches are visually similar but one turn differs. | Function body review; change one call-site sequence. | Reach three markers using one named shared segment plus individual turns. Hint warns: “Same beginning, different ending.” Reward: forest map restoration. |
| M11 — Give It a Number | Two bridges require walking different counts after same turn. | Parameterized function, `walk(count)` with fixed lesson-safe implementation. | Call `walk(2)` and `walk(4)` to gather leaves. The editor shows parameter name/value callouts. Reward: leaf cape. |
| M12 — Echo Checkpoint | Rescue three fireflies around a central tree. | Functions + parameters + plan comments. | Use at least one function; validator allows solutions without a required exact structure only after goal state. Reflection asks where reuse helped. Reward: Echo Forest unlocked. |

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

For every mission, the content team supplies: mission data/schema, playable greybox, 3D layout, objective list, allowed API version, starter code, valid solution set, expected trace, one analogous example, three hint levels, accessible copy/captions, required/optional object IDs, map card, reward ID, performance report, and tests for success, each anticipated failure, reload, restart, pause/step, and low-quality mode.

## Progression validation

- Core route is M01–M30 in order. M05, M11, M17, M18, M24, and M29 include optional challenge objectives but never gate M30.
- Each new construct is introduced in a controlled mission, rehearsed in the next 1–2 missions, then assessed in a changed-context checkpoint.
- A player may replay any completed mission, change avatar/settings, use hints, or take breaks without penalty.
- Before content lock, test at least two valid solutions per level, both presentation presets, keyboard/touch where supported, Coding View, reduced motion, text scaling, and fresh/corrupt local-save recovery.
