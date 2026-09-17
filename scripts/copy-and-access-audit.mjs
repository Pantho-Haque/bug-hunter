#!/usr/bin/env node
/**
 * The parts of a playtest a machine can actually check.
 *
 * This does NOT replace moderated child sessions — it cannot tell you whether a
 * child understands `moveForward()`. It checks the mechanical things sessions
 * otherwise get spent on: a control you cannot reach without a mouse, text that
 * clips at 200%, and motion that ignores the reduced-motion setting.
 *
 * Reading level and fault copy are checked as unit tests instead, because they
 * need no browser: packages/content/src/reading-level.test.ts and the fault-copy
 * case in packages/code-runner/src/fault-mapping.test.ts.
 *
 * Usage:  pnpm copy-check            (expects apps/web/dist to be built)
 */
import { createReadStream, existsSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { launchChrome } from './launch-chrome.mjs';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const dist = join(root, 'apps', 'web', 'dist');

// DR-04 sets the baseline at Grade 3 to Grade 5 English.
const GRADE_CEILING = 5;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const syllables = (word) => {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length === 0) return 0;
  if (clean.length <= 3) return 1;
  const groups = clean
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
};

/** Flesch–Kincaid grade level. Prose only — never run it over code. */
const gradeLevel = (text) => {
  const sentences = text.split(/[.!?]+/).filter((part) => part.trim().length > 0).length || 1;
  const words = text.split(/\s+/).filter((word) => /[a-z]/i.test(word));
  if (words.length === 0) return null;
  const syllableCount = words.reduce((sum, word) => sum + syllables(word), 0);
  return (
    Math.round(
      (0.39 * (words.length / sentences) + 11.8 * (syllableCount / words.length) - 15.59) * 10,
    ) / 10
  );
};

const serveDist = () =>
  new Promise((ready) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url, 'http://localhost');
      const file = join(dist, url.pathname === '/' ? 'index.html' : url.pathname);
      if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
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

const seedStartedProfile = (page) =>
  page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'codequest.progress.v1',
      JSON.stringify({ schemaVersion: 'v1', lastPlayedAt: new Date().toISOString() }),
    );
  });

