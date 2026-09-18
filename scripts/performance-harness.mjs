#!/usr/bin/env node
/**
 * Phase 7/9 performance evidence, measured on whatever device runs it.
 *
 * The numbers that matter come from a low-end target device, not a developer
 * laptop, so this is written to be handed to whoever has the Chromebook: build,
 * run one command, commit the report it writes.
 *
 * Usage:  pnpm perf-check            (expects apps/web/dist to be built)
 */
import { createReadStream, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostname, cpus, totalmem } from 'node:os';

import { launchChrome } from './launch-chrome.mjs';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const dist = join(root, 'apps', 'web', 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const serveDist = () =>
  new Promise((ready) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url, 'http://localhost');
      const file = join(dist, url.pathname === '/' ? 'index.html' : url.pathname);
      if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
        // SPA fallback so a deep reload still boots.
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

const bundleBudget = () => {
  const assets = join(dist, 'assets');
  const rows = readdirSync(assets)
    .filter((name) => /\.(js|css|wasm)$/.test(name))
    .map((name) => {
      const bytes = readFileSync(join(assets, name));
      return {
        name,
        raw: bytes.length,
        gzip: /\.wasm$/.test(name) ? gzipSync(bytes).length : gzipSync(bytes).length,
      };
    })
    .sort((a, b) => b.gzip - a.gzip);
  return {
    rows,
    totalGzip: rows.reduce((sum, row) => sum + row.gzip, 0),
  };
};

/** Samples requestAnimationFrame for `seconds` and reports the frame profile. */
const measureFrames = (page, seconds) =>
  page.evaluate(async (duration) => {
    const frames = [];
    let last = performance.now();
    const started = last;
    await new Promise((done) => {
      const tick = (now) => {
        frames.push(now - last);
        last = now;
        if (now - started >= duration * 1000) done();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const sorted = [...frames].sort((a, b) => a - b);
    const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0;
    return {
      frames: frames.length,
      fps: Math.round((frames.length / duration) * 10) / 10,
      medianMs: Math.round(at(0.5) * 10) / 10,
      p95Ms: Math.round(at(0.95) * 10) / 10,
      worstMs: Math.round(at(1) * 10) / 10,
      longFrames: frames.filter((ms) => ms > 50).length,
    };
  }, seconds);

const heapMb = (page) =>
  page.evaluate(() =>
    performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
  );

const runQuality = async (page, base, quality) => {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate((mode) => {
    window.localStorage.clear();
    // Skip onboarding and pin the quality tier the same way Settings would.
    window.localStorage.setItem(
      'codequest.settings.v1',
      JSON.stringify({ schemaVersion: 1, qualityMode: mode }),
    );
    window.localStorage.setItem(
      'codequest.progress.v1',
      JSON.stringify({ schemaVersion: 'v1', lastPlayedAt: new Date().toISOString() }),
    );
  }, quality);

  const navigationStart = Date.now();
  await page.goto(base, { waitUntil: 'networkidle' });
  // Onboarding is modal and blocks the map; a seeded profile normally skips it.
  await page
    .getByRole('button', { name: 'Look at the map first' })
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.getByRole('button', { name: /Play Mission 01/ }).click();
  await page.waitForSelector('.mission-code-editor .cm-content', { timeout: 60000 });
  const toEditorMs = Date.now() - navigationStart;

  // Wait for the sandboxed runner to finish booting before measuring.
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
  const toRunnerReadyMs = Date.now() - navigationStart;

  const idle = await measureFrames(page, 4);

  const editor = page.locator('.mission-code-editor .cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('moveForward();\nmoveForward();\nmoveForward();\n');
  await page.getByRole('button', { name: /^Run/ }).first().click();
  const duringRun = await measureFrames(page, 3);
  const solved = await page
    .waitForSelector('.run-outcome--success', { timeout: 60000 })
    .then(() => true)
    .catch(() => false);

  return { quality, toEditorMs, toRunnerReadyMs, idle, duringRun, heap: await heapMb(page), solved };
};

const main = async () => {
  if (!existsSync(join(dist, 'index.html'))) {
    throw new Error('apps/web/dist is missing. Run `pnpm build` first.');
  }
  const bundle = bundleBudget();
  const { server, port } = await serveDist();
  const base = `http://localhost:${port}/`;
  const browser = await launchChrome();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const runs = [];

  try {
    // Discard one pass: the first navigation pays for cold JIT and disk cache,
    // and would otherwise be charged to whichever tier happened to run first.
    await runQuality(page, base, 'medium');

    for (const quality of ['low', 'medium', 'high']) {
      const result = await runQuality(page, base, quality);
      runs.push(result);
      console.log(
        `${quality.padEnd(7)} idle ${String(result.idle.fps).padStart(5)} fps  ` +
          `run ${String(result.duringRun.fps).padStart(5)} fps  ` +
          `p95 ${String(result.duringRun.p95Ms).padStart(5)} ms  ` +
          `heap ${result.heap ?? '?'} MB  ` +
          `editor ${result.toEditorMs} ms  runner ready ${result.toRunnerReadyMs} ms  ` +
          `solved=${result.solved}`,
      );
    }
  } finally {
    await browser.close();
    server.close();
  }

  const mb = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`;
  const kb = (bytes) => `${Math.round(bytes / 1024)} kB`;

  writeFileSync(
    join(root, 'docs', 'evidence', 'phase-7', 'E-09-performance-report.md'),
    `# E-09 — Performance report

> Generated by \`pnpm perf-check\` (scripts/performance-harness.mjs).
> **These numbers describe the machine that ran it.** The Phase 7 and Phase 9 gates
> ask for target-device evidence: re-run this on the low-end laptop and tablet from
> the [device matrix](../../phase-1/DEVICE_BROWSER_MATRIX.md) and commit that report.

Measured on: \`${hostname()}\`, ${cpus().length} logical cores, ${Math.round(totalmem() / 1073741824)} GB RAM
Date: ${new Date().toISOString().slice(0, 10)}

## Frame profile per quality tier

| Quality | Idle FPS | FPS during a run | Median frame | p95 frame | Worst frame | Frames > 50 ms | JS heap | Mission solved |
|---|---:|---:|---:|---:|---:|---:|---:|---|
${runs
  .map(
    (r) =>
      `| ${r.quality} | ${r.idle.fps} | ${r.duringRun.fps} | ${r.duringRun.medianMs} ms | ${r.duringRun.p95Ms} ms | ${r.duringRun.worstMs} ms | ${r.duringRun.longFrames} | ${r.heap ?? '—'} MB | ${r.solved ? 'yes' : 'NO'} |`,
  )
  .join('\n')}

A quality tier must never change the outcome: the "Mission solved" column must read
yes on every row, or the Phase 7 gate fails regardless of frame rate.

## Time to play

| Quality | Navigation → editor visible | Navigation → runner ready |
|---|---:|---:|
${runs.map((r) => `| ${r.quality} | ${r.toEditorMs} ms | ${r.toRunnerReadyMs} ms |`).join('\n')}

"Runner ready" is when the sandboxed QuickJS worker has booted and Run becomes
usable. It is the number that matters on a slow device: until then the child can
type but not run.

## Bundle budget

Total gzipped: **${mb(bundle.totalGzip)}** across ${bundle.rows.length} assets.

| Asset | Raw | Gzipped |
|---|---:|---:|
${bundle.rows.map((row) => `| \`${row.name}\` | ${kb(row.raw)} | ${kb(row.gzip)} |`).join('\n')}

Every asset above is precached by the service worker, so this total is also the
offline install size a family pays once.
`,
    'utf8',
  );

  const regressed = runs.filter((run) => !run.solved);
  if (regressed.length > 0) {
    console.error(`Quality tier changed the outcome: ${regressed.map((r) => r.quality).join(', ')}`);
    process.exit(1);
  }
};

await main();
