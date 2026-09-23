import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_LOCALE, LOCALES } from '../lib/seo/types';

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

// Normalized to LF: a Windows checkout with core.autocrlf=true yields CRLF, and the
// structural matches below are written against LF.
const read = (relative: string): string =>
  readFileSync(path.join(REPO_ROOT, relative), 'utf8').replace(/\r\n/g, '\n');

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

  // CLAUDE.md is loaded on every request, so its rule 0 is what a clean agent sees before
  // it opens any skill. Clean-agent runs delegated mappers — one with edit tools, one with
  // only a shell — before reading the wizard; the always-loaded rule has to name both.
  it('CLAUDE.md rule 0 orders the wizard first and bans all delegation before confirmation', () => {
    const rule0 = read(CLAUDE_PATH).match(/^0\. \*\*Adoption gate first:\*\*[\s\S]*?(?=^1\. )/m);
    expect(rule0, 'CLAUDE.md rule 0 not found').not.toBeNull();
    const text = rule0![0].replace(/\s+/g, ' ');
    expect(text).toContain('read it before any other tool call or delegation');
    expect(text).toContain('no delegation to any subagent');
    expect(text).toContain('a shell is a write tool');
  });

  it('adoption-wizard.md pins the round and preflight-reporting rules', () => {
    const text = wizard.replace(/\s+/g, ' ');
    expect(text).toContain('One round per message:');
    expect(text).toContain('never folded into a Round 1 option');
    expect(tableRow(wizard, 'READ_ONLY_INTAKE')![2]).toContain('§5 preflight results');
    expect(text).toContain('delegating to any subagent at all');
  });

  // Clean-agent runs folded a detected cart into Round 1 B ("does the cart need to work?"),
  // which pre-empts the Round 2 feature decision. B's wording is pinned feature-free. This
  // pins the contract text only; whether an agent obeys it is measured behaviourally (S1).
  it('adoption-wizard.md keeps Round 1 B free of detected features', () => {
    const text = wizard.replace(/\s+/g, ' ');
    expect(text).toContain('Ask B with this wording and these options only.');
    expect(text).toContain('add no feature detected in the design');
    expect(tableRow(wizard, 'S1')![2]).toContain('names no detected feature in any of them');

    // The canonical question and options themselves must not name a Round 2 feature.
    const b = text.match(/\*\*B\. Site type\.\*\*(.*?)\*\*Ask B/);
    expect(b, 'Round 1 B paragraph not found').not.toBeNull();
    expect(b![1]).not.toMatch(/\b(cart|checkout|map|search|payment)\b/i);
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

describe('skill descriptions route a site build to the adoption gate first', () => {
  const ROUTING_SENTENCE =
    'For a site build or adoption, invoke the site-build skill first; this skill runs only inside or after its adoption gate.';

  /** The frontmatter `description:` value — what a description-based skill loader routes on. */
  function description(markdown: string): string {
    const match = markdown.match(/^---\n[\s\S]*?^description:\s*"([^\n]*)"\s*$[\s\S]*?^---$/m);
    return match ? match[1] : '';
  }

  it.each([
    ['project-setup', PROJECT_SETUP_PATH],
    ['design-ingestion', DESIGN_INGESTION_PATH],
  ])('%s description states the routing sentence', (_name, file) => {
    const text = description(read(file));
    expect(text, `no frontmatter description found in ${file}`).not.toBe('');
    expect(text).toContain(ROUTING_SENTENCE);
  });
});

/**
 * Wizard §7 inventories the files a monolingual migration touches. That inventory is
 * evidence the contract relies on, so it must stay true. Entries that exist only
 * because a second locale does (`/es/` routes, the switcher, the es→en fallback) are
 * checked only while that locale is still in `LOCALES` — a converted single-locale
 * repository is not expected to keep them. The classification is derived from
 * `LOCALES`/`DEFAULT_LOCALE` rather than hardcoded to `es`, so this suite keeps
 * working after a real monolingual conversion instead of describing one repository
 * shape forever.
 */
describe('adoption-wizard.md §7 inventory matches the repository', () => {
  const section = wizard.match(/^## §7[^\n]*\n([\s\S]*?)^## §8/m);
  const text = section ? section[1] : '';
  const locales = LOCALES as readonly string[];
  // The es→en fallback only exists while English is the default and Spanish is still served.
  const hasEsToEnFallback = locales.includes('es') && DEFAULT_LOCALE === 'en';

  const paths = [...new Set([...text.matchAll(/`((?:src\/|astro\.config)[^`]*)`/g)].map((m) => m[1]))];

  /**
   * Codes that are locales: the ones served now plus every dictionary §7 names. A
   * two-letter path segment outside this set (`src/pages/og/`) is an ordinary directory,
   * not a locale, and is never skipped.
   */
  const localeCodes = new Set([
    ...locales,
    ...paths.flatMap((p) => p.match(/^src\/i18n\/([a-z]{2})\.json$/)?.slice(1) ?? []),
  ]);

  /**
   * Whether a §7 entry is expected to exist given the repository's current `LOCALES`.
   * A dictionary `src/i18n/xx.json` exists while `xx` is served. A locale segment `/xx/`
   * (e.g. `src/pages/es/**`) exists only while `xx` is served AND is not the default —
   * the default locale is unprefixed (`prefixDefaultLocale: false`), so a Spanish-only
   * site serves Spanish from the root and has no `src/pages/es/`.
   */
  function isEntryApplicable(entry: string): boolean {
    const dictionary = entry.match(/^src\/i18n\/([a-z]{2})\.json$/);
    if (dictionary) return locales.includes(dictionary[1]);
    const segment = entry.match(/\/([a-z]{2})\//);
    if (segment && localeCodes.has(segment[1])) {
      return locales.includes(segment[1]) && segment[1] !== DEFAULT_LOCALE;
    }
    // The switcher only exists to switch between locales.
    if (entry.endsWith('LanguageSwitcher.astro')) return LOCALES.length > 1;
    return true;
  }

  /** Escapes every regex-special character in a glob's literal (non-`*`) portions. */
  function escapeRegExpChars(literal: string): string {
    return literal.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }

  /** Converts a §7 glob (`**` = any depth, `*` = no slash) to a RegExp anchored on a full repo-relative path. */
  function globToRegExp(glob: string): RegExp {
    const pattern = glob
      .split(/(\*\*|\*)/)
      .map((part) => (part === '**' ? '.*' : part === '*' ? '[^/]*' : escapeRegExpChars(part)))
      .join('');
    return new RegExp(`^${pattern}$`);
  }

  /** Every file under `dir` (an absolute path), as repo-root-relative POSIX paths. */
  function listFilesRecursive(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFilesRecursive(full);
      return [path.relative(REPO_ROOT, full).split(path.sep).join('/')];
    });
  }

  /** True when at least one real file under the repo matches a §7 glob entry. */
  function globMatchesAFile(globEntry: string): boolean {
    const dir = globEntry.slice(0, globEntry.indexOf('*')).replace(/\/$/, '');
    const regex = globToRegExp(globEntry);
    return listFilesRecursive(path.join(REPO_ROOT, dir)).some((file) => regex.test(file));
  }

  /** True when a repo-relative path is named exactly or matched by a glob in the §7 inventory. */
  function coveredByInventory(relativePath: string): boolean {
    const posixPath = relativePath.split(path.sep).join('/');
    return paths.some((entry) =>
      entry.includes('*') ? globToRegExp(entry).test(posixPath) : entry === posixPath,
    );
  }

  it('finds the §7 section and its inventory', () => {
    expect(section, 'no "## §7" section found before "## §8"').not.toBeNull();
    expect(paths.length).toBeGreaterThan(0);
  });

  it.each(paths)('%s exists', (entry) => {
    if (!isEntryApplicable(entry)) return;
    if (entry.includes('*')) {
      expect(globMatchesAFile(entry), `no file matches glob ${entry}`).toBe(true);
      return;
    }
    expect(existsSync(path.join(REPO_ROOT, entry)), `${entry} does not exist`).toBe(true);
  });

  it.each([
    ['src/lib/seo/types.ts', ['LOCALES', 'DEFAULT_LOCALE']],
    ['src/lib/seo/locale.ts', ['ROUTE_KEYS', 'localizedSlugs']],
  ])('%s still exports the symbols §7 names', (file, symbols) => {
    const source = read(file);
    for (const symbol of symbols) {
      expect(text, `§7 no longer names ${symbol}`).toContain(symbol);
      expect(source, `${file} no longer exports ${symbol}`).toMatch(
        new RegExp(`export const ${symbol}\\b`),
      );
    }
  });

  it.runIf(hasEsToEnFallback)('the es→en fallback §7 warns about is still configured', () => {
    expect(text).toContain("fallback: { es: 'en' }");
    expect(read('astro.config.mjs')).toContain("fallback: { es: 'en' }");
  });

  /**
   * The forward check above proves every §7 entry points at something real; it says
   * nothing about entries §7 never mentions. A structural locale surface — a
   * dictionary, a locale's page tree, a `LanguageSwitcher` importer — that isn't named
   * or glob-matched by §7 is exactly the kind of gap the wizard would silently miss
   * when scoping a monolingual migration, so this is the reverse direction: real files
   * checked against the inventory, not the inventory checked against real files.
   */
  describe('reverse: structural locale surfaces are covered by the inventory', () => {
    it.each(readdirSync(path.join(REPO_ROOT, 'src', 'i18n')).filter((f) => f.endsWith('.json')))(
      'src/i18n/%s is named or matched by a §7 entry',
      (file) => {
        const rel = `src/i18n/${file}`;
        expect(coveredByInventory(rel), `${rel} is not named or matched by any §7 entry`).toBe(
          true,
        );
      },
    );

    const nonDefaultLocales = (LOCALES as readonly string[]).filter((l) => l !== DEFAULT_LOCALE);
    const localePageFiles = nonDefaultLocales.flatMap((locale) =>
      listFilesRecursive(path.join(REPO_ROOT, 'src', 'pages', locale)),
    );

    it.each(localePageFiles.length > 0 ? localePageFiles : ['(none)'])(
      '%s is named or matched by a §7 entry',
      (rel) => {
        if (rel === '(none)') return;
        expect(coveredByInventory(rel), `${rel} is not named or matched by any §7 entry`).toBe(
          true,
        );
      },
    );

    /** Matches a real `import X from "…LanguageSwitcher[.astro]"` statement, not a comment mentioning it. */
    function importsLanguageSwitcher(content: string): boolean {
      return /^\s*import\s+\w+\s+from\s+["'][^"']*LanguageSwitcher(?:\.astro)?["']/m.test(content);
    }

    const astroFiles = listFilesRecursive(path.join(REPO_ROOT, 'src')).filter(
      (f) => f.endsWith('.astro') && !f.endsWith('LanguageSwitcher.astro') && !f.includes('.test.'),
    );
    const importers = astroFiles.filter((f) => importsLanguageSwitcher(read(f)));

    it.each(importers.length > 0 ? importers : ['(none)'])(
      '%s (imports LanguageSwitcher) is covered by the §7 inventory',
      (rel) => {
        if (rel === '(none)') return;
        // Either the file itself is named/matched, or — since §7 covers importers in
        // prose ("its use in `SiteHeader`") rather than as a file entry — its basename
        // is mentioned somewhere in the §7 text.
        const basename = path.basename(rel, '.astro');
        const covered = coveredByInventory(rel) || text.includes(basename);
        expect(
          covered,
          `${rel} imports LanguageSwitcher but is neither named/matched by §7 nor is "${basename}" mentioned in §7 text`,
        ).toBe(true);
      },
    );
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
