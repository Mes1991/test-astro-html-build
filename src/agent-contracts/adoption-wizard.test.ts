import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Wiring gate for the adoption wizard.
 *
 * This does not prove an agent follows `references/adoption-wizard.md` in a real
 * session — that is behavioural and out of reach for a unit test. What it proves is
 * narrower and mechanical: the contract this feature depends on actually exists in
 * the file, in the shape the other skills assume when they point at it, and every
 * cross-reference the touched files make to a relative `.md` path resolves to a real
 * file. A rewritten section that silently drops a state, a contract field, or a
 * scenario row breaks this suite instead of shipping unnoticed.
 *
 * Deliberately not covered: prose quality, argument style, or whether a heading is
 * phrased well. Only structure that other files or an agent's parsing depends on.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
// `src/agent-contracts` -> repository root.
const REPO_ROOT = path.resolve(HERE, '..', '..');

const read = (relative: string): string => readFileSync(path.join(REPO_ROOT, relative), 'utf8');

const WIZARD_PATH = path.join('skills', 'site-build', 'references', 'adoption-wizard.md');
const SITE_BUILD_PATH = path.join('skills', 'site-build', 'SKILL.md');
const PROJECT_SETUP_PATH = path.join('skills', 'project-setup', 'SKILL.md');
const DESIGN_INGESTION_PATH = path.join('skills', 'design-ingestion', 'SKILL.md');
const AGENTS_PATH = 'AGENTS.md';
const CLAUDE_PATH = 'CLAUDE.md';

const wizard = read(WIZARD_PATH);

const STATES = [
  'READ_ONLY_INTAKE',
  'WIZARD_PENDING',
  'CONTRACT_REVIEW',
  'PREFLIGHT_READY',
  'IMPLEMENTATION',
  'VERIFICATION',
] as const;

const NO_WRITE_STATES = ['READ_ONLY_INTAKE', 'WIZARD_PENDING', 'CONTRACT_REVIEW', 'PREFLIGHT_READY'] as const;

const CONTRACT_FIELDS = [
  'Site objective:',
  'Page scope:',
  'Languages and URL structure:',
  'Rendering mode:',
  'Backend, API, CMS and third-party services (analytics, tag manager, forms, maps — deny-by-default):',
  'Real interactive features:',
  'Removed or substituted features:',
  'Content source:',
  'Assets available and pending:',
  'Fonts and licences:',
  'Fidelity priority:',
  'Deploy target:',
  'Git policy:',
  'Required validations:',
  'Blockers before implementing:',
] as const;

const RENDERING_MODES = [
  'Static (default, the template today)',
  'Mostly static + on-demand routes',
  'Server-first',
  'Static frontend + external backend/API/CMS',
] as const;

const SCENARIO_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'] as const;

/** A markdown pipe-table row for a given first cell, split into its cells. */
function tableRow(markdown: string, firstCell: string): string[] | null {
  const escaped = firstCell.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(new RegExp(`^\\|\\s*${escaped}\\s*\\|(.*)\\|\\s*$`, 'm'));
  if (!match) return null;
  return [firstCell, ...match[1].split('|').map((cell) => cell.trim())];
}

/** Every relative markdown/backtick `.md` reference a file makes, resolved against its own directory. */
function relativeMdReferences(fileRelativePath: string, markdown: string): string[] {
  const dir = path.dirname(fileRelativePath);
  const refs: string[] = [];

  for (const match of markdown.matchAll(/]\(([^)]+)\)/g)) {
    const target = match[1].trim();
    if (target.startsWith('http://') || target.startsWith('https://')) continue;
    const withoutAnchor = target.split('#')[0];
    if (!withoutAnchor.endsWith('.md')) continue;
    refs.push(path.normalize(path.join(dir, withoutAnchor)));
  }

  for (const match of markdown.matchAll(/`(\.\.\/[^`]+\.md|references\/[^`]+\.md)`/g)) {
    refs.push(path.normalize(path.join(dir, match[1])));
  }

  return refs;
}

describe('adoption-wizard.md exists and declares the state machine', () => {
  it('names all six states', () => {
    for (const state of STATES) {
      expect(wizard, `missing state ${state}`).toContain(state);
    }
  });

  it('marks the four pre-confirmation states as write: No', () => {
    for (const state of NO_WRITE_STATES) {
      const row = tableRow(wizard, state);
      expect(row, `no state table row found for ${state}`).not.toBeNull();
      expect(row![1], `${state} should be marked "No" in the Writes allowed column`).toBe('No');
    }
  });

  it('gives IMPLEMENTATION and VERIFICATION a non-"No" writes column', () => {
    const implementation = tableRow(wizard, 'IMPLEMENTATION');
    const verification = tableRow(wizard, 'VERIFICATION');
    expect(implementation).not.toBeNull();
    expect(verification).not.toBeNull();
    expect(implementation![1]).not.toBe('No');
    expect(verification![1]).not.toBe('No');
  });
});

