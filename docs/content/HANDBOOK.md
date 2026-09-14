# Content Authoring Handbook

CodeQuest 3D ships 30 missions across five zones. This handbook is the contract every mission package must satisfy before it lands in the registry.

## What a MissionPackage is

A mission is **pure data** declared in `packages/content/src/missions/<levelId>.ts`. The renderer, editor, runner, and HUD all consume the same `MissionPackageSchema` (`packages/domain/src/mission-package.ts`). No mission may ship with level-specific React components.

The schema is grouped into:

- **Identity** — `levelId`, `zoneId`, `apiVersion`, `contentVersion`, `ordinal`, `title`, `isCheckpoint`, `prerequisiteLevelIds`.
- **Zone + Curriculum** — `zoneId` (re-declared for index convenience) and a `learningContract` (`primaryConcept`, `newConcepts`, `priorConcepts`, optional `transferPrompt`).
- **State + Objects** — `startState` (avatar cell/facing, collected/inventory/flags, `stepCount`) and `objects[]` (one of seven discriminated-union kinds).
- **API surface** — `allowedApi[]` (each capability declares the mission it was unlocked from and the api version it belongs to).
- **Briefing** — child-facing story and goal copy, control affordances, checklist, optional read-aloud string.
- **Starter code** — the literal JavaScript the player starts with.
- **Hints** — exactly four `hintSchema` entries, `stage` 1–4, each with a `prompt` and optionally `reveal`/`scaffold`.
- **Analogous example** — a small `exampleMissionSchema` to bridge concept learning.
- **Completion contract** — `stateInvariants` (≥1), `requiredObjectIds`, `requiredFlags`, `requiredCollected`, optional `terminalCell`, optional `reflectionQuestion`.
- **Concept evidence** — the rules the runtime emits to confirm concept learning: a mix of `syntaxRuleSchema` (kind + threshold) and `traceRuleSchema` (expected sequence).
- **Known solutions** — ≥1 source-traceable script with `expectedCommandCount` and `expectedStepCount`.
- **Expected failures** — failure fixtures that pin the simulation engine's `expectedFault` enum to specific reason keys.
- **Accessibility** — keyboard, touch, captions, text-scale, reduced-motion, and screen-reader notes.
- **Budgets** — `maxCommands`, `maxStepCount`, `maxMissionObjects` (default 30), `maxTriangles` (default 12000), `estimatedActiveMinutes` (must be ≤15).
- **Rewards** — optional `missionRewardSchema` entries (each carries a `rewardId`, `assetId`, label, and `cosmetic` flag).

## Authoring workflow

1. **Draft** the mission in your editor of choice, writing TypeScript-typed JS objects.
2. **Run the validators** locally:
   ```bash
   pnpm --filter @codequest/content test
   pnpm --filter @codequest/domain test
   ```
3. **Run the registry parse** by booting `pnpm --filter @codequest/web dev` and visiting `/spikes/phase-2`. The content registry throws at startup if a fixture fails `missionPackageSchema.safeParse(...)`.
4. **Run `validateMissionPackage`** from `packages/content/src/validation.ts`. It produces a `ValidationResult` with `ok: boolean` and a list of `ValidationIssue` entries (codes listed below).
5. **Commit** the new fixture and any handbook updates together.

## Validation gates

`validateMissionPackage` checks every mission against these rules:

| Code | Meaning | Suggested fix |
|---|---|---|
| `invalid-id` | An id failed the kebab-case pattern | Rename to match `^[a-z0-9][a-z0-9-]*$` |
| `duplicate-object-id` | Two objects share the same id | Rename one of them |
| `duplicate-hint-id` | Two hints share the same `hintId` | Use distinct stage ids |
| `unreachable-goal` | BFS from spawn cannot reach the goal | Remove blockers or move goal |
| `missing-hints` | Fewer than four hints | Provide exactly four hints |
| `unknown-reward-asset` | Reward asset not registered (only flagged when caller passes a registry) | Register the asset first |
| `incompatible-api-version` | A capability declares a different `apiVersion` than the mission | Bump the mission `apiVersion` |
| `starter-code-empty` | `starterCode` is blank | Provide a starter snippet |
| `briefing-controls-empty` | No controls listed | Add at least one control affordance |

## Schema versioning policy

Each `MissionPackage` carries `identity.apiVersion` and `identity.contentVersion`. The rules:

- **Patch** edits to copy, hints, or starter code: bump `contentVersion` (e.g. `2025.01` → `2025.02`).
- **Adds or removes** an object, hint, allowed API capability, or completion invariant: bump `contentVersion` and add an entry to the migration log inside `contentMeta`.
- **Schema shape** changes (a new `MissionObject` kind, a new field on `completionContract`, a new `expectedFault` enum value): bump the **schema version** tracked in `packages/domain/ids.ts` and the `schemaVersion` field on every persisted record.

The `persistence` package owns `MigrationStep<...>` chains (`CURRENT_*_VERSION` constants in `packages/persistence/src/migrations.ts`). When a schema version moves, append a step that converts the previous shape to the next.

## M01 — the canonical reference

`packages/content/src/missions/m01-first-steps.ts` is the smallest complete mission (straight route, three cells, beacon). It is the reference fixture every author should clone first.

- 2 known solutions (`sol-m01-straight`, `sol-m01-fan`)
- 3 failure fixtures (too few moves, wrong facing, runaway loop)
- 4 hints (open prompt → scaffolded snippet → revealed solution)
- 1 reward (`reward-first-step`)
- 3 objects (spawn, goal, decor grass)
- `estimatedActiveMinutes: 3`

The registry exposes `contentRegistry.getMission(levelId('m01'))` for downstream consumers.

## Tooling surface

- `missionPackageSchema` (domain): parse + serialize.
- `validateMissionPackage` (content): structural + reachability + budget checks.
- `migrateRecord` / `migrateSettings` / `migrateProgress` / `migrateLevelCode` / `migrateBackup` / `migrateContentMeta` (persistence): forward-only schema upgrades.
- `createMissionFixture` (test-fixtures): seeds a `SimulationState` from a mission's `startState` for headless replay tests in Phase 5.

Any new consumer must read from one of these — never reach into the registry's internal `Map`.
