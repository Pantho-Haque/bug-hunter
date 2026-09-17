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

  it('instruments a command that follows a comment ending in a full stop', () => {
    // A comment's final "." used to look like a member access, so the next call
    // lost its line argument and the runner crashed with a misleading "typo".
    const source = '// Plan your route first, then write it.\nmoveForward();\n';
    expect(instrumentCommandSourceLines(source, ['moveForward'])).toBe(
      '// Plan your route first, then write it.\nmoveForward(2, );\n',
    );
  });

  it('still refuses to instrument a real member call after a comment', () => {
    const source = '// go east.\nrobot.moveForward();\nmoveForward();\n';
    expect(instrumentCommandSourceLines(source, ['moveForward'])).toBe(
      '// go east.\nrobot.moveForward();\nmoveForward(3, );\n',
    );
  });

  it('is not fooled by a full stop inside a string', () => {
    const source = 'const note = "turn left.";\nmoveForward();\n';
    expect(instrumentCommandSourceLines(source, ['moveForward'])).toBe(
      'const note = "turn left.";\nmoveForward(2, );\n',
    );
  });
});
