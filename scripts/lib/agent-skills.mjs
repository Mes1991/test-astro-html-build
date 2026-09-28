/**
 * Shared logic behind `scripts/agent-setup.mjs` and `scripts/agent-check.mjs`.
 *
 * Implements the distribution contract ratified in
 * `docs/product/agent-ecosystem-contract.md`: `skills/` is the single
 * canonical source, and `.agents/skills/` (Codex, OpenCode) and
 * `.claude/skills/` (Claude) are generated, gitignored copies materialized
 * from `skills/registry.yaml`.
 *
 * All functions here take an explicit `root` (repo root) and, where they log,
 * an injectable `log` sink — this keeps them testable against temporary
 * fixture roots instead of the real repository.
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const MANIFEST_FILE = '.agent-skills-manifest.json';

const VALID_TARGETS = new Set(['codex', 'opencode', 'claude', 'all']);

const TARGET_DESTINATIONS = {
  codex: ['.agents/skills'],
  opencode: ['.agents/skills'],
  claude: ['.claude/skills'],
  all: ['.agents/skills', '.claude/skills'],
};

export const ALL_TARGET_ISOLATION_WARNING =
  'all: materializing every target at once means a multi-agent runtime could discover ' +
  'both .agents/skills and .claude/skills simultaneously, contaminating its context with ' +
  "instructions meant for a different agent's adapter. OpenCode, for one, documents that it " +
  'reads both directories and resolves one copy per name, so a stale copy in either one can ' +
  'shadow the current one. Isolate skill discovery per ' +
  'agent runtime before relying on this destination.';

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function toPosix(p) {
  return p.split(path.sep).join('/');
}

async function pathExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse `skills/registry.yaml`'s strict, documented YAML subset: `#`
 * comments, one `version: 1` line, one `skills:` line, and a flat list of
 * `  - name: <skill>` / `    installed: <true|false>` pairs. Anything outside
 * this subset — tabs, unknown keys, malformed entries — throws with the
 * offending line number.
 * @param {string} text
 * @returns {{ version: 1, skills: Array<{ name: string, installed: boolean }> }}
 */
export function parseRegistry(text) {
  const lines = text.split(/\r\n|\n/);
  const fail = (lineNo, message) => {
    throw new Error(`skills/registry.yaml:${lineNo}: ${message}`);
  };

  let sawVersion = false;
  let sawSkills = false;
  const skills = [];
  const seenNames = new Set();
  let pendingName = null;
  let lastLineNo = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i];
    if (raw.includes('\t')) fail(lineNo, 'tabs are not allowed');

    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    lastLineNo = lineNo;

    if (pendingName) {
      const m = /^ {4}installed:\s*(true|false)\s*$/.exec(raw);
      if (!m) fail(lineNo, `expected "installed: true|false" for skill "${pendingName}"`);
      skills.push({ name: pendingName, installed: m[1] === 'true' });
      pendingName = null;
      continue;
    }

    if (!sawVersion) {
      if (!/^version:\s*1\s*$/.test(raw)) fail(lineNo, 'expected "version: 1" as the first statement');
      sawVersion = true;
      continue;
    }

    if (!sawSkills) {
      if (!/^skills:\s*$/.test(raw)) fail(lineNo, 'expected "skills:" after "version: 1"');
      sawSkills = true;
      continue;
    }

    const nameMatch = /^ {2}- name:\s*(\S+)\s*$/.exec(raw);
    if (!nameMatch) fail(lineNo, 'expected a "  - name: <skill>" entry');
    const name = nameMatch[1];
    if (name.length > 64) fail(lineNo, `skill name "${name}" is longer than 64 characters`);
    if (!NAME_RE.test(name)) fail(lineNo, `skill name "${name}" must match ^[a-z0-9]+(-[a-z0-9]+)*$`);
    if (seenNames.has(name)) fail(lineNo, `duplicate skill name "${name}"`);
    seenNames.add(name);
    pendingName = name;
  }

  if (pendingName) fail(lastLineNo, `expected "installed: true|false" for skill "${pendingName}"`);
  if (!sawVersion) fail(lastLineNo, 'missing "version: 1"');
  if (!sawSkills) fail(lastLineNo, 'missing "skills:"');

  return { version: 1, skills };
}

