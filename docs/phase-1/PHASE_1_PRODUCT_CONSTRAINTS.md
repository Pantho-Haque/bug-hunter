---
meta:
  contentType: Reference
  phase: 1
  status: Proposed baseline
---

# Fix the Phase 1 product constraints

This document turns the CodeQuest 3D product intent into a testable baseline for technical spikes, curriculum work, and child playtests. It implements Phase 1 of the [implementation plan](../IMPLEMENTATION_PLAN.md). The feature, requirements, level, implementation, and component architecture documents remain authoritative for their respective concerns.

## Record the gate status

| Gate item | State | Required approver or evidence |
|---|---|---|
| Target learner and reading baseline | Product approved; curriculum review pending | Curriculum owner |
| Browser and device matrix | Product direction approved; physical tiers pending | Technical and accessibility owners |
| Child-safety and local-data boundary | Product approved; legal review pending | Privacy or legal reviewer |
| Success-measure rubric | Ready for pilot | Product, curriculum, and UX owners |
| DR-01 through DR-06 created | Complete | Decision owners named in the log |
| Phase 1 approval | Product approved; specialist approvals pending | Technical, curriculum, accessibility, and privacy roles |

The documentation work for Phase 1 is complete. Phase 2 may be prepared, but its device measurements must not be represented as accepted until the gate is signed.

## Define the target learner

### Primary audience

- Children ages 8 through 12
- Learners who can read short English instructions and type short code fragments
- First-time programmers and learners with limited prior block-coding experience
- Children playing independently after a brief adult setup on a shared school or family device

### Reading and instruction baseline

- Write player instructions for an approximate US Grade 3 to Grade 5 reading range
- Keep one instruction focused on one action
- Put the observable goal before the coding term
- Define a new coding term at first use while preserving exact JavaScript syntax
- Keep primary buttons to short verb phrases such as **Run code**, **Pause**, and **Try again**
- Provide read-aloud for briefings, goals, hints, errors, and recaps
- Never require narration or sound to understand the task
- Validate the final reading level through DR-04 child sessions rather than a readability score alone

### Curriculum boundary

Version 1 teaches sequences, facing and interaction, functions, loops, conditionals, variables, arrays, and debugging through the 30 authored missions. It does not attempt to teach the browser DOM, networking, packages, asynchronous application development, object-oriented architecture, or a general JavaScript curriculum.

## Fix the v1 product boundary

Version 1 is a local-first browser game with:

- Five authored zones and 30 required missions
- One shared full-body low-poly humanoid rig with boy and girl presentation presets
- Third-person exploration in small authored streets, paths, courtyards, bridges, and rooms
- A restricted JavaScript learning API that controls deterministic simulation
- A split or tabbed 3D playground and editor experience
- Local settings, progress, code drafts, backup, recovery, and offline installed content
- Personal progress, optional local challenge goals, cosmetics, and story restoration

Version 1 excludes:

- Accounts, authentication, cloud sync, analytics identifiers, and behavioral tracking
- Chat, messaging, public names, multiplayer, leaderboards, or user-generated public content
- Advertising, purchases, premium currency, loot boxes, streaks, or time pressure
- Open internet access, external packages, device APIs, or browser APIs from learner code
- Combat, weapons, health, death, crime themes, vehicles, traffic, or an unrestricted open city
- Procedural missions, general 3D level editing, native mobile apps, virtual reality, and consoles

Any excluded capability requires the scope-change process in the implementation plan and a privacy, security, curriculum, accessibility, and performance review.

## Define the operating context

- Primary setting: classroom, library, after-school program, or home learning space
- Typical session: 15 to 30 minutes
- Primary input: physical keyboard and pointing device
- Supported alternate input: touch for navigation and editor assistance where the device meets the matrix
- Expected network: unreliable after initial installation
- Expected device ownership: shared devices are common
- Expected adult role: install or open the game, assist with device access, and observe a research session; an adult should not need to explain a mission solution

## Fix the offline promise

After the application and installed mission content have loaded successfully once:

