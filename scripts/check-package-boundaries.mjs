#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');

const pkgDirs = ['apps', 'packages'];

const declaredDeps = new Map();
const packageLocations = new Map();

for (const dir of pkgDirs) {
  const abs = join(root, dir);
  let entries;
  try {
    entries = readdirSync(abs);
  } catch {
    continue;
  }
  for (const name of entries) {
    const pkgRoot = join(abs, name);
    if (!statSync(pkgRoot).isDirectory()) continue;
    const pkgJsonPath = join(pkgRoot, 'package.json');
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    } catch {
      continue;
    }
    if (!pkg.name) continue;
    declaredDeps.set(pkg.name, new Set());
    packageLocations.set(pkg.name, pkgRoot);
    const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.peerDependencies ?? {}) };
    for (const depName of Object.keys(allDeps)) {
      if (depName.startsWith('@codequest/')) {
        declaredDeps.get(pkg.name).add(depName);
      }
    }
  }
}

function ownerPackageForFile(filePath) {
  for (const [name, dir] of packageLocations) {
    if (filePath.startsWith(dir + sep) || filePath === dir) {
      return name;
    }
  }
  return null;
}

const importRegex = /(?:from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"])/g;

const errors = [];
const scannedFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.tmp') continue;
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx|mts|cts)$/.test(entry)) continue;
    scannedFiles.push(full);
    const owner = ownerPackageForFile(full);
    if (!owner) continue;
    const allowed = declaredDeps.get(owner) ?? new Set();
    const text = readFileSync(full, 'utf8');
    let match;
    while ((match = importRegex.exec(text)) !== null) {
      const specifier = match[1] || match[2];
      if (!specifier || !specifier.startsWith('@codequest/')) continue;
      const scopeEnd = specifier.indexOf('/', '@codequest/'.length);
      const pkgName = scopeEnd === -1 ? specifier : specifier.slice(0, scopeEnd);
      if (!declaredDeps.has(pkgName)) {
        errors.push(`${relative(root, full)}: unknown workspace import "${pkgName}"`);
        continue;
      }
      if (owner !== pkgName && !allowed.has(pkgName)) {
        errors.push(
          `${relative(root, full)}: ${owner} imports ${pkgName} but does not declare it in dependencies or peerDependencies`,
        );
      }
    }
  }
}

for (const dir of pkgDirs) {
  const abs = join(root, dir);
  try {
    walk(abs);
  } catch {}
}

if (errors.length > 0) {
  console.error('Package boundary check failed:');
  for (const err of errors) console.error('  ' + err);
  console.error(`\n${errors.length} violation(s) across ${scannedFiles.length} files.`);
  process.exit(1);
}

console.log(`Package boundary check passed (${scannedFiles.length} files scanned).`);