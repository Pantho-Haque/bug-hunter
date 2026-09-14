# CodeQuest 3D

CodeQuest 3D is a docs-first prototype for a local, browser-based JavaScript adventure for children ages 8 through 12. The target experience lets player code control a third-person avatar across 30 authored missions.

## Run locally

```bash
pnpm install
pnpm dev
```

## Current implementation

The repository contains an interactive five-zone map that previews all 30 mission tasks and a real WebGL Mission 01 scene. The Starter includes a higher-detail procedural low-poly avatar, boy and girl presentation presets, a third-person follow camera, a training street with buildings and landmarks, manual exploration controls, and a glowing code objective.

The Starter recognizes `moveForward()` calls for one visual route demonstration. It does not execute general JavaScript, save data, validate production missions, load final character assets, or implement progression. Do not treat its lightweight parser or primitive geometry as production architecture.

## Documentation

Read the documents in this order:

1. [Feature specification](docs/FEATURE_SPEC.md): player experience and acceptance contracts
2. [Requirements teardown](docs/GAME_REQUIREMENTS_TEARDOWN.md): product scope, safety, privacy, and quality requirements
3. [Thirty-mission level design](docs/LEVEL_DESIGN_30_MISSIONS.md): curriculum and mission contracts
4. [Implementation architecture](docs/IMPLEMENTATION_ARCHITECTURE.md): package and runtime boundaries
5. [Component architecture](docs/COMPONENT_ARCHITECTURE.md): component ownership, file structure, and requirement traceability
6. [Implementation plan](docs/IMPLEMENTATION_PLAN.md): delivery phases and evidence gates
