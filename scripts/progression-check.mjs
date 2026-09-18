#!/usr/bin/env node
/**
 * Phase 12 gate: every one of the 30 missions must succeed in a real browser,
 * from a fresh profile, in order, through the production build — the runner,
 * the animation playback, the progression unlocks and the per-mission URLs all
 * included. Replay tests prove the simulation; this proves the game.
 *
 * Routes come from the same CANONICAL_ROUTES the solvability tests use, so
 * there is exactly one place a route is authored.
 *
 * Usage:  pnpm progression-check      (expects apps/web/dist to be built)
 */
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { launchChrome } from './launch-chrome.mjs';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const dist = join(root, 'apps', 'web', 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const readRoutes = () => {
  const source = readFileSync(
    join(root, 'packages', 'test-fixtures', 'src', 'catalogue-solvable.test.ts'),
    'utf8',
  );
  const routes = new Map();
  for (const match of source.matchAll(/^\s+(m\d\d): \[([^\]]*)\]/gm)) {
    const kinds = [...match[2].matchAll(/'([a-zA-Z]+)'/g)].map((m) => m[1]);
    routes.set(match[1], kinds);
  }
  if (routes.size === 0) throw new Error('No canonical routes found.');
  return routes;
};

const serveDist = () =>
  new Promise((ready) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url, 'http://localhost');
      const file = join(dist, url.pathname === '/' ? 'index.html' : url.pathname);
      if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
        // Deep links to /mission/<id> need the app shell.
        response.writeHead(200, { 'content-type': 'text/html' });
        createReadStream(join(dist, 'index.html')).pipe(response);
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
  if (!existsSync(join(dist, 'index.html'))) {
    throw new Error('apps/web/dist is missing. Run `pnpm build` first.');
  }
  const routes = readRoutes();
  const { server, port } = await serveDist();
  const base = `http://localhost:${port}`;
  const browser = await launchChrome();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const results = [];

  try {
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Look at the map first' }).click();

    for (const [levelId, kinds] of [...routes.entries()].sort()) {
      const started = Date.now();
      await page.goto(`${base}/mission/${levelId}`, { waitUntil: 'networkidle' });
      const opened = await page
        .waitForSelector('.mission-code-editor .cm-content', { timeout: 30000 })
        .then(() => true)
        .catch(() => false);
      if (!opened) {
        results.push({ levelId, ok: false, detail: 'mission did not open (still locked?)', seconds: 0 });
        console.log(`FAIL  ${levelId}  did not open`);
        break;
      }
      const title = await page.locator('#mission-title').innerText();
      // Wait for the sandboxed runner to boot.
      await page
        .waitForFunction(
          () => {
            const button = [...document.querySelectorAll('button')].find((b) =>
              /Run my code|Run again/.test(b.textContent ?? ''),
            );
            return Boolean(button) && !button.disabled && button.getAttribute('aria-disabled') !== 'true';
          },
          null,
          { timeout: 60000 },
        )
        .catch(() => {});

      const editor = page.locator('.mission-code-editor .cm-content');
      await editor.click();
      await page.keyboard.press('ControlOrMeta+a');
      // insertText bypasses auto-closing brackets, so the source lands verbatim.
      await page.keyboard.insertText(kinds.map((kind) => `${kind}();`).join('\n') + '\n');
      await page.getByRole('button', { name: /^Run/ }).first().click();

      const won = await page
        .waitForSelector('.run-outcome--success', { timeout: 90000 })
        .then(() => true)
        .catch(() => false);
      const banner = (await page.locator('.run-outcome').first().innerText().catch(() => ''))
        .replace(/\n+/g, ' | ')
        .slice(0, 90);
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      results.push({ levelId, title, ok: won, detail: banner, seconds });
      console.log(`${won ? 'PASS' : 'FAIL'}  ${levelId} ${title.padEnd(26)} ${kinds.length.toString().padStart(2)} cmds  ${seconds}s`);
      if (!won) break;
    }
  } finally {
    await browser.close();
    server.close();
  }

  const failed = results.filter((r) => !r.ok);
  writeFileSync(
    join(root, 'docs', 'evidence', 'phase-12', 'E-11-full-progression.md'),
    `# E-11 — Full progression, production build

> Generated by \`pnpm progression-check\` (scripts/progression-check.mjs).
> A fresh profile plays every mission in order through the real runner, playback,
> unlock chain and per-mission URLs. Routes are the canonical routes from
> \`packages/test-fixtures/src/catalogue-solvable.test.ts\`.

Result: **${failed.length === 0 ? `all ${results.length} missions succeeded` : `${failed.length} FAILED`}**
Page errors: ${pageErrors.length === 0 ? 'none' : pageErrors.join('; ')}

| Mission | Outcome | Time | Banner |
|---|---|---:|---|
${results.map((r) => `| ${r.levelId} ${r.title ?? ''} | ${r.ok ? 'pass' : '**FAIL**'} | ${r.seconds}s | ${r.detail} |`).join('\n')}
`,
    'utf8',
  );

  console.log(`\n${results.length - failed.length}/${routes.size} missions succeeded`);
  if (failed.length > 0 || results.length < routes.size) process.exit(1);
};

await main();