/** Minimal frontmatter reader: just the `key: value` scalars between the two leading `---` lines. */
function parseFrontmatter(raw) {
  const lines = raw.split(/\r\n|\n/);
  if ((lines[0] ?? '').trim() !== '---') return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (end === -1) return null;

  const result = {};
  for (const line of lines.slice(1, end)) {
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    result[m[1]] = value;
  }
  return result;
}

/** Every symlink found in `dir`'s subtree, as absolute paths. Does not follow symlinked directories. */
async function findSymlinks(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      out.push(full);
      continue;
    }
    if (entry.isDirectory()) out.push(...(await findSymlinks(full)));
  }
  return out;
}

/** Every regular file in `dir`'s subtree, as absolute paths (symlinked directories are followed). */
async function collectFiles(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      const stats = await stat(full);
      if (stats.isDirectory()) out.push(...(await collectFiles(full)));
      else out.push(full);
      continue;
    }
    if (entry.isDirectory()) out.push(...(await collectFiles(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

/** sha256 over sorted relative POSIX paths + NUL + bytes + NUL, per file, for `dir`'s whole subtree. */
async function hashDir(dir) {
  if (!(await pathExists(dir))) return null;
  const files = await collectFiles(dir);
  const rels = files.map((f) => toPosix(path.relative(dir, f))).sort();
  const hash = createHash('sha256');
  const nul = Buffer.from([0]);
  for (const rel of rels) {
    hash.update(rel, 'utf8');
    hash.update(nul);
    hash.update(await readFile(path.join(dir, rel)));
    hash.update(nul);
  }
  return hash.digest('hex');
}

/**
 * Validate every registered skill's source in `skills/<name>/`, and report
 * skill directories present on disk but absent from the registry.
 * @param {string} root
 * @param {{ skills: Array<{ name: string, installed: boolean }> }} registry
 * @returns {Promise<{ errors: Array<{code: string, message: string}>, unregistered: string[] }>}
 */
export async function validateSources(root, registry) {
  const errors = [];
  const skillsRoot = path.join(root, 'skills');

  for (const skill of registry.skills) {
    const dir = path.join(skillsRoot, skill.name);
    const skillMdPath = path.join(dir, 'SKILL.md');

    if (!(await pathExists(skillMdPath))) {
      errors.push({ code: 'MISSING_SKILL_SOURCE', message: `skills/${skill.name}/SKILL.md does not exist.` });
      continue;
    }

    if (await pathExists(dir)) {
      for (const link of await findSymlinks(dir)) {
        errors.push({
          code: 'SYMLINK_IN_SOURCE',
          message: `skills/${skill.name} contains a symlink: ${toPosix(path.relative(root, link))}`,
        });
      }
    }

    const frontmatter = parseFrontmatter(await readFile(skillMdPath, 'utf8'));
    if (!frontmatter) {
      errors.push({
        code: 'FRONTMATTER_MISSING_DELIMITERS',
        message: `skills/${skill.name}/SKILL.md has no "---" frontmatter block.`,
      });
      continue;
    }
    if (frontmatter.name !== skill.name) {
      errors.push({
        code: 'FRONTMATTER_NAME_MISMATCH',
        message: `skills/${skill.name}/SKILL.md frontmatter name "${frontmatter.name ?? ''}" does not match its directory name.`,
      });
    }
    const descriptionLength = (frontmatter.description ?? '').length;
    if (descriptionLength < 1 || descriptionLength > 1024) {
      errors.push({
        code: 'FRONTMATTER_DESCRIPTION_LENGTH',
        message: `skills/${skill.name}/SKILL.md frontmatter description must be 1-1024 characters (was ${descriptionLength}).`,
      });
    }
  }

  const unregistered = [];
  if (await pathExists(skillsRoot)) {
    const registeredNames = new Set(registry.skills.map((s) => s.name));
    for (const entry of await readdir(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || registeredNames.has(entry.name)) continue;
      if (await pathExists(path.join(skillsRoot, entry.name, 'SKILL.md'))) unregistered.push(entry.name);
    }
  }

  return { errors, unregistered };
}

async function readManifest(manifestPath) {
  if (!(await pathExists(manifestPath))) return { generator: 'scripts/agent-setup.mjs', skills: {} };
  try {
    const raw = JSON.parse(await readFile(manifestPath, 'utf8'));
    return {
      generator: typeof raw.generator === 'string' ? raw.generator : 'scripts/agent-setup.mjs',
      skills: raw.skills && typeof raw.skills === 'object' ? raw.skills : {},
    };
  } catch {
    return { generator: 'scripts/agent-setup.mjs', skills: {} };
  }
}

function sortedEntries(obj) {
  const out = {};
  for (const key of Object.keys(obj).sort()) out[key] = obj[key];
  return out;
}

/** Recursively delete now-empty directories under (and including) `dir`. */
async function pruneEmptyDirs(dir) {
  if (!(await pathExists(dir))) return;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) await pruneEmptyDirs(path.join(dir, entry.name));
  }
  if ((await readdir(dir)).length === 0) await rm(dir, { recursive: true, force: true });
}

/** Copy `sourceDir` onto `destDir` exactly: write only differing bytes, remove files no longer in source. */
async function materializeSkill(sourceDir, destDir) {
  let writes = 0;
  const sourceFiles = await collectFiles(sourceDir);
  const sourceRels = new Set(sourceFiles.map((f) => toPosix(path.relative(sourceDir, f))));

  if (await pathExists(destDir)) {
    for (const destFile of await collectFiles(destDir)) {
      const rel = toPosix(path.relative(destDir, destFile));
      if (!sourceRels.has(rel)) {
        await rm(destFile, { force: true });
        writes++;
      }
    }
  }

  for (const sourceFile of sourceFiles) {
    const rel = path.relative(sourceDir, sourceFile);
    const destFile = path.join(destDir, rel);
    const sourceBytes = await readFile(sourceFile);
    const unchanged = (await pathExists(destFile)) && (await readFile(destFile)).equals(sourceBytes);
    if (!unchanged) {
      await mkdir(path.dirname(destFile), { recursive: true });
      await writeFile(destFile, sourceBytes);
      writes++;
    }
  }

  await pruneEmptyDirs(destDir);
  return writes;
}

function resolveDestinations(target) {
  return TARGET_DESTINATIONS[target] ?? null;
}

/**
 * Materialize every `installed: true` skill from `skills/` into the
 * destination(s) for `target`. Never deletes or overwrites an unmanaged,
 * pre-existing destination entry — see `docs/product/agent-ecosystem-contract.md`.
 * @param {{ root: string, target: string, log?: (line: string) => void }} options
 */
export async function runSetup({ root, target, log = () => {} }) {
  const destinations = resolveDestinations(target);
  if (!destinations) {
    log(`agent-setup: unknown target "${target}". Usage: node scripts/agent-setup.mjs <codex|claude|opencode|all>`);
    return { exitCode: 2, findings: [], writes: 0 };
  }

  let registry;
  try {
    registry = parseRegistry(await readFile(path.join(root, 'skills', 'registry.yaml'), 'utf8'));
  } catch (err) {
    log(`agent-setup: ${err.message}`);
    return { exitCode: 1, findings: [], writes: 0 };
  }

  const { errors: sourceErrors, unregistered } = await validateSources(root, registry);
  if (sourceErrors.length > 0) {
    for (const e of sourceErrors) log(`agent-setup: ${e.code} ${e.message}`);
    return { exitCode: 1, findings: sourceErrors, writes: 0 };
  }

  if (target === 'all') log(ALL_TARGET_ISOLATION_WARNING);

  const findings = [];
  let totalWrites = 0;
  let totalMaterialized = 0;

  for (const destRel of destinations) {
    const destRoot = path.join(root, destRel);
    const destRootExistedBefore = await pathExists(destRoot);
    const manifestPath = path.join(destRoot, MANIFEST_FILE);
    const oldManifest = await readManifest(manifestPath);
    const managedNames = new Set(Object.keys(oldManifest.skills));
    const newManifestSkills = {};

    for (const skill of registry.skills) {
      const sourceDir = path.join(root, 'skills', skill.name);
      const destDir = path.join(destRoot, skill.name);

      if (skill.installed) {
        if ((await pathExists(destDir)) && !managedNames.has(skill.name)) {
          findings.push({ destination: destRel, code: 'UNMANAGED_COLLISION', name: skill.name });
          log(`${destRel}: UNMANAGED_COLLISION ${skill.name}`);
          continue;
        }
        totalWrites += await materializeSkill(sourceDir, destDir);
        totalMaterialized += 1;
        newManifestSkills[skill.name] = await hashDir(sourceDir);
      } else if (managedNames.has(skill.name)) {
        findings.push({ destination: destRel, code: 'STALE_MANAGED', name: skill.name });
        log(`${destRel}: STALE_MANAGED ${skill.name}`);
        newManifestSkills[skill.name] = oldManifest.skills[skill.name];
      }
    }

    if (destRootExistedBefore) {
      const registeredNames = new Set(registry.skills.map((s) => s.name));
      for (const entry of await readdir(destRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || registeredNames.has(entry.name)) continue;
        findings.push({ destination: destRel, code: 'ADDITIONAL', name: entry.name });
        log(`${destRel}: ADDITIONAL ${entry.name}`);
      }
    }

    if (Object.keys(newManifestSkills).length > 0 || destRootExistedBefore) {
      await mkdir(destRoot, { recursive: true });
      await writeFile(
        manifestPath,
        `${JSON.stringify({ generator: 'scripts/agent-setup.mjs', skills: sortedEntries(newManifestSkills) }, null, 2)}\n`,
      );
    }
  }

  for (const name of unregistered) {
    findings.push({ code: 'UNREGISTERED_SOURCE', name });
    log(`agent-setup: UNREGISTERED_SOURCE ${name}`);
  }

  log(totalMaterialized === 0 ? 'agent-setup: 0 skills materialized' : `agent-setup: ${totalMaterialized} skill(s) materialized, ${totalWrites} write(s)`);

  const exitCode = findings.some((f) => f.code === 'UNMANAGED_COLLISION') ? 1 : 0;
  return { exitCode, findings, writes: totalWrites };
}

/**
 * Read-only comparison of `skills/` against the destination(s) for `target`.
 * @param {{ root: string, target?: string, log?: (line: string) => void }} options
 */
export async function runCheck({ root, target = 'all', log = () => {} }) {
  const destinations = resolveDestinations(target);
  if (!destinations) {
    log(`agent-check: unknown target "${target}". Usage: node scripts/agent-check.mjs [codex|claude|opencode|all]`);
    return { exitCode: 2, findings: [] };
  }

  let registry;
  try {
    registry = parseRegistry(await readFile(path.join(root, 'skills', 'registry.yaml'), 'utf8'));
  } catch (err) {
    log(`agent-check: ${err.message}`);
    return { exitCode: 1, findings: [] };
  }

  const { errors: sourceErrors, unregistered } = await validateSources(root, registry);
  if (sourceErrors.length > 0) {
    for (const e of sourceErrors) log(`agent-check: ${e.code} ${e.message}`);
    return { exitCode: 1, findings: sourceErrors };
  }

  const findings = [];
  const registeredNames = new Set(registry.skills.map((s) => s.name));

  for (const destRel of destinations) {
    const destRoot = path.join(root, destRel);
    const manifest = await readManifest(path.join(destRoot, MANIFEST_FILE));
    const managedNames = new Set(Object.keys(manifest.skills));

    for (const skill of registry.skills) {
      if (!skill.installed) continue;
      const destDir = path.join(destRoot, skill.name);

      if (!(await pathExists(destDir))) {
        findings.push({ destination: destRel, code: 'MISSING', name: skill.name });
        log(`${destRel}: MISSING ${skill.name}`);
        continue;
      }
      if (!managedNames.has(skill.name)) {
        findings.push({ destination: destRel, code: 'UNMANAGED_COLLISION', name: skill.name });
        log(`${destRel}: UNMANAGED_COLLISION ${skill.name}`);
        continue;
      }
      const sourceDir = path.join(root, 'skills', skill.name);
      if ((await hashDir(sourceDir)) !== (await hashDir(destDir))) {
        findings.push({ destination: destRel, code: 'OUTDATED', name: skill.name });
        log(`${destRel}: OUTDATED ${skill.name}`);
      }
    }

    if (await pathExists(destRoot)) {
      for (const entry of await readdir(destRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || registeredNames.has(entry.name)) continue;
        findings.push({ destination: destRel, code: 'ADDITIONAL', name: entry.name });
        log(`${destRel}: ADDITIONAL ${entry.name}`);
      }
    }
  }

  for (const name of unregistered) {
    findings.push({ code: 'UNREGISTERED_SOURCE', name });
    log(`agent-check: UNREGISTERED_SOURCE ${name}`);
  }

  const exitCode = findings.length > 0 ? 1 : 0;
  log(`agent-check: ${destinations.length} destination(s) checked, ${findings.length} finding(s) — ${exitCode === 0 ? 'PASS' : 'FAIL'}`);
  return { exitCode, findings };
}
