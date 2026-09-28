import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  ALL_TARGET_ISOLATION_WARNING,
  MANIFEST_FILE,
  parseRegistry,
  runCheck,
  runSetup,
  validateSources,
} from './lib/agent-skills.mjs';

async function pathExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function collectAllFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectAllFiles(full)));
    else out.push(full);
  }
  return out;
}

async function snapshot(dir) {
  const out = {};
  for (const file of await collectAllFiles(dir)) {
    out[path.relative(dir, file)] = (await stat(file)).mtimeMs;
  }
  return out;
}

function skillMd(name, description = `Use when working with ${name} things.`) {
  return `---\nname: ${name}\ndescription: "${description}"\n---\n\n# ${name}\n\nBody for ${name}.\n`;
}

async function createRoot({ skills } = {}) {
  const skillSpecs = skills ?? [
    { name: 'alpha', installed: true },
    { name: 'beta', installed: true },
  ];
  const root = await mkdtemp(path.join(tmpdir(), 'agent-skills-'));
  await mkdir(path.join(root, 'skills'), { recursive: true });

  const registryLines = ['version: 1', 'skills:'];
  for (const s of skillSpecs) registryLines.push(`  - name: ${s.name}`, `    installed: ${s.installed}`);
  await writeFile(path.join(root, 'skills', 'registry.yaml'), `${registryLines.join('\n')}\n`);

  for (const s of skillSpecs) {
    const dir = path.join(root, 'skills', s.name);
    await mkdir(path.join(dir, 'references'), { recursive: true });
    await writeFile(path.join(dir, 'SKILL.md'), skillMd(s.name));
    await writeFile(path.join(dir, 'references', 'notes.md'), `Notes for ${s.name}.\n`);
  }
  return root;
}

describe('parseRegistry', () => {
  it('parses a well-formed registry', () => {
    const registry = parseRegistry('version: 1\nskills:\n  - name: alpha\n    installed: true\n  - name: beta\n    installed: false\n');
    expect(registry).toEqual({
      version: 1,
      skills: [
        { name: 'alpha', installed: true },
        { name: 'beta', installed: false },
      ],
    });
  });

  it('rejects an invalid skill name with its line number', () => {
    const text = 'version: 1\nskills:\n  - name: Bad_Name\n    installed: true\n';
    expect(() => parseRegistry(text)).toThrowError(/registry\.yaml:3:/);
  });

  it('rejects a duplicate skill name with its line number', () => {
    const text = 'version: 1\nskills:\n  - name: alpha\n    installed: true\n  - name: alpha\n    installed: true\n';
    expect(() => parseRegistry(text)).toThrowError(/registry\.yaml:5:.*duplicate/);
  });

  it('rejects a tab character with its line number', () => {
    const text = 'version: 1\nskills:\n\t- name: alpha\n    installed: true\n';
    expect(() => parseRegistry(text)).toThrowError(/registry\.yaml:3:.*tabs/);
  });

  it('rejects an unknown top-level key', () => {
    const text = 'version: 1\nunknown: true\n';
    expect(() => parseRegistry(text)).toThrowError(/registry\.yaml:2:/);
  });

  it('rejects a skill name longer than 64 characters', () => {
    const longName = 'a'.repeat(65);
    const text = `version: 1\nskills:\n  - name: ${longName}\n    installed: true\n`;
    expect(() => parseRegistry(text)).toThrowError(/registry\.yaml:3:.*64/);
  });

  it('rejects a non-boolean installed value', () => {
    const text = 'version: 1\nskills:\n  - name: alpha\n    installed: yes\n';
    expect(() => parseRegistry(text)).toThrowError(/registry\.yaml:4:/);
  });
});

describe('validateSources', () => {
  it('flags a frontmatter name mismatch', async () => {
    const root = await createRoot({ skills: [{ name: 'alpha', installed: true }] });
    await writeFile(path.join(root, 'skills/alpha/SKILL.md'), '---\nname: not-alpha\ndescription: "x"\n---\nBody\n');
    const registry = parseRegistry(await readFile(path.join(root, 'skills/registry.yaml'), 'utf8'));
    const { errors } = await validateSources(root, registry);
    expect(errors.some((e) => e.code === 'FRONTMATTER_NAME_MISMATCH')).toBe(true);
  });

  it('flags an out-of-range description length', async () => {
    const root = await createRoot({ skills: [{ name: 'alpha', installed: true }] });
    await writeFile(
      path.join(root, 'skills/alpha/SKILL.md'),
      `---\nname: alpha\ndescription: "${'x'.repeat(1025)}"\n---\nBody\n`,
    );
    const registry = parseRegistry(await readFile(path.join(root, 'skills/registry.yaml'), 'utf8'));
    const { errors } = await validateSources(root, registry);
    expect(errors.some((e) => e.code === 'FRONTMATTER_DESCRIPTION_LENGTH')).toBe(true);
  });

  it('reports a skill directory on disk that is not registered', async () => {
    const root = await createRoot({ skills: [{ name: 'alpha', installed: true }] });
    await mkdir(path.join(root, 'skills/orphan'), { recursive: true });
    await writeFile(path.join(root, 'skills/orphan/SKILL.md'), skillMd('orphan'));
    const registry = parseRegistry(await readFile(path.join(root, 'skills/registry.yaml'), 'utf8'));
    const { unregistered } = await validateSources(root, registry);
    expect(unregistered).toContain('orphan');
  });

  it('rejects a symlink inside a skill source directory (skipped if this platform denies symlink creation)', async () => {
    const root = await createRoot({ skills: [{ name: 'alpha', installed: true }] });
    const linkPath = path.join(root, 'skills/alpha/link-to-notes.md');
    try {
      await symlink(path.join(root, 'skills/alpha/references/notes.md'), linkPath);
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        // Symlink creation requires elevated privileges on this platform
        // (e.g. Windows without Developer Mode) — nothing to assert here.
        return;
      }
      throw err;
    }
    const registry = parseRegistry(await readFile(path.join(root, 'skills/registry.yaml'), 'utf8'));
    const { errors } = await validateSources(root, registry);
    expect(errors.some((e) => e.code === 'SYMLINK_IN_SOURCE')).toBe(true);
  });
});

