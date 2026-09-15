import { describe, expect, it } from 'vitest';

import { instrumentCommandSourceLines } from './source-mapping';

describe('instrumentCommandSourceLines', () => {
  it('passes each command its actual authored line, including repeated loop calls', () => {
    const source = ['const steps = 3;', 'for (let i = 0; i < steps; i += 1) {', '  moveForward();', '}'].join('\n');
    expect(instrumentCommandSourceLines(source, ['moveForward'])).toContain('moveForward(3, );');
  });

  it('does not rewrite command-like text in comments, strings, or member calls', () => {
    const source = ['// moveForward()', 'const hint = "moveForward()";', 'robot.moveForward();', 'moveForward();'].join('\n');
    expect(instrumentCommandSourceLines(source, ['moveForward'])).toBe([
      '// moveForward()',
      'const hint = "moveForward()";',
      'robot.moveForward();',
      'moveForward(4, );',
    ].join('\n'));
  });
});
