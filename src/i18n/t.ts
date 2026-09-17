import en from './en.json';
import es from './es.json';
import type { LocaleCode } from '../lib/seo/types';

const dictionaries: Record<LocaleCode, typeof en> = {
  en,
  es: es as typeof en,
};

/**
 * Look up a string by dotted key path. Falls back to English if missing in
 * the requested locale, then to the literal key if missing in English too.
 *
 * Vars are interpolated as {name}.
 */
export function t(
  key: string,
  locale: LocaleCode = 'en',
  vars: Record<string, string | number> = {},
): string {
  const value =
    lookup(dictionaries[locale], key) ?? lookup(dictionaries.en, key) ?? key;
  if (typeof value !== 'string') return key;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    value,
  );
}

function lookup(dict: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object' && k in acc) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, dict);
}