const main = async () => {
  if (!existsSync(join(dist, 'index.html'))) {
    throw new Error('apps/web/dist is missing. Run `pnpm build` first.');
  }

  const { server, port } = await serveDist();
  const base = `http://localhost:${port}/`;
  const browser = await launchChrome();
  const checks = [];

  try {
    // --- 3. Keyboard only, from a genuine first run -----------------------
    // A first-time child meets the onboarding modal first, so the journey under
    // test is onboarding → mission, entirely by keyboard.
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(base, { waitUntil: 'networkidle' });

    const focusedInfo = () =>
      page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        const visible =
          style.outlineStyle !== 'none' ||
          style.boxShadow !== 'none' ||
          style.borderColor !== style.backgroundColor;
        return {
          label: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 60),
          visible,
        };
      });

    let openedMission = false;
    let focusRingMissing = 0;
    for (let i = 0; i < 40 && !openedMission; i += 1) {
      await page.keyboard.press('Tab');
      const focused = await focusedInfo();
      if (focused && !focused.visible) focusRingMissing += 1;
      if (focused && /Start the first mission|Play Mission 01/i.test(focused.label)) {
        await page.keyboard.press('Enter');
        openedMission = await page
          .waitForSelector('.mission-code-editor .cm-content', { timeout: 30000 })
          .then(() => true)
          .catch(() => false);
      }
    }
    checks.push({
      name: 'A first-time player can reach a mission with the keyboard alone',
      pass: openedMission,
      detail: openedMission
        ? 'onboarding → M01 via Tab and Enter'
        : 'never reached a start control',
    });
    checks.push({
      name: 'Focused controls show a visible focus indicator',
      pass: focusRingMissing === 0,
      detail: `${focusRingMissing} focused element(s) had no visible indicator`,
    });

    if (openedMission) {
      let tabsToEditor = null;
      for (let i = 1; i <= 25 && tabsToEditor === null; i += 1) {
        await page.keyboard.press('Tab');
        const onEditor = await page.evaluate(
          () => document.activeElement?.classList.contains('cm-content') ?? false,
        );
        if (onEditor) tabsToEditor = i;
      }
      checks.push({
        name: 'Code editor is reachable by keyboard from the mission screen',
        pass: tabsToEditor !== null,
        detail:
          tabsToEditor === null ? 'not reachable within 25 tabs' : `${tabsToEditor} tab(s) away`,
      });
    }

    // --- 4. 200% text scale ------------------------------------------------
    const scaled = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await scaled.goto(base, { waitUntil: 'networkidle' });
    await seedStartedProfile(scaled);
    await scaled.goto(base, { waitUntil: 'networkidle' });
    await scaled.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await scaled.waitForTimeout(800);
    const overflow = await scaled.evaluate(() => {
      const doc = document.documentElement;
      const hides = (value) => value === 'hidden' || value === 'clip';
      const clipped = [...document.querySelectorAll('button, h1, h2, .mission-task, .zone-marker')]
        .filter((el) => {
          const style = getComputedStyle(el);
          // Overflowing a visible box loses nothing; only a clipping box does.
          return (
            (hides(style.overflowX) && el.scrollWidth > el.clientWidth + 2) ||
            (hides(style.overflowY) && el.scrollHeight > el.clientHeight + 2)
          );
        })
        .map((el) => (el.textContent ?? '').trim().slice(0, 40))
        .slice(0, 8);
      return { horizontal: doc.scrollWidth > doc.clientWidth + 2, clipped };
    });
    checks.push({
      name: 'No horizontal scroll at 200% text',
      pass: !overflow.horizontal,
      detail: overflow.horizontal ? 'document scrolls sideways' : 'layout reflows',
    });
    checks.push({
      name: 'No clipped controls or headings at 200% text',
      pass: overflow.clipped.length === 0,
      detail:
        overflow.clipped.length === 0 ? 'none' : `clipped: ${overflow.clipped.join(' | ')}`,
    });

    // --- 5. Reduced motion -------------------------------------------------
    const calm = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    await calm.goto(base, { waitUntil: 'networkidle' });
    await seedStartedProfile(calm);
    await calm.goto(base, { waitUntil: 'networkidle' });
    const animated = await calm.evaluate(
      () =>
        [...document.querySelectorAll('*')].filter((el) => {
          const style = getComputedStyle(el);
          const duration = (value) =>
            value.split(',').some((part) => parseFloat(part) > 0.02);
          return duration(style.animationDuration) || duration(style.transitionDuration);
        }).length,
    );
    checks.push({
      name: 'Reduced motion suppresses animation and transitions',
      pass: animated === 0,
      detail: `${animated} element(s) still animate under prefers-reduced-motion: reduce`,
    });

    // --- 6. Reading level of rendered UI text ------------------------------
    const rendered = await calm.evaluate(() => document.body.innerText);
    const renderedGrade = gradeLevel(rendered.replace(/\n+/g, '. '));
    checks.push({
      name: `Rendered map copy reads at or below grade ${GRADE_CEILING}`,
      pass: renderedGrade !== null && renderedGrade <= GRADE_CEILING,
      detail: `grade ${renderedGrade}`,
    });
  } finally {
    await browser.close();
    server.close();
  }

  for (const check of checks) {
    console.log(`${check.pass ? 'PASS' : 'FAIL'}  ${check.name}\n        ${check.detail}`);
  }

  const failed = checks.filter((check) => !check.pass);
  writeFileSync(
    join(root, 'docs', 'evidence', 'phase-10', 'E-10-copy-and-access-audit.md'),
    `# E-10 — Copy and access audit

> Generated by \`pnpm copy-check\` (scripts/copy-and-access-audit.mjs).
> **This is not a playtest.** It checks what a machine can check: reading level,
> error copy, keyboard reach, text scaling, and reduced motion. It cannot tell you
> whether a child understands \`moveForward()\`. The Phase 10 gate still needs the
> moderated sessions in [the protocol](../../phase-10/PLAYTEST_PROTOCOL.md).

Reading baseline: grade ${GRADE_CEILING} (DR-04), Flesch–Kincaid.
Result: **${failed.length === 0 ? 'all checks pass' : `${failed.length} failing`}**

| Check | Result | Detail |
|---|---|---|
${checks.map((c) => `| ${c.name} | ${c.pass ? 'pass' : '**FAIL**'} | ${c.detail} |`).join('\n')}

Reading level of authored copy and runner fault copy are covered by unit tests, not
here: see \`packages/content/src/reading-level.test.ts\` and the fault-copy case in
\`packages/code-runner/src/fault-mapping.test.ts\`.
`,
    'utf8',
  );

  if (failed.length > 0) process.exit(1);
};

await main();
