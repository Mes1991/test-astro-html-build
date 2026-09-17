import { describe, expect, it } from 'vitest';
import { hashSlug, pickCtaForSlug } from './assets';

describe('hashSlug', () => {
  it('is deterministic and unsigned', () => {
    expect(hashSlug('example-post')).toBe(hashSlug('example-post'));
    expect(hashSlug('example-post')).toBeGreaterThanOrEqual(0);
  });

  it('spreads different slugs to different hashes', () => {
    expect(hashSlug('post-a')).not.toBe(hashSlug('post-b'));
  });
});

describe('pickCtaForSlug', () => {
  it('same slug always gets the same CTA (byte-stable OG builds)', () => {
    expect(pickCtaForSlug('example-post')).toBe(pickCtaForSlug('example-post'));
    expect(pickCtaForSlug('example-post', 'es')).toBe(pickCtaForSlug('example-post', 'es'));
  });

  it('returns a non-empty string per locale', () => {
    expect(pickCtaForSlug('example-post', 'en').length).toBeGreaterThan(0);
    expect(pickCtaForSlug('example-post', 'es').length).toBeGreaterThan(0);
  });

  it('locale switches pools (EN pick differs from ES pick)', () => {
    // Pools share no strings, so the same slug must resolve differently.
    expect(pickCtaForSlug('example-post', 'en')).not.toBe(pickCtaForSlug('example-post', 'es'));
  });

  it('rotates across slugs (at least two distinct CTAs in a small sample)', () => {
    const picks = new Set(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((s) => pickCtaForSlug(s)),
    );
    expect(picks.size).toBeGreaterThan(1);
  });
});