describe('runSetup / runCheck', () => {
  it('first setup materializes copies and a manifest, and a second run is idempotent', async () => {
    const root = await createRoot();

    const setup1 = await runSetup({ root, target: 'codex' });
    expect(setup1.exitCode).toBe(0);
    expect(setup1.writes).toBeGreaterThan(0);
    expect(await readFile(path.join(root, '.agents/skills/alpha/SKILL.md'), 'utf8')).toContain('name: alpha');
    const manifest = JSON.parse(await readFile(path.join(root, '.agents/skills', MANIFEST_FILE), 'utf8'));
    expect(Object.keys(manifest.skills).sort()).toEqual(['alpha', 'beta']);

    expect((await runCheck({ root, target: 'codex' })).exitCode).toBe(0);

    const setup2 = await runSetup({ root, target: 'codex' });
    expect(setup2.exitCode).toBe(0);
    expect(setup2.writes).toBe(0);
    expect((await runCheck({ root, target: 'codex' })).exitCode).toBe(0);
  });

  it('materializes claude independently of codex', async () => {
    const root = await createRoot();
    await runSetup({ root, target: 'codex' });
    const setup = await runSetup({ root, target: 'claude' });
    expect(setup.exitCode).toBe(0);
    expect(await pathExists(path.join(root, '.claude/skills/beta/SKILL.md'))).toBe(true);
  });

  it('detects OUTDATED after a source edit, and a re-run of setup restores sync', async () => {
    const root = await createRoot();
    await runSetup({ root, target: 'claude' });
    await writeFile(
      path.join(root, 'skills/alpha/SKILL.md'),
      skillMd('alpha', 'Updated description text for alpha things now.'),
    );

    const check1 = await runCheck({ root, target: 'claude' });
    expect(check1.exitCode).toBe(1);
    expect(check1.findings.some((f) => f.code === 'OUTDATED' && f.name === 'alpha')).toBe(true);

    await runSetup({ root, target: 'claude' });
    expect((await runCheck({ root, target: 'claude' })).exitCode).toBe(0);
  });

  it('reports MISSING when a materialized skill is deleted from the destination', async () => {
    const root = await createRoot();
    await runSetup({ root, target: 'claude' });
    await rm(path.join(root, '.claude/skills/beta'), { recursive: true, force: true });

    const check = await runCheck({ root, target: 'claude' });
    expect(check.exitCode).toBe(1);
    expect(check.findings.some((f) => f.code === 'MISSING' && f.name === 'beta')).toBe(true);
  });

  it('reports ADDITIONAL for an unregistered destination entry and never deletes it', async () => {
    const root = await createRoot();
    await runSetup({ root, target: 'claude' });
    await mkdir(path.join(root, '.claude/skills/mystery-extra'), { recursive: true });
    await writeFile(path.join(root, '.claude/skills/mystery-extra/note.txt'), 'keep me');

    const check1 = await runCheck({ root, target: 'claude' });
    expect(check1.findings.some((f) => f.code === 'ADDITIONAL' && f.name === 'mystery-extra')).toBe(true);

    await runSetup({ root, target: 'claude' });
    expect(await readFile(path.join(root, '.claude/skills/mystery-extra/note.txt'), 'utf8')).toBe('keep me');

    const check2 = await runCheck({ root, target: 'claude' });
    expect(check2.findings.some((f) => f.code === 'ADDITIONAL' && f.name === 'mystery-extra')).toBe(true);
  });

  it('reports UNMANAGED_COLLISION for pre-existing unmanaged content and never touches it', async () => {
    const root = await createRoot();
    await mkdir(path.join(root, '.claude/skills/alpha'), { recursive: true });
    await writeFile(path.join(root, '.claude/skills/alpha/SKILL.md'), 'pre-existing content, not ours');

    const setup = await runSetup({ root, target: 'claude' });
    expect(setup.exitCode).toBe(1);
    expect(setup.findings.some((f) => f.code === 'UNMANAGED_COLLISION' && f.name === 'alpha')).toBe(true);
    expect(await readFile(path.join(root, '.claude/skills/alpha/SKILL.md'), 'utf8')).toBe(
      'pre-existing content, not ours',
    );

    const check = await runCheck({ root, target: 'claude' });
    expect(check.findings.some((f) => f.code === 'UNMANAGED_COLLISION' && f.name === 'alpha')).toBe(true);
  });

  it('rejects an invalid target with exit 2 and creates nothing', async () => {
    const root = await createRoot();
    const result = await runSetup({ root, target: 'bogus' });
    expect(result.exitCode).toBe(2);
    expect(await pathExists(path.join(root, '.agents'))).toBe(false);
    expect(await pathExists(path.join(root, '.claude'))).toBe(false);
  });

  it('logs the "all" isolation warning before materializing anything', async () => {
    const root = await createRoot();
    const log = [];
    const result = await runSetup({ root, target: 'all', log: (line) => log.push(line) });
    expect(result.exitCode).toBe(0);
    expect(log[0]).toBe(ALL_TARGET_ISOLATION_WARNING);
    expect(await pathExists(path.join(root, '.agents/skills/alpha/SKILL.md'))).toBe(true);
    expect(await pathExists(path.join(root, '.claude/skills/alpha/SKILL.md'))).toBe(true);
  });

  it('removes a stale extra file inside a managed skill directory', async () => {
    const root = await createRoot();
    await runSetup({ root, target: 'claude' });
    const staleFile = path.join(root, '.claude/skills/alpha/stale.md');
    await writeFile(staleFile, 'no longer part of the source');

    await runSetup({ root, target: 'claude' });
    expect(await pathExists(staleFile)).toBe(false);
    expect((await runCheck({ root, target: 'claude' })).exitCode).toBe(0);
  });

  it('does not materialize a skill marked installed: false', async () => {
    const root = await createRoot({
      skills: [
        { name: 'alpha', installed: true },
        { name: 'gamma', installed: false },
      ],
    });
    await runSetup({ root, target: 'claude' });
    expect(await pathExists(path.join(root, '.claude/skills/gamma'))).toBe(false);
  });

  it('reports STALE_MANAGED when a skill is turned off after being materialized', async () => {
    const root = await createRoot({ skills: [{ name: 'alpha', installed: true }] });
    await runSetup({ root, target: 'claude' });
    await writeFile(
      path.join(root, 'skills/registry.yaml'),
      'version: 1\nskills:\n  - name: alpha\n    installed: false\n',
    );
    const setup = await runSetup({ root, target: 'claude' });
    expect(setup.findings.some((f) => f.code === 'STALE_MANAGED' && f.name === 'alpha')).toBe(true);
    expect(await pathExists(path.join(root, '.claude/skills/alpha/SKILL.md'))).toBe(true);
  });

  it('zero installed skills succeeds without creating any destination directory', async () => {
    const root = await createRoot({ skills: [{ name: 'gamma', installed: false }] });
    const log = [];
    const result = await runSetup({ root, target: 'claude', log: (line) => log.push(line) });
    expect(result.exitCode).toBe(0);
    expect(await pathExists(path.join(root, '.claude'))).toBe(false);
    expect(log).toContain('agent-setup: 0 skills materialized');
  });

  it('reports UNREGISTERED_SOURCE for a skill directory that setup/check find but the registry does not list', async () => {
    const root = await createRoot({ skills: [{ name: 'alpha', installed: true }] });
    await mkdir(path.join(root, 'skills/orphan'), { recursive: true });
    await writeFile(path.join(root, 'skills/orphan/SKILL.md'), skillMd('orphan'));

    const setup = await runSetup({ root, target: 'claude' });
    expect(setup.findings.some((f) => f.code === 'UNREGISTERED_SOURCE' && f.name === 'orphan')).toBe(true);

    const check = await runCheck({ root, target: 'claude' });
    expect(check.findings.some((f) => f.code === 'UNREGISTERED_SOURCE' && f.name === 'orphan')).toBe(true);
  });

  it('never writes anything during check', async () => {
    const root = await createRoot();
    await runSetup({ root, target: 'claude' });
    const before = await snapshot(path.join(root, '.claude/skills'));
    await runCheck({ root, target: 'claude' });
    const after = await snapshot(path.join(root, '.claude/skills'));
    expect(after).toEqual(before);
  });

  it('check with an invalid target exits 2 without writing', async () => {
    const root = await createRoot();
    const result = await runCheck({ root, target: 'bogus' });
    expect(result.exitCode).toBe(2);
    expect(await pathExists(path.join(root, '.agents'))).toBe(false);
    expect(await pathExists(path.join(root, '.claude'))).toBe(false);
  });

  it('check defaults to target "all" when none is given', async () => {
    const root = await createRoot();
    await runSetup({ root, target: 'all' });
    const check = await runCheck({ root });
    expect(check.exitCode).toBe(0);
  });
});
