# E-03 — Phase 4 Contract Test Report

> Phase 4 deliverable: every MissionPackage field must trace to a consumer (renderer, runner, HUD, persistence) and at least one test.

## Schema layer

| Domain field | Type | Consumer | Test |
|---|---|---|---|
| `MissionPackage.identity` | `missionIdentitySchema` | Map, save metadata, telemetry | `missionIdentitySchema.safeParse` cases in `packages/domain/src/mission-package.test.ts` |
| `MissionPackage.curriculum` | `learningContractSchema` | Briefing HUD, concept-evidence runner | `conceptEvidenceSchema` cases in the same suite |
| `MissionPackage.startState` | `simulationStateSchema` | Simulation reducer (Phase 5), renderer spawn | `simulationStateSchema` cases in `packages/domain/src/cells.ts`-adjacent tests |
| `MissionPackage.objects[]` | discriminated union of seven kinds | Renderer scene graph, runner state machine | `missionObjectSchema` cases |
| `MissionPackage.allowedApi[]` | `apiCapabilityRefSchema` | Code runner bridge, editor sidebar | `apiCapabilityRefSchema` case |
| `MissionPackage.briefing` | `briefingContentSchema` | Briefing HUD, audio narration | `briefingContentSchema` shape covered by M01 fixture |
| `MissionPackage.starterCode` | string | CodeMirror document model | Starter length assertions in `m01FirstSteps` |
| `MissionPackage.hints` | 4-tuple | Hint panel UI, audio prompts | `hintSchema` stage constraint |
| `MissionPackage.analogousExample` | `exampleMissionSchema` | Briefing companion card | M01 fixture assertion |
| `MissionPackage.completion` | `completionContractSchema` | Validator adapter (Phase 5), recap screen | `completionContractSchema` cases |
| `MissionPackage.conceptEvidence` | syntax or trace rule | Concept evidence reporter | `syntaxRuleSchema` / `traceRuleSchema` cases |
| `MissionPackage.knownSolutions[]` | `knownSolutionSchema[]` (≥1) | Replay suite (Phase 5), rubric engine | `m01-fixture.test.ts` asserts ≥2 |
| `MissionPackage.expectedFailures[]` | `failureFixtureSchema[]` | Hostile snippet tests, regression suite | `m01-fixture.test.ts` asserts ≥3 |
| `MissionPackage.accessibility` | `accessibilityNotesSchema` | Settings, renderer | M01 fixture |
| `MissionPackage.budgets` | `missionBudgetsSchema` | Runner, renderer, telemetry | `missionPackageSchema.safeParse` budget case |
| `MissionPackage.rewards[]` | `missionRewardSchema[]` | Progress, collection room | M01 fixture |

## Persistence layer

| Record | Schema | Consumer | Test |
|---|---|---|---|
| `settings` | `settingsRecordSchema` | Boot screen, settings panel | `packages/persistence/src/schemas.test.ts` |
| `progress` | `progressRecordSchema` | Map, recap, onboarding resume | same |
| `levelCode` | `levelCodeRecordSchema` | CodeMirror autosave, restore | same |
| `backup` | `backupRecordSchema` | Settings → data, recovery dialog | same |
| `contentMeta` | `contentMetaRecordSchema` | Migration runner, cache invalidation | same |
| `persistenceEnvelope` | `persistenceEnvelopeSchema` | Export / import flows | same |

Migration policy lives in `packages/persistence/src/migrations.ts`. Each record has its own `MigrationStep<unknown, T>[]` chain plus a `CURRENT_*_VERSION` constant. New steps must end-to-end migrate and re-parse against the schema; the helper throws when the migrated value does not validate.

## Content layer

| Module | Purpose | Test |
|---|---|---|
| `packages/content/src/registry.ts` | Exposes `contentRegistry` (zones + missions Map) | Boot-time safeParse |
| `packages/content/src/missions/m01-first-steps.ts` | Canonical M01 fixture | `m01-fixture.test.ts` (6 cases) |
| `packages/content/src/validation.ts` | `validateMissionPackage` gate suite | `validation.test.ts` (9 cases) |

## Result

```
pnpm --filter @codequest/domain    test → 29 passed
pnpm --filter @codequest/persistence test → 14 passed
pnpm --filter @codequest/content   test → 9 passed
pnpm --filter @codequest/test-fixtures test → 16 passed
```

Schema, registry, validator, and persistence schemas all green. M01 has zero structural or reachability issues, and every gate-test failure mode (invalid id, duplicate object, unreachable goal, missing hints, unknown reward, incompatible api version, malformed starter code, briefing controls) has a representative failing input and a passing fix path.

## Open items for Phase 5

1. Wire `validateMissionPackage` into a CI step (currently only runs on `pnpm -r test`).
2. Add a JSON Schema export for tooling that doesn't import TypeScript.
3. Generate per-mission traceability rows for M02–M06 once they ship.
