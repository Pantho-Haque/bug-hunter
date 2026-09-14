import type { MissionPackageSchema } from '@codequest/domain';

import {
  runnerCapabilitiesSchema,
  type RunnerCapabilitiesSchema,
  type RunnerCommandKind,
} from './protocol';

const COMMAND_KIND_BY_CAPABILITY: ReadonlyMap<string, readonly RunnerCommandKind[]> = new Map([
  ['cap-move-forward', ['moveForward']],
  ['cap-turn', ['turnLeft', 'turnRight']],
  ['cap-collect', ['collect']],
  ['cap-interact', ['interact']],
  ['cap-move-and-turn', ['moveForward', 'turnLeft', 'turnRight']],
  ['cap-everything', ['moveForward', 'turnLeft', 'turnRight', 'collect', 'interact']],
]);

export const resolveCapabilities = (
  mission: MissionPackageSchema,
): RunnerCapabilitiesSchema => {
  const allowed = new Set<RunnerCommandKind>();
  for (const ref of mission.allowedApi) {
    if (ref.apiVersion !== mission.identity.apiVersion) continue;
    const mapped = COMMAND_KIND_BY_CAPABILITY.get(ref.capabilityId);
    if (mapped) {
      for (const kind of mapped) allowed.add(kind);
    }
  }
  if (allowed.size === 0) {
    throw new Error(
      `Mission ${mission.identity.levelId} does not declare a recognized learning API capability for ${mission.identity.apiVersion}.`,
    );
  }
  return runnerCapabilitiesSchema.parse({
    apiVersion: mission.identity.apiVersion,
    allowedCommandKinds: [...allowed],
    allowLogs: true,
  });
};

export const isCommandAllowed = (
  capabilities: RunnerCapabilitiesSchema,
  kind: RunnerCommandKind,
): boolean => capabilities.allowedCommandKinds.includes(kind);

export const capabilityManifest = (): readonly {
  readonly id: string;
  readonly unlocks: readonly RunnerCommandKind[];
}[] => {
  const manifest: { id: string; unlocks: readonly RunnerCommandKind[] }[] = [];
  for (const [id, unlocks] of COMMAND_KIND_BY_CAPABILITY.entries()) {
    manifest.push({ id, unlocks: [...unlocks] });
  }
  return manifest;
};
