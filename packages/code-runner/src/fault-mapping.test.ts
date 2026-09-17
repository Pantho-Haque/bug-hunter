import { describe, expect, it } from 'vitest';

import {
  classifyEvaluationFault,
  FAULT_PRESENTATIONS,
  mapRunnerFault,
} from './fault-mapping';

describe('mapRunnerFault', () => {
  it.each(['timeout', 'memory', 'syntax', 'blockedApi', 'cancelled'] as const)(
    'maps %s to a domain runFault with reasonKey run.<code>',
    (code) => {
      const result = mapRunnerFault(code);
      expect(result.fault.type).toBe('runFault');
      expect(result.fault.code).toBe(code);
      expect(result.fault.reasonKey).toBe(`run.${code}`);
    },
  );

  it('honors a custom reason key and source line', () => {
    const result = mapRunnerFault('memory', { sourceLine: 7, reasonKey: 'run.memory.budget-exhausted' });
    expect(result.fault.sourceLine).toBe(7);
    expect(result.fault.reasonKey).toBe('run.memory.budget-exhausted');
  });

  it('includes a childCopy/technicalDetail/nextAction for every code', () => {
    for (const code of ['timeout', 'memory', 'syntax', 'blockedApi', 'cancelled'] as const) {
      expect(FAULT_PRESENTATIONS[code]).toBeDefined();
      const presentation = mapRunnerFault(code).presentation;
      expect(presentation.childCopy.length).toBeGreaterThan(0);
      expect(presentation.technicalDetail.length).toBeGreaterThan(0);
      expect(['retry', 'remove-line', 'reset', 'contact-support']).toContain(presentation.nextAction);
    }
  });
});
describe('classifyEvaluationFault', () => {
  const live = { cancelled: false, startedAt: performance.now(), deadlineMs: 5000 };

  it('reads a blocked global as blockedApi, not as a typo', () => {
    expect(classifyEvaluationFault("ReferenceError: 'fetch' is not defined", live, 0, 4096)).toBe(
      'blockedApi',
    );
  });

  it('still reports a real parse error as syntax', () => {
    expect(classifyEvaluationFault('unexpected token', live, 0, 4096)).toBe('syntax');
  });

  it('prefers cancellation and deadline over the message', () => {
    expect(classifyEvaluationFault('anything', { ...live, cancelled: true }, 0, 4096)).toBe('cancelled');
    expect(classifyEvaluationFault('anything', live, 4096, 4096)).toBe('timeout');
  });
});
