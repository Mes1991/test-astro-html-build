import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALES } from '../lib/seo/types';

/**
 * i18n key parity, enforced rather than reviewed.
 *
 * `t()` falls back to English when a key is missing in another locale, so a
 * missing translation ships English under that locale's URLs with no signal.
 * This suite makes that a failure instead.
 *
 * Locales come from `LOCALES`, and dictionaries are read from disk rather than
 * imported, so a single-locale site passes with one dictionary and needs no
 * empty file kept only for parity.
 */

const I18N_DIR = path.join('src', 'i18n');

function dictionaryPath(locale: string): string {
  return path.join(I18N_DIR, `${locale}.json`);
}

function readDictionary(locale: string): unknown {
  return JSON.parse(readFileSync(dictionaryPath(locale), 'utf8'));
}

/**
 * Dotted leaf paths, each paired with the type of its value.
 *
 * An empty object has no entries, so `Object.entries({}).flatMap(...)` used to
 * return `[]` — an empty dictionary, or an empty nested section like
 * `{ "nav": {} }`, silently contributed zero leaves and passed the "only
 * string leaves" check below with nothing to flag. An empty object is now its
 * own leaf, typed `'empty object'`, named after its key (or `'(root)'` at the
 * top level), so the existing non-string filter names it instead of missing it.
 */
function leaves(node: unknown, prefix = ''): Array<[string, string]> {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    return [[prefix, Array.isArray(node) ? 'array' : typeof node]];
  }
  const entries = Object.entries(node);
  if (entries.length === 0) {
    return [[prefix || '(root)', 'empty object']];
  }
  return entries.flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  );
}

const otherLocales = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

describe('i18n dictionaries', () => {
  it.each(LOCALES)('%s has a dictionary file', (locale) => {
    expect(existsSync(dictionaryPath(locale)), `missing ${dictionaryPath(locale)}`).toBe(
      true,
    );
  });

  it.each(LOCALES)('%s has only string leaves', (locale) => {
    const nonString = leaves(readDictionary(locale)).filter(([, type]) => type !== 'string');
    expect(nonString, `non-string values in ${dictionaryPath(locale)}`).toEqual([]);
  });

  it.runIf(otherLocales.length > 0).each(otherLocales)(
    `%s has exactly the keys of ${DEFAULT_LOCALE}`,
    (locale) => {
      const reference = new Set(leaves(readDictionary(DEFAULT_LOCALE)).map(([key]) => key));
      const actual = new Set(leaves(readDictionary(locale)).map(([key]) => key));
      const missing = [...reference].filter((key) => !actual.has(key));
      const extra = [...actual].filter((key) => !reference.has(key));
      expect({ missing, extra }, `key drift in ${dictionaryPath(locale)}`).toEqual({
        missing: [],
        extra: [],
      });
    },
  );
});

/**
 * `leaves()` is what the "only string leaves" check above is built on, so its
 * empty-object handling is exercised directly here with synthetic input
 * rather than relying on the on-disk dictionaries happening to contain one.
 * With this fix, `leaves()` can no longer return `[]`: an empty object at any
 * depth is itself a non-string leaf, so a dictionary made entirely of empty
 * objects (zero string leaves) still fails the "only string leaves" test
 * instead of vanishing.
 */
describe('leaves()', () => {
  it('reports an empty root object as a single non-string leaf named "(root)"', () => {
    expect(leaves({})).toEqual([['(root)', 'empty object']]);
  });

  it('reports a nested empty object as a leaf named after its key', () => {
    expect(leaves({ nav: {} })).toEqual([['nav', 'empty object']]);
  });

  it('still reports ordinary string leaves', () => {
    expect(leaves({ nav: { home: 'Home' } })).toEqual([['nav.home', 'string']]);
  });
});

/**
 * `t()` reads dictionaries by locale name from `src/i18n`, so a stray file —
 * left behind by a rename, a copy-paste, or a partial locale removal — is
 * dead weight nothing ever loads. `LOCALES` is the only source of truth for
 * which locales the site serves, so every `*.json` here must be one of them.
 */
describe('no orphan locale dictionaries', () => {
  const jsonFiles = readdirSync(I18N_DIR).filter((file) => file.endsWith('.json'));

  it.each(jsonFiles)('%s is a locale in LOCALES', (file) => {
    const locale = file.replace(/\.json$/, '');
    expect(
      (LOCALES as readonly string[]).includes(locale),
      `${path.join(I18N_DIR, file)} is not a locale in LOCALES`,
    ).toBe(true);
  });
});
