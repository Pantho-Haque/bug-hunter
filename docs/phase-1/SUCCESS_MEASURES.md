---
meta:
  contentType: Reference
  phase: 1
  status: Ready for pilot
---

# Measure whether children can learn independently

This rubric defines the five Phase 1 product measures. It uses moderated observation rather than production analytics.

## Use one consistent pilot format

- Recruit learners across ages 8 through 12, including the lower and upper ends of the range.
- Include participants with different typing experience and, where possible, relevant access needs.
- Use the supported device and input setup assigned to the test cell.
- Start from a fresh local profile unless the session tests recovery or transfer.
- Let the child think aloud if comfortable, but do not require it.
- The facilitator may resolve device access problems. Record any mission or syntax explanation as assistance.
- Stop or pause when the child asks, shows distress, or encounters an accessibility blocker.

DR-04 requires 5 to 8 formative sessions before the first-zone reading and teaching sequence can be accepted. Release confidence requires a later, broader cohort defined in the Phase 9 playtest plan.

## Score the measures

| Measure | Pass definition | v1 target | Evidence |
|---|---|---:|---|
| First-mission completion | Completes M01 within 10 minutes after briefing, with no solution coaching and no more than one conceptual hint | At least 80% | Time, hint stage, assistance, final result |
| Independent next action | Within 30 seconds of completion, chooses replay, map, or the recommended next mission and can say what it does | At least 70% | Chosen action, time, explanation |
| Concept transfer | Solves a changed but equivalent sequence task with at most the first hint stage and without copying the prior source unchanged | At least 60% | Variant ID, source or trace, hints, explanation |
| Frustration recovery | After a seeded blocked move or syntax error, identifies or uses the feedback and resumes a meaningful attempt within 3 minutes | At least 80% | Error, observed response, recovery action, time |
| Accessibility blockers | No issue prevents a required action for a supported access path | Zero blockers | Device, input or assistive technology, defect, workaround |

Percentages are directional for small formative cohorts. Report counts and observations beside percentages; never claim statistical certainty from 5 to 8 sessions.

## Classify assistance

| Level | Facilitator action | Effect on independent score |
|---|---|---|
| A0 | No assistance | Independent |
| A1 | Repeats visible interface text or helps with hardware access | Independent if unrelated to the concept |
| A2 | Points to an existing goal, error, or first hint without explaining it | Record as prompted |
| A3 | Explains the coding concept or suggests an API call | Not independent |
| A4 | Provides code, edits code, or gives the route | Not independent; retain as diagnostic evidence |

## Observe first-mission completion

Start timing when the child selects **Start** on M01. Stop when the completion recap appears or at 10 minutes.

Record whether the child can identify:

- The avatar
- The visible goal
- The editor
- The **Run code** action
- The relationship between source order and movement order
- The difference between Restart Scene and Reset Code if either is used

Failure to complete is diagnostic. Record whether the blocker was reading, code entry, camera, route understanding, feedback, control discovery, performance, or an external interruption.

## Observe independent next action

After success, the facilitator stays silent for 30 seconds. A passing child chooses an available next action and understands its result. The interface fails this measure if the child waits because the next choice is hidden, auto-advance removes the choice, or labels are ambiguous.

## Test concept transfer

Use a variant with different landmarks, route shape, command count, and values but the same taught concept. The transfer task must not be the analogous example from the mission.

Score:

- **2, transferred:** independently creates a valid sequence and can relate source order to action order
- **1, emerging:** succeeds after the first reminder or self-corrects without concept coaching
- **0, not demonstrated:** requires conceptual/code coaching, copies unchanged source, or cannot explain the result

The product target counts scores of 2 and 1 only when assistance does not exceed A1 and hint use does not exceed stage 1.

## Observe frustration recovery

Seed one age-appropriate, reversible problem after the child understands Run:

- A blocked move caused by facing or route position, or
- A syntax error with a precise line location

A passing recovery includes one of these meaningful actions:

- Reads or plays the feedback
- Selects the highlighted line or trace item
- Changes the relevant code
- Uses an appropriate hint
- Restarts the scene while preserving code
- Runs a revised attempt

Repeated clicking without interpreting feedback does not count as recovery.

## Classify accessibility findings

| Severity | Definition | Gate effect |
|---|---|---|
| Blocker | A supported access path cannot complete a required action and no safe equivalent exists | Stops the phase or release gate |
| Critical | Severe loss of context, focus, readability, motion safety, or error recovery with an unreliable workaround | Must close before child validation continues on that path |
| Major | Material friction or repeated adult assistance is needed | Fix before pattern lock |
| Minor | Usability defect that does not prevent understanding or completion | Prioritize with evidence |

## Report without tracking children

For each session, store only the approved research record outside the game:

```text
Participant code:
Age band: 8–9 | 10–12
Device and browser evidence ID:
Input or access setup:
M01 result and time:
Highest hint stage:
Assistance level and reason:
Next-action result:
Transfer score and variant:
Recovery result and seeded problem:
Accessibility findings:
Observed quotes or behavior, de-identified:
Recommended product change:
```

Do not add production analytics to automate this rubric.

