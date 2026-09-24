import { describe, expect, it } from 'vitest';
import {
  blogDiscoverySchema,
  SITEMAP_INDEXABILITY_RULE,
} from './lib/content/discovery';
import { ROUTER_SAFE_SLUG_RULE, routerSafeSlugSchema } from './lib/content/slug';

describe('blog discovery controls', () => {
  it('defaults to an indexable page included in the sitemap', () => {
    expect(blogDiscoverySchema.parse({})).toEqual({ noindex: false, sitemap: true });
  });

  it('allows an indexable page to opt out of the sitemap', () => {
    expect(blogDiscoverySchema.parse({ sitemap: false })).toEqual({
      noindex: false,
      sitemap: false,
    });
  });

  it('allows noindex only with an explicit sitemap opt-out', () => {
    expect(blogDiscoverySchema.parse({ noindex: true, sitemap: false })).toEqual({
      noindex: true,
      sitemap: false,
    });
  });

  it.each([{ noindex: true }, { noindex: true, sitemap: true }])(
    'rejects noindex when sitemap is true or left at its default: %j',
    (input) => {
      const result = blogDiscoverySchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({ path: ['sitemap'], message: SITEMAP_INDEXABILITY_RULE }),
        );
      }
    },
  );
});

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
