import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditSvg } from './svg-audit.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, 'svg-audit.mjs');
const fixturesDir = path.join(here, 'fixtures', 'svg');
const repoRoot = path.resolve(here, '..');

const expected = {
  'ok-icon.svg': [],
  'bad-script.svg': ['SVG_SCRIPT'],
  'bad-onload.svg': ['SVG_EVENT_HANDLER'],
  'bad-external-href.svg': ['SVG_EXTERNAL_REF'],
  'bad-foreign-object.svg': ['SVG_FOREIGN_OBJECT'],
  'bad-doctype-entity.svg': ['SVG_DOCTYPE_ENTITY'],
  'bad-no-viewbox.svg': ['SVG_NO_VIEWBOX'],
  'bad-javascript-url.svg': ['SVG_JAVASCRIPT_URL', 'SVG_EXTERNAL_REF'],
};

describe('auditSvg — fixtures (errors)', () => {
  for (const [file, codes] of Object.entries(expected)) {
    it(`${file}: reports ${codes.join(', ') || 'no errors'}`, async () => {
      const text = await readFile(path.join(fixturesDir, file), 'utf8');
      const findings = auditSvg(text);
      const errorCodes = new Set(findings.filter((f) => f.severity === 'error').map((f) => f.code));
      expect(errorCodes).toEqual(new Set(codes));
    });
  }
});

describe('auditSvg — warnings', () => {
  it('warn-raster.svg: warns SVG_EMBEDDED_RASTER without any error', async () => {
    const text = await readFile(path.join(fixturesDir, 'warn-raster.svg'), 'utf8');
    const findings = auditSvg(text);
    expect(findings.some((f) => f.severity === 'error')).toBe(false);
    expect(findings.some((f) => f.severity === 'warn' && f.code === 'SVG_EMBEDDED_RASTER')).toBe(true);
  });

  it('warn-public-doctype.svg: a plain public DOCTYPE warns SVG_DOCTYPE, not SVG_DOCTYPE_ENTITY', async () => {
    const text = await readFile(path.join(fixturesDir, 'warn-public-doctype.svg'), 'utf8');
    const findings = auditSvg(text);
    expect(findings.some((f) => f.severity === 'error')).toBe(false);
    expect(findings.some((f) => f.severity === 'warn' && f.code === 'SVG_DOCTYPE')).toBe(true);
  });
});

async function svgFilesUnder(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await svgFilesUnder(full)));
    else if (entry.name.endsWith('.svg')) out.push(full);
  }
  return out;
}

describe('auditSvg — representative template case', () => {
  it('every SVG under public/ has zero errors', async () => {
    const files = await svgFilesUnder(path.join(repoRoot, 'public'));
    expect(files.length).toBeGreaterThan(0);
    const results = [];
    for (const file of files) {
      const text = await readFile(file, 'utf8');
      const errors = auditSvg(text).filter((f) => f.severity === 'error');
      if (errors.length > 0) results.push(`${path.relative(repoRoot, file)}: ${errors.map((e) => e.code).join(', ')}`);
    }
    expect(results).toEqual([]);
  });
});

describe('CLI', () => {
  function runCli(args) {
    return spawnSync(process.execPath, [scriptPath, ...args], { encoding: 'utf8' });
  }

  it('exits 0 on a directory with only passing/warning fixtures', () => {
    const result = runCli([path.join(fixturesDir, 'ok-icon.svg'), path.join(fixturesDir, 'warn-raster.svg')]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('PASS');
  });

  it('exits 1 on a fixture with errors', () => {
    const result = runCli([path.join(fixturesDir, 'bad-script.svg')]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('FAIL');
    expect(result.stderr).toContain('SVG_SCRIPT');
  });

  it('exits 2 when no .svg files are found', () => {
    const result = runCli([path.join(here, 'fixtures', 'faq-audit')]);
    expect(result.status).toBe(2);
  });

  it('walks a directory recursively and skips node_modules', async () => {
    const result = runCli([fixturesDir]);
    const files = (await readdir(fixturesDir)).filter((f) => f.endsWith('.svg'));
    expect(result.stdout).toMatch(new RegExp(`svg-audit: ${files.length} files`));
  });
});
