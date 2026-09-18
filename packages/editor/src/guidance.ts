import type {
  DirectionSchema,
  MissionPackageSchema,
  RunEventSchema,
  SimulationStateSchema,
} from '@codequest/domain';

/**
 * Turns "what the simulation found missing" into what a child can do next, in
 * the avatar's own voice. Every sentence names the thing, the place, and the
 * command — never just "not there yet".
 */
export interface GuidanceInput {
  readonly mission: MissionPackageSchema;
  readonly state: SimulationStateSchema;
  readonly issues: readonly { readonly code: string; readonly path: string }[];
  readonly lastEvent?: RunEventSchema;
}

export interface Guidance {
  /** The single most useful next step, short enough for a speech bubble. */
  readonly headline: string;
  /** Everything still missing, in the order worth fixing. */
  readonly steps: readonly string[];
}

const ORDER: readonly DirectionSchema[] = ['north', 'east', 'south', 'west'];

const labelOf = (mission: MissionPackageSchema, id: string): string =>
  mission.objects.find((object) => object.id === id)?.label ?? id;

const interactableIdFromFlag = (flag: string): string | null => {
  const match = /^interactable\.(.+)\.state$/.exec(flag);
  return match ? match[1] : null;
};

const canTurn = (mission: MissionPackageSchema): boolean =>
  mission.allowedApi.some((ref) =>
    ['cap-turn', 'cap-move-and-turn', 'cap-everything'].includes(ref.capabilityId),
  );

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** "2 cells east and 1 cell north", with the facing advice to get there. */
const routeTo = (
  mission: MissionPackageSchema,
  state: SimulationStateSchema,
  target: { readonly cellX: number; readonly cellZ: number },
  targetLabel: string,
): string => {
  const dx = target.cellX - state.avatar.cellX;
  const dz = target.cellZ - state.avatar.cellZ;
  if (dx === 0 && dz === 0) return `I am standing on the ${targetLabel}.`;
  const parts: string[] = [];
  if (dx !== 0) parts.push(`${plural(Math.abs(dx), 'cell')} ${dx > 0 ? 'east' : 'west'}`);
  if (dz !== 0) parts.push(`${plural(Math.abs(dz), 'cell')} ${dz < 0 ? 'north' : 'south'}`);
  const where = `The ${targetLabel} is ${parts.join(' and ')} from me.`;

  const needed: DirectionSchema =
    Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? 'east' : 'west') : dz < 0 ? 'north' : 'south';
  if (state.avatar.facing === needed) {
    return `${where} I am facing ${needed}, so moveForward() will take me closer.`;
  }
  if (!canTurn(mission)) {
    return `${where} I can only walk the way I face in this mission, so I need a straight path.`;
  }
  const turns = (ORDER.indexOf(needed) - ORDER.indexOf(state.avatar.facing) + 4) % 4;
  const turn = turns === 1 ? 'turnRight()' : turns === 3 ? 'turnLeft()' : 'two turns';
  return `${where} I am facing ${state.avatar.facing}, so I need ${turn} first, then moveForward().`;
};

const explainRejection = (
  mission: MissionPackageSchema,
  event: Extract<RunEventSchema, { type: 'commandRejected' }>,
): string | null => {
  const line = `line ${event.sourceLine}`;
  const blocker = mission.objects.find(
    (object) => object.kind === 'blocker' && object.reasonKey === event.reasonKey,
  );
  if (blocker && blocker.kind === 'blocker') {
    const opener = blocker.unlockedByFlag ? interactableIdFromFlag(blocker.unlockedByFlag) : null;
    if (opener) {
      return `The ${blocker.label} stopped me at ${line}. It only opens after I use the ${labelOf(mission, opener)} — stand right in front of it and call interact() first.`;
    }
    return `The ${blocker.label} stopped me at ${line}. I need to go around it, so a turn is needed before that step.`;
  }
  switch (event.reasonKey) {
    case 'scenery.blocks':
      return `Something was in my way at ${line}. I need to go around it.`;
    case 'collect.nothing-here':
      return `There was nothing to pick up where I stood at ${line}. Walk onto the item first, then call collect().`;
    case 'collect.already-collected':
      return `I had already picked that up before ${line}. That collect() is not needed.`;
    case 'interact.nothing-here':
      return `There was nothing to use in front of me at ${line}. Face the object first, then call interact().`;
    case 'interact.wrong-facing':
      return `I was not facing it at ${line}. Turn to face it, then call interact().`;
    case 'interact.out-of-range':
      return `It was too far away at ${line}. Walk closer, then call interact().`;
    default:
      return null;
  }
};

export const describeGuidance = ({ mission, state, issues, lastEvent }: GuidanceInput): Guidance => {
  const steps: string[] = [];

  if (lastEvent?.type === 'commandRejected') {
    const why = explainRejection(mission, lastEvent);
    if (why) steps.push(why);
  }

  for (const issue of issues) {
    const inside = /\[(.+)\]$/.exec(issue.path)?.[1];
    if (issue.code === 'missing-flag' && inside) {
      const id = interactableIdFromFlag(inside);
      if (id) {
        steps.push(
          `I have not used the ${labelOf(mission, id)} yet. Stand right in front of it and call interact().`,
        );
      }
    } else if (issue.code === 'missing-collected' && inside) {
      steps.push(
        `I have not picked up the ${labelOf(mission, inside)} yet. Walk onto it and call collect().`,
      );
    } else if (issue.code === 'step-budget-exceeded') {
      steps.push(
        `That took ${state.stepCount} steps and this mission allows ${mission.budgets.maxStepCount}. A shorter route will do it.`,
      );
    }
  }

  const goal = mission.objects.find((object) => object.kind === 'goal');
  const notAtGoal = issues.some(
    (issue) => issue.code === 'wrong-terminal-cell' || issue.code === 'state-invariant-failed',
  );
  if (notAtGoal && goal && goal.kind === 'goal') {
    steps.push(routeTo(mission, state, goal.cell, goal.label));
  }

  if (steps.length === 0) steps.push('I am not sure what is missing. A hint might help.');

  // A step that names the thing still to do beats one that explains the stop:
  // "use the lever" is the answer; "the gate stopped me" is the symptom.
  const headline = steps.find((step) => /^I have not/.test(step)) ?? steps[0];
  return { headline, steps };
};
