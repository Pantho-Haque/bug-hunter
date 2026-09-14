import type { RunFaultSchema } from '@codequest/domain';
import { runFaultSchema } from '@codequest/domain';

export interface FaultPresentation {
  readonly childCopy: string;
  readonly technicalDetail: string;
  readonly nextAction: 'retry' | 'remove-line' | 'reset' | 'contact-support';
}

export const FAULT_PRESENTATIONS: Readonly<Record<RunFaultSchema['code'], FaultPresentation>> = {
  timeout: {
    childCopy: 'Your code took too long to finish. Maybe it ran in circles?',
    technicalDetail: 'The runner hit its deadline before your code returned.',
    nextAction: 'reset',
  },
  memory: {
    childCopy: 'Your code used too much memory.',
    technicalDetail: 'The runtime ran out of memory while running your code.',
    nextAction: 'remove-line',
  },
  syntax: {
    childCopy: "There's a typo in your code. Try the hint to fix it.",
    technicalDetail: 'Your code did not parse before it could run.',
    nextAction: 'retry',
  },
  blockedApi: {
    childCopy: 'That helper is locked for this level.',
    technicalDetail: 'The code asked for a capability the mission does not allow.',
    nextAction: 'remove-line',
  },
  commandLimit: {
    childCopy: 'That program has too many actions for this mission.',
    technicalDetail: 'The command queue exceeded the mission command budget.',
    nextAction: 'remove-line',
  },
  cancelled: {
    childCopy: 'Run stopped early.',
    technicalDetail: 'The run was cancelled before it finished.',
    nextAction: 'retry',
  },
};

export const mapRunnerFault = (
  code: RunFaultSchema['code'],
  options: { readonly sourceLine?: number; readonly reasonKey?: string } = {},
): { readonly fault: RunFaultSchema; readonly presentation: FaultPresentation } => {
  const presentation = FAULT_PRESENTATIONS[code];
  const reasonKey = options.reasonKey ?? `run.${code}`;
  const fault = runFaultSchema.parse({
    type: 'runFault',
    code,
    sourceLine: options.sourceLine,
    reasonKey,
  });
  return { fault, presentation };
};
