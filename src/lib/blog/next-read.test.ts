import { describe, expect, it } from 'vitest';
import { pickNextReads, type BlogLikeEntry } from './next-read';

const post = (overrides: Partial<BlogLikeEntry['data']> & { slug: string }): BlogLikeEntry => ({
  data: {
    title: overrides.slug,
    description: 'desc',
    datePublished: '2026-01-01',
    keywords: [],
    draft: false,
    ...overrides,
  },
});

describe('pickNextReads', () => {
  it('returns an empty array when the collection has only the current post', () => {
    const a = post({ slug: 'a' });
    expect(pickNextReads(a, [a])).toEqual([]);
  });

  it('excludes the current post and any drafts', () => {
    const a = post({ slug: 'a' });
    const b = post({ slug: 'b', draft: true });
    const c = post({ slug: 'c' });
    const out = pickNextReads(a, [a, b, c]);
    expect(out.map((p) => p.data.slug)).toEqual(['c']);
  });

  it('prefers higher keyword overlap over recency', () => {
    const current = post({ slug: 'current', keywords: ['ai', 'design'], datePublished: '2026-04-01' });
    const recent = post({ slug: 'recent', keywords: ['food'], datePublished: '2026-05-01' });
    const overlap = post({ slug: 'overlap', keywords: ['ai'], datePublished: '2026-01-01' });
    const out = pickNextReads(current, [current, recent, overlap]);
    expect(out[0].data.slug).toBe('overlap');
  });

  it('breaks overlap ties by recency (newer first)', () => {
    const current = post({ slug: 'current', keywords: ['x'], datePublished: '2026-04-01' });
    const newer = post({ slug: 'newer', keywords: ['x'], datePublished: '2026-03-01' });
    const older = post({ slug: 'older', keywords: ['x'], datePublished: '2026-02-01' });
    const out = pickNextReads(current, [current, older, newer]);
    expect(out.map((p) => p.data.slug)).toEqual(['newer', 'older']);
  });

  it('returns at most 2 picks', () => {
    const current = post({ slug: 'current', keywords: ['x'] });
    const b = post({ slug: 'b', keywords: ['x'], datePublished: '2026-04-01' });
    const c = post({ slug: 'c', keywords: ['x'], datePublished: '2026-03-01' });
    const d = post({ slug: 'd', keywords: ['x'], datePublished: '2026-02-01' });
    const out = pickNextReads(current, [current, b, c, d]);
    expect(out).toHaveLength(2);
    expect(out.map((p) => p.data.slug)).toEqual(['b', 'c']);
  });

  it('falls back to chronological neighbours when no keyword overlap exists', () => {
    const current = post({ slug: 'current', keywords: ['x'], datePublished: '2026-04-01' });
    const earlier = post({ slug: 'earlier', keywords: ['y'], datePublished: '2026-03-01' });
    const later = post({ slug: 'later', keywords: ['z'], datePublished: '2026-05-01' });
    const oldest = post({ slug: 'oldest', keywords: ['w'], datePublished: '2026-01-01' });
    const out = pickNextReads(current, [current, earlier, later, oldest]);
    // Chronological neighbours = nearest by date on either side: earlier + later.
    expect(out.map((p) => p.data.slug).sort()).toEqual(['earlier', 'later']);
  });

  it('falls back to the single nearest neighbour when current is the newest post', () => {
    const current = post({ slug: 'current', keywords: ['x'], datePublished: '2026-05-01' });
    const earlier = post({ slug: 'earlier', keywords: ['y'], datePublished: '2026-04-01' });
    const oldest = post({ slug: 'oldest', keywords: ['z'], datePublished: '2026-01-01' });
    const out = pickNextReads(current, [current, earlier, oldest]);
    // No "later" neighbour exists; fill the second slot with the next-nearest by date.
    expect(out.map((p) => p.data.slug)).toEqual(['earlier', 'oldest']);
  });
});
