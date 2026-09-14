---
meta:
  contentType: Decision
  decisionId: DR-03
  status: Approved for implementation
---

# Decide how learning API calls advance time

## Status

- State: Approved for implementation
- Owner: Product owner
- Required reviewers: Security, gameplay, and UX owners
- Blocks: Starter code, examples, snippets, runner protocol, and the first zone

## Decision question

Should early missions use queued synchronous-looking calls or require explicit `await` for each action?

## Approved decision

Use queued calls in v1 learning content:

```js
moveForward();
turnRight();
moveForward();
collect();
```

The restricted runtime records approved commands in source order. The coordinator validates the immutable queue, then the simulation executes one atomic command at a time. A predicate reads deterministic simulated state defined by the runner contract, never animation state.

Early missions introduce the game API with direct calls. Higher missions introduce advanced JavaScript through the existing curriculum: functions, loops, conditionals, arrays, objects, debugging, and composition. Advanced JavaScript changes how players express a plan; it does not grant browser access or bypass the queued command contract. `await` remains out of scope until a later API-version decision explicitly adds it.

## Why

- It keeps early lessons focused on sequence, functions, loops, conditionals, variables, arrays, and debugging.
- It avoids teaching promises and async control before the stated curriculum requires them.
- It gives the host a complete command list for validation, budgets, replay, Pause, and Step.

## Rejected behavior

- Never mix queued calls and `await` across missions.
- Never let an API call directly mutate React, Three.js, persistence, or browser state.
- Never infer command order from animation completion.

## Evidence required

- Compare queued and `await` prototypes with curriculum review.
- Test loops, conditional predicates, blocked commands, cancellation, command budgets, and source ranges.
- Security review must confirm that queue construction cannot expose host capabilities or bypass coordinator validation.
- Child observation must show that source order and world order are understandable.

## Failure and migration

If state-dependent code cannot be explained consistently with the queued model, reopen the decision before mission schemas and saved code lock. A switch to `await` requires one API-version migration across every example, hint, mission solution, completion item, and saved source fixture.

## Approval

| Role | Name | Decision | Date | Evidence link |
|---|---|---|---|---|
| Product | Project owner | Approved for implementation | 2026-09-15 | Product direction in this thread |
| Technical |  |  |  |  |
| Curriculum |  |  |  |  |
| Security |  |  |  |  |
