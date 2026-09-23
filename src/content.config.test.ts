import { describe, expect, it } from 'vitest';
import { ROUTER_SAFE_SLUG_RULE, routerSafeSlugSchema } from './lib/content/slug';

describe('router-safe blog slug contract', () => {
  it.each(['post', 'whitepaper.pdf', 'diseño-web', '東京-guide', 'release.v2'])(
    'accepts the supported slug %s',
    (slug) => expect(routerSafeSlugSchema.safeParse(slug).success).toBe(true),
  );

  it.each([
    '',
    'Bad-Slug',
    'bad slug',
    'bad/slug',
    'bad\\slug',
    'bad?slug',
    'bad#slug',
    'bad%20slug',
    'bad<slug',
    'bad>slug',
    'bad:slug',
    'bad"slug',
    'bad|slug',
    'bad*slug',
    'bad\u0000slug',
    'bad\u001fslug',
    'bad\u007fslug',
    '-bad',
    'bad-',
    '.',
    '..',
  ])(
    'rejects the router-unsafe slug %j with the named rule',
    (slug) => {
      const result = routerSafeSlugSchema.safeParse(slug);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe(ROUTER_SAFE_SLUG_RULE);
    },
  );
});
