import { describe, expect, it } from 'vitest';

import {
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