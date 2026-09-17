# Contributing

CodeQuest 3D is a local-first 3D coding game for children ages 8 through 12. The
authoritative product, requirements, architecture, and delivery documents live
in `docs/`. Read those before touching code:

1. `docs/FEATURE_SPEC.md`
2. `docs/GAME_REQUIREMENTS_TEARDOWN.md`
3. `docs/LEVEL_DESIGN_30_MISSIONS.md`
4. `docs/IMPLEMENTATION_ARCHITECTURE.md`
5. `docs/COMPONENT_ARCHITECTURE.md`
6. `docs/IMPLEMENTATION_PLAN.md`

## Workspace layout

The repository is a pnpm workspace:

- `apps/web` — the only deployable. Vite app, React UI, R3F scene, dev-only
  Phase 2 spike lab at `/spikes/phase-2`.
- `packages/domain` — branded IDs, direction, type-only contracts. No browser
  imports.
- `packages/simulation` — pure deterministic reducers and validators. Depends
  only on `domain`.
- `packages/content` — authored mission data, copy, hints, examples. Depends
  only on `domain`.
- `packages/renderer` — R3F scene, camera, avatar adapters. Depends on
  `domain` and exposes React/Three.js peer deps.
- `packages/editor` — CodeMirror workspace, diagnostics, planning. Depends on
  `domain`.
- `packages/code-runner` — restricted-runner protocol and limits. Depends on
  `domain`.
- `packages/persistence` — IndexedDB repositories, migrations, recovery.
  Depends on `domain`.
- `packages/ui` — accessible shared HTML controls. Depends on `domain`.
- `packages/test-fixtures` — sample levels, command traces, save fixtures for
  unit and integration tests.

The full dependency graph is enforced by `scripts/check-package-boundaries.mjs`,
which runs as part of `pnpm lint`. Any cross-package import that is not
declared in the importing package's `package.json` fails the build.

## Scripts

From the repository root:

- `pnpm install` — installs workspace dependencies.
- `pnpm dev` — boots `apps/web` at `/`. Open `/spikes/phase-2` for the
  development-only evidence lab.
- `pnpm build` — `tsc -b` across the workspace, then `vite build` for
  `apps/web`.
- `pnpm typecheck` — type-checks every package without emitting.
- `pnpm test` — runs Vitest across every package with tests.
- `pnpm lint` — runs ESLint and the package-boundary check.
- `pnpm preview` — serves the production build of `apps/web` locally.

Three checks need a built `apps/web/dist` and a real browser. They use the system
Chrome when there is one and fall back to Playwright's Chromium:

- `pnpm hostile-check` — drives the **built** runner worker in a browser with hostile
  learner code and fails if anything escapes containment. This is a security gate and
  runs in CI; the coordinator's synthetic tests do not cover the transport.
- `pnpm perf-check` — frame profile, heap, time-to-runner-ready per quality tier, and
  the bundle budget. Fails if a quality tier changes whether the mission can be solved.
  Run it on a target device and commit the report it writes.
- `pnpm copy-check` — keyboard-only first run, focus indicators, 200% text, and
  reduced motion. Reading level and fault copy are unit tests instead, so they run with
  `pnpm test`.

Each writes a dated report under `docs/evidence/`.

## Adding a new dependency between packages

1. Add the dependency to the consuming package's `package.json` using the
   `workspace:*` protocol.
2. Add a TypeScript project reference in the consuming package's
   `tsconfig.json` so the new project builds in dependency order.
3. Add the reverse reference in `apps/web/tsconfig.json` when the app must
   import through the new boundary.
4. Run `pnpm lint` to confirm the boundary check still passes.

## Architectural rules (do not break)

1. The simulation owns game truth. React and Three.js display state; they do
   not decide mission results.
2. Mission content stays declarative. A mission package defines layouts,
   goals, copy, hints, and validators. A React component never contains a
   level answer.
3. One concept, one owner. Variants use props, composition, registries, or
   content data.
4. Accessibility has an equivalent surface. Canvas visuals have semantic HTML
   or SVG equivalents.
5. Package dependencies point inward. `domain` has no browser imports.
6. Production code never executes learner source in the page. Learner code
   runs only inside the sandboxed QuickJS worker from `packages/code-runner`,
   which hands the host bounded command requests; the host releases them into
   the simulation one animation boundary at a time. No regex-parsing of
   learner source, no direct `moveForward()` calls from React.

## Child safety

This is a product for children. Every change must keep:

- No account, analytics, telemetry, chat, public sharing, or remote API.
- No reference to personal data, location, contact, or free-text identity.
- Plain language. One action per instruction.
- Keyboard, focus, screen-reader, reduced-motion, and 200 percent text-scale
  paths.
- Failure that is reversible and explains the next safe action.

If a change opens a new capability, update the relevant decision record
under `docs/phase-1/decisions/` before implementation.
