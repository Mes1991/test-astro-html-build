import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditHtml } from './seo-faq-audit.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, 'seo-faq-audit.mjs');
const fixturesDir = path.join(here, 'fixtures', 'faq-audit');

const expected = JSON.parse(await readFile(path.join(fixturesDir, 'expected.json'), 'utf8'));

describe('auditHtml — fixtures', () => {
  for (const [file, spec] of Object.entries(expected)) {
    it(`${file}: ${spec.pass ? 'passes' : 'fails'} with ${spec.codes.join(', ') || 'no findings'}`, async () => {
      const html = await readFile(path.join(fixturesDir, file), 'utf8');
      const { findings, skipped } = auditHtml(html);

      expect(new Set(findings.map((f) => f.code))).toEqual(new Set(spec.codes));
      expect(new Set(skipped.map((s) => s.code))).toEqual(new Set(spec.skippedCodes ?? []));
      expect(findings.length > 0).toBe(!spec.pass);
    });
  }
});

describe('auditHtml — layers', () => {
  it('tags shape findings with layer "shape" and content findings with layer "content"', async () => {
    const shapeHtml = await readFile(path.join(fixturesDir, 'fail-missing-question.html'), 'utf8');
    const { findings: shapeFindings } = auditHtml(shapeHtml);
    expect(shapeFindings.every((f) => f.layer === 'shape')).toBe(true);

    const contentHtml = await readFile(path.join(fixturesDir, 'fail-swapped.html'), 'utf8');
    const { findings: contentFindings } = auditHtml(contentHtml);
    expect(contentFindings.every((f) => f.layer === 'content')).toBe(true);
  });

  it('counts one faqBlocks entry per FAQPage node found, including nested ones', async () => {
    const html = await readFile(path.join(fixturesDir, 'pass-graph.html'), 'utf8');
    expect(auditHtml(html).faqBlocks).toBe(1);
  });

  it('reports zero faqBlocks and no findings when there is no FAQPage', async () => {
    const html = await readFile(path.join(fixturesDir, 'pass-no-faq.html'), 'utf8');
    const result = auditHtml(html);
    expect(result.faqBlocks).toBe(0);
    expect(result.findings).toEqual([]);
  });
});

async function tempDistWith(...fixtureNames) {
  const dir = await mkdtemp(path.join(tmpdir(), 'seo-faq-audit-'));
  for (const name of fixtureNames) {
    const html = await readFile(path.join(fixturesDir, name), 'utf8');
    await writeFile(path.join(dir, name), html);
  }
  return dir;
}

function runCli(args) {
  return spawnSync(process.execPath, [scriptPath, ...args], { encoding: 'utf8' });
}

describe('CLI', () => {
  it('exits 0 on a directory with only passing fixtures', async () => {
    const dir = await tempDistWith('pass-basic.html', 'pass-graph.html');
    try {
      const result = runCli([dir]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('PASS');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 on a directory containing a failing fixture', async () => {
    const dir = await tempDistWith('pass-basic.html', 'fail-duplicate.html');
    try {
      const result = runCli([dir]);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain('FAIL');
      expect(result.stdout).toContain('CONTENT_DUPLICATE_QUESTION');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('exits 2 when the directory does not exist', () => {
    const result = runCli([path.join(tmpdir(), 'seo-faq-audit-does-not-exist-xyz')]);
    expect(result.status).toBe(2);
  });

  it('exits 2 when the directory has no HTML files', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'seo-faq-audit-empty-'));
    try {
      const result = runCli([dir]);
      expect(result.status).toBe(2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('prints the layer legend and never claims schema validity', async () => {
    const dir = await tempDistWith('pass-basic.html');
    try {
      const result = runCli([dir]);
      expect(result.stdout).toContain('shape+content: checked here');
      expect(result.stdout).toContain('vocabulary: not validated');
      expect(result.stdout).toContain('Google eligibility: not evaluated');
      expect(result.stdout.toLowerCase()).not.toContain('schema valid');
      expect(result.stderr.toLowerCase()).not.toContain('schema valid');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('warns but does not fail on invalid JSON-LD next to a valid FAQPage', async () => {
    const dir = await tempDistWith('warn-invalid-json.html');
    try {
      const result = runCli([dir]);
      expect(result.status).toBe(0);
      expect(result.stderr).toContain('SYNTAX_SKIPPED');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
