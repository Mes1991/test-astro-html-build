import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Structural guards for R-40 (opt-in GitHub Actions) and R-13 (one version
 * source), proportionate to what they protect against.
 *
 * R-40: no workflow that ships by default in `.github/workflows/` may write
 * to the repository or call an external API with a write verb. A read-only
 * validation workflow (`ci.yml`) is the only thing an adopter inherits.
 *
 * R-13: `package.json` is the only version source in the active product.
 * The three files that used to compete with it are gone.
 */

const ROOT_DIR = join(__dirname, '..');
const WORKFLOWS_DIR = join(ROOT_DIR, '.github', 'workflows');

function workflowFiles(): string[] {
  return readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
}

// Matches any GitHub Actions permission grant of `write` (contents, pull-requests,
// actions, issues, packages, deployments, id-token, checks, statuses, ...).
const WRITE_PERMISSION = /\b[\w-]+:\s*write\b/i;

// A `gh pr merge` (or `gh pr merge ...`) invocation — an automated merge to the
// repository's default branch.
const GH_PR_MERGE = /\bgh\s+pr\s+merge\b/;

// A curl call using a write HTTP verb against an external API.
const EXTERNAL_API_WRITE = /-X\s*(POST|PUT|PATCH|DELETE)\b/i;

describe('default-shipping workflows stay read-only (R-40)', () => {
  const files = workflowFiles();

  it('the workflows directory is not empty', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s grants no write permission', (file) => {
    const content = readFileSync(join(WORKFLOWS_DIR, file), 'utf-8');
    expect(content).not.toMatch(WRITE_PERMISSION);
  });

  it.each(files)('%s does not auto-merge a pull request', (file) => {
    const content = readFileSync(join(WORKFLOWS_DIR, file), 'utf-8');
    expect(content).not.toMatch(GH_PR_MERGE);
  });

  it.each(files)('%s does not call an external API with a write verb', (file) => {
    const content = readFileSync(join(WORKFLOWS_DIR, file), 'utf-8');
    expect(content).not.toMatch(EXTERNAL_API_WRITE);
  });

  it('ci.yml is still the active validation workflow', () => {
    expect(files).toContain('ci.yml');
  });
});

describe('package.json is the only version source (R-13)', () => {
  it('package.json declares version 0.1.0', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
    expect(pkg.version).toBe('0.1.0');
  });

  it('no competing version source exists in the active product', () => {
    for (const file of ['version.txt', 'release-please-config.json', '.release-please-manifest.json']) {
      expect(existsAt(join(ROOT_DIR, file))).toBe(false);
    }
  });
});

function existsAt(path: string): boolean {
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  }
}
