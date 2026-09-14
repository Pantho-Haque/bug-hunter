---
meta:
  contentType: Decision
  decisionId: DR-06
  status: Evidence gathering
---

# Decide launch countries and privacy posture

## Status

- State: Evidence gathering
- Owner: Product owner and privacy or legal reviewer, names pending
- Required reviewers: Technical, research, accessibility, and curriculum owners
- Blocks: Public release, recruitment process, notices, and any future remote feature

## Decision question

In which countries may CodeQuest 3D be piloted and publicly released, and what country-specific child privacy, consumer, accessibility, education, and research obligations apply?

## Current constraint

The product owner intends to make CodeQuest 3D available worldwide rather than restricting it to one pilot country. No public launch jurisdiction is legally approved yet. Development may continue and a private supervised pilot may be planned only under an approved local research protocol. A contributor location, hosting location, or browser locale does not select a jurisdiction.

## Privacy-by-default proposal

- No accounts, authentication, remote profiles, analytics identifiers, or behavioral telemetry
- No real names, age fields, school, contact data, location, face, voice, or free-text child identity
- Preset call signs and appearance identifiers stored locally
- Settings, progress, level code, and one recovery snapshot stored locally and versioned
- No network access from learner code and no undocumented application requests
- User-initiated local export and validated import
- Separate, permissioned, time-limited research records outside the product

## Evidence required

- Product confirms whether worldwide access means every country at first release or a staged set of regions. The current intent is worldwide access.
- A qualified reviewer identifies applicable law and required notices, permission, assent, retention, deletion, support, and incident processes.
- Technical review confirms actual data flow and network behavior match the proposed boundary.
- Research review approves recruitment, observation, optional recording, safeguarding, and deletion practices.
- Accessibility and curriculum reviewers confirm localized copy and access needs for each approved launch context.

## Scope-change trigger

Any account, cloud save, analytics, AI tutor, sharing, user upload, communication, third-party service, or remote content feature reopens this decision before implementation. It also requires an updated threat model, data inventory, user notice, consent analysis, recovery model, and deletion path.

## Approval

| Role | Name | Decision | Date | Evidence link |
|---|---|---|---|---|
| Product |  |  |  |  |
| Privacy or legal |  |  |  |  |
| Technical |  |  |  |  |
| Research |  |  |  |  |
| UX and accessibility |  |  |  |  |
