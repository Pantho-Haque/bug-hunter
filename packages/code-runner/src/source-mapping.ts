const identifierStart = /[A-Za-z_$]/;
const identifierPart = /[A-Za-z0-9_$]/;

/**
 * Adds the original source line as the first argument to capability calls.
 *
 * This is deliberately a tiny lexical pass rather than a JavaScript parser: it
 * preserves all newlines (so QuickJS diagnostics remain valid), ignores strings
 * and comments, and only rewrites direct calls to host-provided commands.
 */
export const instrumentCommandSourceLines = (
  source: string,
  commandNames: readonly string[],
): string => {
  const commands = new Set(commandNames);
  let result = '';
  let index = 0;
  let line = 1;
  let state: 'code' | 'lineComment' | 'blockComment' | 'single' | 'double' | 'template' = 'code';

  const append = (value: string) => {
    result += value;
    line += [...value].filter((character) => character === '\n').length;
  };

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];

    if (state === 'lineComment') {
      append(character);
      index += 1;
      if (character === '\n') state = 'code';
      continue;
    }
    if (state === 'blockComment') {
      append(character);
      index += 1;
      if (character === '*' && next === '/') {
        append(next);
        index += 1;
        state = 'code';
      }
      continue;
    }
    if (state === 'single' || state === 'double' || state === 'template') {
      append(character);
      index += 1;
      if (character === '\\' && index < source.length) {
        append(source[index]);
        index += 1;
      } else if ((state === 'single' && character === "'") || (state === 'double' && character === '"') || (state === 'template' && character === '`')) {
        state = 'code';
      }
      continue;
    }

    if (character === '/' && next === '/') {
      append('//');
      index += 2;
      state = 'lineComment';
      continue;
    }
    if (character === '/' && next === '*') {
      append('/*');
      index += 2;
      state = 'blockComment';
      continue;
    }
    if (character === "'") { append(character); index += 1; state = 'single'; continue; }
    if (character === '"') { append(character); index += 1; state = 'double'; continue; }
    if (character === '`') { append(character); index += 1; state = 'template'; continue; }

    if (!identifierStart.test(character)) {
      append(character);
      index += 1;
      continue;
    }

    const start = index;
    index += 1;
    while (index < source.length && identifierPart.test(source[index])) index += 1;
    const identifier = source.slice(start, index);
    const before = source.slice(0, start).trimEnd().at(-1);
    let callIndex = index;
    while (/\s/.test(source[callIndex] ?? '')) callIndex += 1;
    const isDirectCommand = commands.has(identifier) && before !== '.' && source[callIndex] === '(';
    append(identifier);
    if (isDirectCommand) {
      append(source.slice(index, callIndex + 1));
      result += `${line}, `;
      index = callIndex + 1;
    }
  }
  return result;
};
