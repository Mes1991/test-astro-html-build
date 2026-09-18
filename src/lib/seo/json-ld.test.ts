import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from './json-ld';

/**
 * Hostile-content coverage for JSON-LD serialization.
 *
 * The previous implementation embedded `JSON.stringify(entry)` directly. Every assertion in the
 * "hostile content" block below fails against that implementation.
 */

/** A schema object shaped like the real `buildBlogPosting` output. */
function blogPostingWith(headline: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description: 'A post description.',
  };
}

describe('serializeJsonLd — hostile content', () => {
  const HOSTILE = 'Post </script><script>alert(1)</script>';

  it('never emits a raw closing script tag', () => {
    const out = serializeJsonLd(blogPostingWith(HOSTILE));

    // Guard: plain JSON.stringify does leak it, so this assertion is meaningful.
    expect(JSON.stringify(blogPostingWith(HOSTILE))).toContain('</script>');

    expect(out).not.toContain('</script>');
    expect(out.toLowerCase()).not.toContain('</script');
  });

  it('escapes every `<`, so no element can be opened or closed', () => {
    const out = serializeJsonLd(blogPostingWith(HOSTILE));

    expect(out).not.toContain('<');
    expect(out).toContain('\\u003c');
  });

  it('neutralizes an HTML comment opener', () => {
    const out = serializeJsonLd(blogPostingWith('Post <!--'));

    expect(out).not.toContain('<!--');
  });

  it('survives the escape as valid JSON that parses back to the original value', () => {
    const original = blogPostingWith(HOSTILE);
    const parsed = JSON.parse(serializeJsonLd(original));

    expect(parsed).toEqual(original);
    expect(parsed.headline).toBe(HOSTILE);
  });

  it('escapes a hostile value in any position, not just the first', () => {
    const out = serializeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Safe?' },
        { '@type': 'Question', name: '</script><img src=x onerror=alert(1)>' },
      ],
    });

    expect(out).not.toContain('<');
  });
});

describe('serializeJsonLd — ordinary content', () => {
  it('leaves ordinary schema output unchanged apart from the escape', () => {
    const entry = blogPostingWith('An Ordinary Post Title');

    expect(serializeJsonLd(entry)).toBe(JSON.stringify(entry));
  });

  it('preserves accents and non-ASCII content', () => {
    const entry = blogPostingWith('Diseño y arquitectura contemporánea');

    expect(JSON.parse(serializeJsonLd(entry)).headline).toBe(
      'Diseño y arquitectura contemporánea',
    );
  });
});