- Boot, onboarding, map, installed missions, editor help, settings, progress, and replay work without a network connection
- The game does not require login, remote validation, analytics, or a server to complete a mission
- Locally authored code and progress remain available unless browser storage is cleared or fails
- Export and import provide the recovery path for moving or preserving local progress
- Content that was never installed is identified as unavailable; the interface does not pretend it is cached
- Updates never silently discard code, progress, or the previous recovery snapshot

Phase 2 must prove storage and offline failure behavior before this promise becomes final.

## Set accessibility and comfort constraints

- Target WCAG 2.2 AA where applicable to the browser interface
- Provide a semantic HTML equivalent for mission state that appears in WebGL
- Support keyboard-only operation without positive `tabindex` values
- Use visible focus, programmatic names, and native controls where available
- Keep touch targets at least 44 by 44 CSS pixels
- Support 200 percent text zoom without loss of required controls or context
- Never communicate status using color, sound, animation, or spatial position alone
- Provide reduced-motion behavior and independent music, effects, and narration controls
- Keep flashes below three per second and make non-essential motion pausable
- Keep the code editor usable without requiring pointer precision

These constraints follow the project requirements and the retrieved modern web accessibility guidance. Automated checks supplement keyboard, screen-reader, zoom, and child usability testing; they do not replace it.

## Set performance and recovery constraints

- The minimum supported tier must maintain at least 30 rendered frames per second during the Phase 2 greybox benchmark
- Simulation results must not change with rendering frame rate or quality tier
- Editor input must remain responsive while the 3D scene is visible
- Cold mission loading target is 10 seconds or less; warm loading target is 5 seconds or less on the minimum tier
- A runaway learner program must not lock the page, lose the current draft, or prevent immediate editing after cancellation
- Low quality may reduce visual fidelity but never collision, objectives, commands, mission objects, minimap facts, or learning feedback
- Browser storage failure must preserve the last valid snapshot and offer an understandable recovery action

Detailed measurements live in the [device and browser matrix](DEVICE_BROWSER_MATRIX.md).

## Constrain launch geography

The product owner intends worldwide access rather than a country-limited release. That intent expands, rather than removes, the legal review: public availability remains blocked until DR-06 maps the supported jurisdictions and a qualified reviewer approves the resulting privacy posture.

The private pilot still follows the strictest current product boundary:

- Collect no account or contact data
- Ask no child for age, real name, school, location, or free-text profile identity
- Use preset call signs only
- Send no gameplay analytics or learner code off device
- Record playtest observations outside the product under the research protocol
- Obtain the required adult permission and child assent for each moderated research session

## Assign accountable roles

One person may hold multiple roles, but every approval records the role separately.

| Role | Phase 1 responsibility |
|---|---|
| Product owner | Audience, v1 boundary, offline promise, pilot type, and success targets |
| Technical lead | Device tiers, browser policy, measurable spike protocol, and technical feasibility |
| Curriculum owner | Reading range, concept order, hint model, and transfer task validity |
| UX and accessibility owner | Input parity, semantic alternatives, comfort, and blocker classification |
| Privacy or legal reviewer | Pilot practice, jurisdiction choice, notices, consent or assent, and public-launch posture |
| Research facilitator | Session script, observation consistency, safeguarding, and evidence handling |

## Complete the gate

Before Phase 2 results can be accepted, reviewers must:

1. Approve or amend the learner, reading, platform, offline, safety, and v1 scope statements.
2. Confirm that the required minimum devices can be obtained for testing.
3. Confirm the private pilot procedure and evidence-retention rules.
4. Assign a named owner to each decision record.
5. Record approval in the [Phase 1 gate record](PHASE_1_GATE.md).

## Record product approval

On 2026-09-14, the project owner approved the Phase 1 baseline, selected laptops as the primary platform, required responsive tablet and mobile support, and stated an intent for worldwide access. Exact physical device specifications and specialist approvals remain open. Phase 2 proof work is authorized to gather that missing evidence; it must not be treated as a final device, curriculum, accessibility, or public-launch approval.
