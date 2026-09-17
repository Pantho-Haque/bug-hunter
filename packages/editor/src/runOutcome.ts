/**
 * Child-facing copy for a finished run. The simulation decides whether the
 * mission was solved; this module only turns its issue codes into one sentence
 * a player can act on.
 */

export interface ObjectiveIssueLike {
  readonly code: string;
  readonly message: string;
}

export interface RunOutcomeContext {
  readonly agentName: string;
  /** `mission.briefing.goal`, e.g. "Reach the beacon." */
  readonly goal: string;
}

export interface RunOutcome {
  readonly status: 'success' | 'incomplete';
  readonly headline: string;
  readonly detail: string;
}

const ISSUE_COPY: Readonly<Record<string, string>> = {
  'step-budget-exceeded': 'That route took too many steps. Try a shorter one.',
  'missing-collected': 'Something still needs collecting.',
  'missing-flag': 'Something in the world still needs switching on.',
  'state-invariant-failed': 'The route stopped somewhere else.',
  'wrong-terminal-cell': 'The route stopped somewhere else.',
  'missing-object': 'This mission is missing a piece. Tell a grown-up.',
  'unrecognized-state-invariant': 'This mission is missing a piece. Tell a grown-up.',
};

/** Most actionable advice first, so an overshoot reads as "too many steps". */
const ISSUE_PRIORITY: readonly string[] = [
  'step-budget-exceeded',
  'missing-collected',
  'missing-flag',
  'state-invariant-failed',
  'wrong-terminal-cell',
];

const rank = (code: string): number => {
  const index = ISSUE_PRIORITY.indexOf(code);
  return index === -1 ? ISSUE_PRIORITY.length : index;
};

export const describeRunOutcome = (
  issues: readonly ObjectiveIssueLike[],
  context: RunOutcomeContext,
): RunOutcome => {
  if (issues.length === 0) {
    return {
      status: 'success',
      headline: 'Goal reached!',
      detail: `${context.agentName} did it. ${context.goal}`,
    };
  }

  const leading = [...issues].sort((a, b) => rank(a.code) - rank(b.code))[0];
  return {
    status: 'incomplete',
    headline: 'Not there yet.',
    detail:
      ISSUE_COPY[leading.code] ?? `${context.agentName} did not finish the goal yet.`,
  };
};
