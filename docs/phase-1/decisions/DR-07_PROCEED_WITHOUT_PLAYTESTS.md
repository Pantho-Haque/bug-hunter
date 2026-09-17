---
meta:
  contentType: Decision
  decisionId: DR-07
  status: Proposed
---

# Decide whether to open Phase 11 without child playtest evidence

## Status

- State: **Proceeding on owner instruction, approval table still unsigned.** Phase 11 zone
  production was started on the project owner's explicit direction on 2026-09-18, before
  the Phase 10 sessions and before this record was signed. The approval table below is
  the outstanding item, not a formality already met.
- Owner: Product owner
- Required reviewers: Product, curriculum, UX and accessibility
- Target decision date:
- Last reviewed: 2026-09-18

## Decision question

Do we begin Phase 11 zone production before the Phase 10 moderated child sessions have
been run, accepting the risk explicitly, or do we hold production until the sessions
produce evidence?

## Why this decision exists

Phase 10 exists for one reason, stated in the plan: *stop unvalidated Meadow patterns
from multiplying into 24 more levels.* Its gate prohibits bulk content production and
permits an exception only when confusion is *"fixed or explicitly accepted with
evidence."* This record is that explicit acceptance, written so the acceptance is on the
record rather than implied by silence.

The engineering side of Phases 1 through 9 is complete and verified. The blocking items
are a privacy or legal sign-off on the
[participant consent process](../../phase-10/PARTICIPANT_CONSENT_PROCESS.md) and 5 to 8
moderated sessions run against the
[playtest protocol](../../phase-10/PLAYTEST_PROTOCOL.md). Both need people, not code.

## Constraints

- Requirement IDs: the five measures in [success measures](../SUCCESS_MEASURES.md)
- Mission IDs: M01–M06 shipped; M07–M30 unwritten
- Supported devices or access paths: no target-device run yet; only a developer laptop
- Privacy or security boundary: unchanged by this decision
- Performance budget: unchanged by this decision
- Decisions that this record depends on: **DR-04**, which is still *Evidence gathering*
  and explicitly requires 5 to 8 formative sessions before the first-zone reading and
  teaching sequence can be accepted. Accepting DR-07 means accepting DR-04's sequence
  without the evidence DR-04 itself demands.

## Options

### Option A: hold production until the sessions are run

- Child and curriculum effect: the teaching sequence is corrected before it is copied 24
  times. Nothing is learned wrongly at scale.
- Technical effect: no code changes. The team is idle on content.
- Accessibility effect: real access-need blockers are found on 6 missions, not 30.
- Privacy and security effect: none.
- Performance effect: none.
- Reversibility and migration cost: none. This is the plan as written.

### Option B: open Phase 11 now, accepting the risk

- Child and curriculum effect: **the main risk.** If the Meadow teaching sequence
  misleads children, the same mistake is authored into every later zone. Hint staging,
  copy reading level, error wording, and the ordering lesson are all unvalidated.
- Technical effect: none immediately. Loop Lagoon onward introduces new player-code APIs
  (`canMoveForward()`, `isPearlHere()`, `isWindSafe()`, `signPointsLeft()`, `hasLantern()`),
  which by the plan's dependency rule return work to Phases 4, 6, and 8 regardless.
- Accessibility effect: an access-path blocker found later is 30 missions of rework
  instead of 6.
- Privacy and security effect: none.
- Performance effect: none.
- Reversibility and migration cost: **high and asymmetric.** Mission packages are data,
  so a copy or hint fix is cheap per mission but must be applied 30 times. A change to
  the mission *template* — a new required field, a different hint model, a changed
  completion contract — is a content migration across every zone plus saved-code
  migration tests.

## Proposed decision

**Option A** on the evidence, with one qualification: if production must start, the
cheapest place to accept this risk is Echo Forest (M07–M12), which needs no new host APIs
and is therefore the least expensive zone to rewrite. Accepting this record for Echo
Forest alone, and re-gating before Loop Lagoon, bounds the exposure to 6 missions rather
than 24.

A proposal is not an accepted decision. Nothing in Phase 11 may begin on this record
until the approval table below is signed.

## Evidence required

- Prototype or fixture: M01–M06 are shipped, replay-tested, and playable end to end from
  a production build.
- Device or browser matrix: **missing.** No target-device run
  ([E-09](../../evidence/phase-7/E-09-performance-report.md) describes a developer laptop).
- Child or curriculum observation: **missing, and this is what the record accepts.**
- Security or privacy review: the runner gate is closed
  ([E-08](../../evidence/phase-6/E-08-browser-worker-hostile-report.md)); the launch
  privacy review under DR-06 is open.
- Acceptance threshold: a named product owner signature below.

## Consequences

### Enables

- Phase 11 zone production may begin, for the zones named in the approval notes.

### Requires

- The playtest sessions still happen, before release, and the findings are applied
  retroactively to every zone authored under this record.
- Phase 12 cannot close while DR-04 remains in *Evidence gathering*.
- Every mission authored under this record is tagged in its notes as produced without
  playtest evidence, so a later fix pass can find them.

### Rejects or defers

- Defers the Phase 10 exit gate; does not remove it.
- Rejects any claim that the Meadow patterns are validated. They are accepted, not proven.

## Failure and rollback

The measurement that reopens this decision: the first moderated session in which a child
cannot complete M01 within 10 minutes without solution coaching, or any S1 accessibility
blocker. On either, content production stops and every mission authored under this record
is re-reviewed against the finding before any further zone begins.

Safe fallback: mission content is data, so reverting is a content change, not a code
change. No saved-code migration is required unless the mission *template* changed.

## Approval

| Role | Name | Decision | Date | Evidence link |
|---|---|---|---|---|
| Product |  |  |  |  |
| Technical |  |  |  |  |
| Curriculum |  |  |  |  |
| UX and accessibility |  |  |  |  |
| Privacy or legal, when applicable | n/a | n/a | n/a | not a privacy decision |

## Revision history

| Date | Change | Author |
|---|---|---|
| 2026-09-18 | Record created, proposing Option A with a bounded Option B fallback | |
| 2026-09-18 | Owner directed that Phase 11 production begin. Option B is in effect, unbounded rather than limited to Echo Forest. Every mission authored from here carries no playtest evidence and is listed in the consequences above for retroactive review. | |
