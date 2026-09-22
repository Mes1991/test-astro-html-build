import { existsSync, readFileSync } from 'node:fs';
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

/** Dotted leaf paths, each paired with the type of its value. */
function leaves(node: unknown, prefix = ''): Array<[string, string]> {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    return [[prefix, Array.isArray(node) ? 'array' : typeof node]];
  }
  return Object.entries(node).flatMap(([key, value]) =>
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