describe('adoption-wizard.md declares the contract', () => {
  it('contains exactly the 15 field labels, in order, inside the contract template', () => {
    const block = wizard.match(/```md\n([\s\S]*?)```/);
    expect(block, 'no fenced ```md contract template block found').not.toBeNull();
    const template = block![1];

    const foundFields = CONTRACT_FIELDS.map((field) => ({
      field,
      index: template.indexOf(`- ${field}`),
    }));
    for (const { field, index } of foundFields) {
      expect(index, `contract template is missing field "${field}"`).toBeGreaterThan(-1);
    }
    const indices = foundFields.map((f) => f.index);
    const sorted = [...indices].sort((a, b) => a - b);
    expect(indices, 'contract fields are not in the specified order').toEqual(sorted);

    // Exactly 15 — a field slipped in or dropped changes this count without
    // necessarily breaking the presence checks above.
    const labelCount = [...template.matchAll(/^- .+:$/gm)].length;
    expect(labelCount).toBe(CONTRACT_FIELDS.length);

    expect(template).toContain('Do you confirm this contract so I can start modifying files?');
  });

  it('marks the persisted contract with the v1 marker and a confirmed status rule', () => {
    expect(wizard).toContain('<!-- adoption-contract: v1 -->');
    expect(wizard).toContain('Status: confirmed');
  });
});

describe('adoption-wizard.md declares rendering paths and the question cap', () => {
  it('names all four rendering modes', () => {
    for (const mode of RENDERING_MODES) {
      expect(wizard, `missing rendering mode "${mode}"`).toContain(mode);
    }
  });

  it('caps a round at 5 questions', () => {
    expect(wizard).toMatch(/5 questions/);
  });
});

describe('adoption-wizard.md declares the acceptance scenarios', () => {
  it.each(SCENARIO_IDS)('scenario %s is a table row with a non-empty expected outcome', (id) => {
    const row = tableRow(wizard, id);
    expect(row, `no scenario row found for ${id}`).not.toBeNull();
    // [id, situation, outcome]
    expect(row!.length).toBeGreaterThanOrEqual(3);
    expect(row![2].length, `${id}'s expected-outcome cell is empty`).toBeGreaterThan(0);
  });
});

describe('the wizard is referenced from every file that must route to it', () => {
  const WIZARD_REFERENCE = 'skills/site-build/references/adoption-wizard.md';

  it('AGENTS.md references the wizard', () => {
    expect(read(AGENTS_PATH)).toContain(WIZARD_REFERENCE);
  });

  it('CLAUDE.md references the wizard', () => {
    expect(read(CLAUDE_PATH)).toContain(WIZARD_REFERENCE);
  });

  it('project-setup/SKILL.md references the wizard by its relative path', () => {
    expect(read(PROJECT_SETUP_PATH)).toContain('../site-build/references/adoption-wizard.md');
  });

  it('design-ingestion/SKILL.md references the wizard by its relative path', () => {
    expect(read(DESIGN_INGESTION_PATH)).toContain('../site-build/references/adoption-wizard.md');
  });

  it('site-build/SKILL.md references the wizard by its relative path', () => {
    expect(read(SITE_BUILD_PATH)).toContain('references/adoption-wizard.md');
  });

  it('site-build/SKILL.md has its "## 0." gate section before "## 1."', () => {
    const content = read(SITE_BUILD_PATH);
    const zero = content.indexOf('## 0. The adoption gate');
    const one = content.indexOf('## 1. What wins');
    expect(zero, '"## 0. The adoption gate" heading not found').toBeGreaterThan(-1);
    expect(one, '"## 1. What wins" heading not found').toBeGreaterThan(-1);
    expect(zero).toBeLessThan(one);
  });
});

describe.each([
  ['adoption-wizard.md', WIZARD_PATH, wizard],
  ['site-build/SKILL.md', SITE_BUILD_PATH, read(SITE_BUILD_PATH)],
  ['project-setup/SKILL.md', PROJECT_SETUP_PATH, read(PROJECT_SETUP_PATH)],
  ['design-ingestion/SKILL.md', DESIGN_INGESTION_PATH, read(DESIGN_INGESTION_PATH)],
])('%s: every relative .md reference resolves to a real file', (_label, relativePath, content) => {
  const refs = relativeMdReferences(relativePath as string, content as string);

  it('has at least one relative .md reference to check', () => {
    expect(refs.length).toBeGreaterThan(0);
  });

  it.each(refs.length > 0 ? refs : ['(none)'])('resolves %s', (ref) => {
    if (ref === '(none)') return;
    expect(existsSync(path.join(REPO_ROOT, ref)), `${ref} does not exist`).toBe(true);
  });
});
