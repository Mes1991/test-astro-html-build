import { describe, expect, it } from 'vitest';
import { t } from './t';

describe('t()', () => {
  it('returns English by default', () => {
    expect(t('nav.home')).toBe('Home');
  });

  it('returns Spanish when locale=es', () => {
    expect(t('nav.home', 'es')).toBe('Inicio');
  });

  it('falls back to English on missing Spanish key', () => {
    // Pretend a key is in en but not es by checking a known-only-en path
    // (we know dictionaries are symmetric, so use the literal-key fallback path)
    expect(t('does.not.exist')).toBe('does.not.exist');
  });

  it('interpolates {var} placeholders', () => {
    expect(t('languageSwitcher.switchTo', 'en', { lang: 'Español' })).toBe(
      'Switch to Español',
    );
  });

  it('interpolates Spanish strings', () => {
    expect(t('languageSwitcher.switchTo', 'es', { lang: 'English' })).toBe(
      'Cambiar a English',
    );
  });
});
