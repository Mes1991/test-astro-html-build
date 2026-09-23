import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Parity test for the environment-variable contract (R-11, R-12).
 *
 * Three surfaces must agree on the exact same variable set:
 *   1. Every `import.meta.env.X` actually read under `src/` (excluding the
 *      Astro/Vite built-ins, which are never user-configured).
 *   2. The `readonly X` members declared on `ImportMetaEnv` in `src/env.d.ts`.
 *   3. The variable names documented in `.env.example` at the repo root.
 *
 * A variable that is read but not declared type-checks as `any` silently. A
 * variable that is declared or documented but never read is dead
 * configuration nobody can verify. Either drift is a bug this test catches.
 */

const SRC_DIR = __dirname;
const ROOT_DIR = join(__dirname, '..');

// Astro/Vite built-ins: not user-configured, never expected in env.d.ts's
// custom `ImportMetaEnv` additions or in `.env.example`.
const BUILTIN_ENV_KEYS = new Set(['PROD', 'DEV', 'SSR', 'MODE', 'BASE_URL', 'SITE']);

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.astro']);

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

/** Every `import.meta.env.X` read under `src/`, excluding built-ins and test files. */
function readEnvKeys(): Set<string> {
  const pattern = new RegExp(['import', '\\.meta\\.env\\.', '([A-Za-z_][A-Za-z0-9_]*)'].join(''), 'g');
  const keys = new Set<string>();
  for (const file of listFilesRecursive(SRC_DIR)) {
    if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
    const ext = file.slice(file.lastIndexOf('.'));
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    const content = readFileSync(file, 'utf-8');
    for (const match of content.matchAll(pattern)) {
      const key = match[1];
      if (!BUILTIN_ENV_KEYS.has(key)) keys.add(key);
    }
  }
  return keys;
}

/** Every `readonly X` member declared on `ImportMetaEnv` in `src/env.d.ts`. */
function declaredEnvKeys(): Set<string> {
  const content = readFileSync(join(SRC_DIR, 'env.d.ts'), 'utf-8');
  const block = content.match(/interface ImportMetaEnv \{([\s\S]*?)\}/);
  if (!block) throw new Error('src/env.d.ts: could not find the ImportMetaEnv interface block');
  const keys = new Set<string>();
  const memberPattern = /readonly\s+([A-Za-z_][A-Za-z0-9_]*)\??:/g;
  for (const match of block[1].matchAll(memberPattern)) {
    keys.add(match[1]);
  }
  return keys;
}

/** Every variable name assigned a value in `.env.example`. */
function documentedEnvKeys(): Set<string> {
  const content = readFileSync(join(ROOT_DIR, '.env.example'), 'utf-8');
  const keys = new Set<string>();
  const linePattern = /^([A-Z_][A-Z0-9_]*)=/gm;
  for (const match of content.matchAll(linePattern)) {
    keys.add(match[1]);
  }
  return keys;
}

function sorted(set: Set<string>): string[] {
  return [...set].sort();
}

describe('environment variable contract parity', () => {
  it('every import.meta.env.X read under src/ is declared in env.d.ts', () => {
    expect(sorted(readEnvKeys())).toEqual(sorted(declaredEnvKeys()));
  });

  it('every import.meta.env.X read under src/ is documented in .env.example', () => {
    expect(sorted(readEnvKeys())).toEqual(sorted(documentedEnvKeys()));
  });

  it('env.d.ts and .env.example declare the same variable set', () => {
    expect(sorted(declaredEnvKeys())).toEqual(sorted(documentedEnvKeys()));
  });
});
