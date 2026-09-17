---
meta:
  contentType: Checklist
  phase: 10
  status: Pending
---

# Approve the Phase 10 gate

Phase 10 turns the Meadow from "built and self-consistent" into "observed to work with
children". Its deliverables cannot be produced from a keyboard, and this record exists so
the missing evidence stays visible rather than being assumed.

## Entry check

- [x] End-to-end Meadow build that runs from a production bundle (Phase 9).
- [x] [Playtest protocol](PLAYTEST_PROTOCOL.md) written: session shape, moderator script,
      seven observation questions, observation sheet, issue rubric, report structure.
- [x] [Participant consent process](PARTICIPANT_CONSENT_PROCESS.md) written.
- [ ] **Privacy or legal reviewer has approved the consent process.** No session may be
      run before this box is ticked.
- [ ] Participants recruited under that approved process.
- [ ] Target device from the [device matrix](../phase-1/DEVICE_BROWSER_MATRIX.md) available
      for at least one session.

## Deliverable check

- [ ] 5 to 8 moderated sessions completed. **(0 of 5 run.)**
- [ ] All seven observation questions answered for every session.
- [ ] Measure results recorded as counts against the
      [success measures](../phase-1/SUCCESS_MEASURES.md).
- [ ] Issue list classified by severity and frequency, in the fixed priority order:
      safety, then learning blockage, then repetition.
- [ ] Every repeated critical confusion fixed, or accepted with a decision record.
- [ ] M01–M06 revised where the evidence demanded it.
- [ ] Authoring conventions updated from evidence: mission template, camera contract,
      copy style, hint model, API guide, asset rules.
- [ ] Playtest report written.
- [ ] DR-04 moved out of *Evidence gathering*.

## What has been done instead, and what it does not cover

The mechanical layer is verified so that sessions are not spent on it:

| Evidence | Covers | Does not cover |
|---|---|---|
| [E-10 copy and access audit](../evidence/phase-10/E-10-copy-and-access-audit.md) | keyboard-only first run, focus indicators, 200% text, reduced motion, rendered reading level | whether a child understands anything |
| `packages/content/src/reading-level.test.ts` | every authored child-facing string against the DR-04 grade baseline | whether the words chosen are the right ones |
| fault-copy case in `packages/code-runner` | every runner fault has plain copy and a next action | whether a child acts on it |
| [E-08 browser-worker hostile report](../evidence/phase-6/E-08-browser-worker-hostile-report.md) | hostile code containment in a real browser | nothing about learning |
| [E-09 performance report](../evidence/phase-7/E-09-performance-report.md) | frame profile and budgets on a developer laptop | the target device |

None of these is a playtest. Comprehension, hint timing, error recovery, and whether a
child can say what `moveForward()` does are only answerable by observation.

## Gate result

Current result: **Pending — entry blocked on privacy or legal approval; no sessions run.**

Phase 11 content production is therefore still prohibited by the Phase 10 gate. The only
sanctioned way past it without sessions is
[DR-07](../phase-1/decisions/DR-07_PROCEED_WITHOUT_PLAYTESTS.md), which is **proposed and
unsigned**; it recommends holding and bounds the fallback to Echo Forest. Work that is not
content production — validators, contracts, engine and runner capabilities — is not
blocked by this gate.

## Approval record

| Role | Name | Approve or amend | Date | Notes or evidence |
|---|---|---|---|---|
| Product owner |  |  |  |  |
| Curriculum owner |  |  |  |  |
| UX and accessibility owner |  |  |  |  |
| Privacy or legal reviewer |  |  |  | required before any session |
