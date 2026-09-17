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

export interface EvaluationFaultContext {
  readonly cancelled: boolean;
  readonly startedAt: number;
  readonly deadlineMs: number;
}

/**
 * Classifies a raw runtime error message into a child-facing fault code.
 * `message` must carry the error name ("ReferenceError: fetch is not defined");
 * QuickJS keeps the name off the message, so the caller joins them first.
 */
export const classifyEvaluationFault = (
  message: string,
  context: EvaluationFaultContext,
  interruptChecks: number,
  maxInstructions: number,
): RunFaultSchema['code'] => {
  if (context.cancelled) return 'cancelled';
  if (
    performance.now() - context.startedAt > context.deadlineMs ||
    interruptChecks >= maxInstructions
  ) {
    return 'timeout';
  }
  if (/command budget exceeded/i.test(message)) return 'commandLimit';
  if (/out of memory|stack/i.test(message)) return 'memory';
  if (/referenceerror|is not defined|is not a function/i.test(message)) return 'blockedApi';
  return 'syntax';
};
