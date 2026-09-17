---
meta:
  contentType: Process
  phase: 10
  status: Draft — ready to run once consent is approved
---

# Run and score the Meadow playtests

Phase 10 exists to stop unvalidated Meadow patterns multiplying into 24 more levels. This
protocol turns a session into evidence that can prioritize fixes.

It reuses, and does not restate, the Phase 1 rubric:

- Measures and v1 targets: [success measures](../phase-1/SUCCESS_MEASURES.md).
- Assistance ladder **A0** through **A4**: same document. Every prompt gets a level.
- Consent, recruitment, recording, and safety: [participant consent process](PARTICIPANT_CONSENT_PROCESS.md).

## Before the session

- [ ] Guardian consent recorded against the participant code.
- [ ] Production build, not the dev server. Record the build hash in the sheet.
- [ ] Fresh profile: clear site data so onboarding appears.
- [ ] Device and input match a row of the [device matrix](../phase-1/DEVICE_BROWSER_MATRIX.md).
- [ ] Sound on, screen capture running, observation sheet open.
- [ ] Moderator has read the assistance ladder and will not explain concepts.

## Session shape — 30 minutes hands-on, hard stop

| Block | Minutes | What the child does | What you are watching |
|---|---:|---|---|
| 1. Assent and settle | 2 | Hears the assent script, sits down | Comfort, willingness |
| 2. Onboarding | 3 | Reads the welcome, chooses to start or look at the map | Do they read it? Do they know what to do next? |
| 3. M01 First Steps | 10 | Reaches the beacon | The five Phase 1 measures, plus ordering and Run discovery |
| 4. M02 Turn Toward Light | 6 | Turns the corner | Facing, camera, turn-versus-move |
| 5. Seeded error | 4 | Runs code that hits a wall or a typo | Frustration recovery |
| 6. Resume | 3 | Closes and reopens the game | Does their code come back? Do they expect it to? |
| 7. Map and collection | 2 | Returns to the map | Rewards, what to do next |

If a block overruns, drop blocks 7 then 5. Never drop block 3.

## Moderator script

Say only these things. Anything else gets logged as assistance.

- Opening: "This is a game where you write code to move a character. Have a go, and tell
  me what you are thinking if you want to. I will mostly stay quiet."
- When they pause for more than 30 seconds: "What are you thinking about?" (A0 — a
  question, not a hint.)
- When they ask what to do: "What do you think it does?" then, if still stuck after their
  answer, "Have a look around the screen." (A2.)
- When they ask you to fix it: "Try it and see what happens." Only if they are blocked and
  distressed do you go higher, and you log the level.
- Never: name a command, point at the hint button, read out the goal, or touch the keyboard.

## The seven Phase 10 questions

Each session must produce an answer to all seven. Record the observation, not your
interpretation.

1. **Camera** — does the child understand where the character is facing and which way it
   will move? Do they try to move the camera and expect the character to move?
2. **Minimap** — do they find it? Do they use it to plan, or ignore it entirely?
3. **Ordering** — do they connect the order of lines to the order of movement? Ask after a
   run: "which line made it do that?"
4. **Errors** — after a blocked move or a typo, can they say what the game told them and
   what they will change?
5. **Hints** — do they find the hint button? Do they use it before trying? Does the hint
   they get match the trouble they are in?
6. **Rewards** — after finishing, do they notice the reward and the collection? Does it
   make them want the next mission, or distract them from it?
7. **Resume** — after reopening, do they expect their code to still be there? Are they
   surprised either way?

## Post-session questions for the child

Three questions, maximum. Plain words, no leading.

1. "What does `moveForward()` do?" — this is the Phase 8 comprehension gate.
2. "If you wanted the character to go round a corner, what would you do?"
3. "Was there a bit that was confusing or annoying?"

Record the answer verbatim where you can. A shrug is data.

## Observation sheet

Copy this per participant into `docs/evidence/phase-10/`.

```text
Participant:      P0_          Age: __        Date: 2026-__-__
Device / input:                               Build:
Assent given:     yes / no     Guardian present: yes / no
Stopped early:    no / yes —  reason:

MEASURES (see SUCCESS_MEASURES.md)
  First-mission completion:  pass / fail    time: __:__   hint stage used: __
  Independent next action:   pass / fail    chose: ____________________
  Concept transfer (M02):    pass / fail    hint stage used: __
  Frustration recovery:      pass / fail    time to resume: __:__
  Accessibility blockers:    none / ____________________

ASSISTANCE LOG
  time    level(A0-A4)   what the moderator said           why

THE SEVEN
  camera:
  minimap:
  ordering:
  errors:
  hints:
  rewards:
  resume:

POST-SESSION ANSWERS
  1 moveForward():
  2 round a corner:
  3 confusing or annoying:

MODERATOR NOTES (observations only, no interpretation)
```

## Classify every issue

One row per distinct issue, across all sessions.

| Field | Values |
|---|---|
| Severity | **S1** safety, privacy, or accessibility blocker · **S2** learning blockage — the child cannot form the intended concept or cannot recover · **S3** friction — slows or annoys but the child gets there |
| Frequency | Count of participants who hit it, out of the cohort |
| Surface | camera · minimap · editor · errors · hints · rewards · resume · map · onboarding · content |
| Fix scope | copy · mission content · UI · simulation · renderer · convention |

**Priority order is fixed by the plan: safety first, then learning blockage, then
repetition.** Within the same severity, more participants wins. An S3 hit by five
children outranks an S3 hit by one; it never outranks an S2.

An issue is **repeated critical confusion** when it is S1 or S2 and hits half the cohort
or more. Those must be fixed, or explicitly accepted with a written reason and a decision
record, before Phase 11 may start.

## Playtest report

The report is the phase deliverable. It contains:

1. Cohort summary — how many sessions, ages, devices, what was dropped and why.
2. Measure results as **counts first**, percentages second. With 5 to 8 sessions, never
   claim statistical certainty.
3. The classified issue list, in priority order.
4. Before and after evidence for every issue fixed.
5. Conventions this evidence locks or changes: mission template, camera contract, copy
   style, hint model, API guide, asset rules.
6. Decision records raised for anything accepted rather than fixed.

## Exit gate

- [ ] 5 to 8 sessions completed under approved consent.
- [ ] All seven questions answered for every session.
- [ ] Issue list classified and prioritized.
- [ ] Every repeated critical confusion fixed, or accepted with a decision record.
- [ ] M01 through M06 revised where the evidence demanded it.
- [ ] Authoring conventions updated from evidence, not from opinion.
- [ ] Product, curriculum, and UX owners agree the conventions are safe to multiply.

Bulk content production is prohibited until every box is ticked.
