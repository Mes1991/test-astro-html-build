import { describe, expect, it } from 'vitest';
import { lintHtml } from './lint';

const wrap = (head: string, body = '<main><h1>Title</h1></main>') =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

describe('lintHtml — title', () => {
  it('passes a sane title', () => {
    const findings = lintHtml(
      wrap(
        '<title>About — Example Site</title><meta name="description" content="A solid description in the normal length range to avoid warnings during these tests."><link rel="canonical" href="https://example.com/">',
      ),
    );
    expect(findings.filter((f) => f.severity === 'fail')).toHaveLength(0);
  });

  it('fails on missing title', () => {
    const findings = lintHtml(wrap(''));
    expect(findings.some((f) => f.code === 'TITLE_MISSING' && f.severity === 'fail')).toBe(true);
  });

  it('warns on title shorter than 30', () => {
    const findings = lintHtml(wrap('<title>Hi</title>'));
    expect(findings.some((f) => f.code === 'TITLE_TOO_SHORT')).toBe(true);
  });

  it('warns on title longer than 70', () => {
    const long = 'X'.repeat(80);
    const findings = lintHtml(wrap(`<title>${long}</title>`));
    expect(findings.some((f) => f.code === 'TITLE_TOO_LONG')).toBe(true);
  });
});

describe('lintHtml — description', () => {
  it('fails on missing description', () => {
    const findings = lintHtml(wrap('<title>About — Example Site</title>'));
    expect(findings.some((f) => f.code === 'DESC_MISSING' && f.severity === 'fail')).toBe(true);
  });

  it('passes on a good description', () => {
    const findings = lintHtml(
      wrap(
        '<title>About — Example Site</title><meta name="description" content="A solid description that hits the typical 70 to 160 character range for search snippets and social."><link rel="canonical" href="https://example.com/">',
      ),
    );
    expect(findings.filter((f) => f.severity === 'fail')).toHaveLength(0);
  });

  it('warns on description shorter than 70', () => {
    const findings = lintHtml(
      wrap('<title>About — Example Site</title><meta name="description" content="Short">'),
    );
    expect(findings.some((f) => f.code === 'DESC_TOO_SHORT')).toBe(true);
  });

  it('warns on description longer than 160', () => {
    const long = 'X'.repeat(200);
    const findings = lintHtml(
      wrap(`<title>About — Example Site</title><meta name="description" content="${long}">`),
    );
    expect(findings.some((f) => f.code === 'DESC_TOO_LONG')).toBe(true);
  });
});

describe('lintHtml — H1', () => {
  const headOK =
    '<title>X — Example Site</title><meta name="description" content="A solid description in the normal length range to avoid warnings during these tests."><link rel="canonical" href="https://example.com/">';

  it('fails on missing H1', () => {
    const findings = lintHtml(wrap(headOK, '<main>no heading</main>'));
    expect(findings.some((f) => f.code === 'H1_MISSING' && f.severity === 'fail')).toBe(true);
  });

  it('fails on multiple H1s', () => {
    const findings = lintHtml(
      wrap(headOK, '<main><h1>One</h1><h1>Two</h1></main>'),
    );
    expect(findings.some((f) => f.code === 'H1_MULTIPLE' && f.severity === 'fail')).toBe(true);
  });

  it('passes on exactly one H1', () => {
    const findings = lintHtml(wrap(headOK, '<main><h1>One</h1></main>'));
    expect(findings.filter((f) => f.severity === 'fail')).toHaveLength(0);
  });
});

describe('lintHtml — img alt', () => {
  const headOK =
    '<title>X — Example Site</title><meta name="description" content="A solid description in the normal length range to avoid warnings during these tests."><link rel="canonical" href="https://example.com/">';

  it('fails on img without alt', () => {
    const findings = lintHtml(
      wrap(headOK, '<main><h1>X</h1><img src="/x.png"></main>'),
    );
    expect(findings.some((f) => f.code === 'IMG_ALT_MISSING' && f.severity === 'fail')).toBe(true);
  });

  it('passes on img with empty alt + aria-hidden (decorative)', () => {
    const findings = lintHtml(
      wrap(headOK, '<main><h1>X</h1><img src="/x.png" alt="" aria-hidden="true"></main>'),
    );
    expect(findings.filter((f) => f.severity === 'fail')).toHaveLength(0);
  });

  it('passes on img with descriptive alt', () => {
    const findings = lintHtml(
      wrap(headOK, '<main><h1>X</h1><img src="/x.png" alt="A photo"></main>'),
    );
    expect(findings.filter((f) => f.severity === 'fail')).toHaveLength(0);
  });
});

describe('lintHtml — canonical', () => {
  const headOK =
    '<title>X — Example Site</title><meta name="description" content="A solid description in the normal length range to avoid warnings during these tests.">';
  it('fails on missing canonical', () => {
    const findings = lintHtml(wrap(headOK));
    expect(findings.some((f) => f.code === 'CANONICAL_MISSING' && f.severity === 'fail')).toBe(true);
  });
  it('passes on canonical present', () => {
    const findings = lintHtml(
      wrap(`${headOK}<link rel="canonical" href="https://example.com/">`),
    );
    expect(findings.some((f) => f.code === 'CANONICAL_MISSING')).toBe(false);
  });
});

describe('lintHtml — og:image', () => {
  const headOK =
    '<title>X — Example Site</title><meta name="description" content="A solid description in the normal length range to avoid warnings during these tests."><link rel="canonical" href="https://example.com/">';

  it('warns on missing og:image', () => {
    const findings = lintHtml(wrap(headOK));
    expect(findings.some((f) => f.code === 'OG_IMAGE_MISSING')).toBe(true);
  });

  it('passes when og:image present', () => {
    const findings = lintHtml(
      wrap(`${headOK}<meta property="og:image" content="/og/home.png"><meta property="og:image:alt" content="Home">`),
    );
    expect(findings.some((f) => f.code === 'OG_IMAGE_MISSING')).toBe(false);
  });
});

describe('lintHtml — JSON-LD', () => {
  const headOK =
    '<title>X — Example Site</title><meta name="description" content="A solid description in the normal length range to avoid warnings during these tests."><link rel="canonical" href="https://example.com/">';

  it('passes valid JSON-LD with @context', () => {
    const ld = '{"@context":"https://schema.org","@type":"Organization","name":"X"}';
    const findings = lintHtml(
      `<!doctype html><html><head>${headOK}<script type="application/ld+json">${ld}</script></head><body><main><h1>X</h1></main></body></html>`,
    );
    expect(findings.some((f) => f.code === 'LD_PARSE_ERROR')).toBe(false);
    expect(findings.some((f) => f.code === 'LD_NO_CONTEXT')).toBe(false);
  });

  it('fails on broken JSON', () => {
    const findings = lintHtml(
      `<!doctype html><html><head>${headOK}<script type="application/ld+json">{not json}</script></head><body><main><h1>X</h1></main></body></html>`,
    );
    expect(findings.some((f) => f.code === 'LD_PARSE_ERROR' && f.severity === 'fail')).toBe(true);
  });

  it('warns on JSON-LD missing @context', () => {
    const ld = '{"@type":"Organization","name":"X"}';
    const findings = lintHtml(
      `<!doctype html><html><head>${headOK}<script type="application/ld+json">${ld}</script></head><body><main><h1>X</h1></main></body></html>`,
    );
    expect(findings.some((f) => f.code === 'LD_NO_CONTEXT')).toBe(true);
  });
});

describe('lintHtml — JSON-LD inLanguage cross-check (LD_LANG_MISMATCH)', () => {
  const headOK =
    '<title>X — Example Site</title><meta name="description" content="A solid description in the normal length range to avoid warnings during these tests."><link rel="canonical" href="https://example.com/">';

  it('warns when JSON-LD inLanguage primary subtag does not match <html lang>', () => {
    const ld =
      '{"@context":"https://schema.org","@type":"AboutPage","name":"X","inLanguage":"en-US"}';
    const findings = lintHtml(
      `<!doctype html><html lang="es"><head>${headOK}<script type="application/ld+json">${ld}</script></head><body><main><h1>X</h1></main></body></html>`,
    );
    expect(findings.some((f) => f.code === 'LD_LANG_MISMATCH' && f.severity === 'warn')).toBe(true);
  });

  it('passes when primary subtag matches across regional variants (es vs es-MX)', () => {
    const ld =
      '{"@context":"https://schema.org","@type":"AboutPage","name":"X","inLanguage":"es-MX"}';
    const findings = lintHtml(
      `<!doctype html><html lang="es"><head>${headOK}<script type="application/ld+json">${ld}</script></head><body><main><h1>X</h1></main></body></html>`,
    );
    expect(findings.some((f) => f.code === 'LD_LANG_MISMATCH')).toBe(false);
  });

  it('does not warn when JSON-LD entry has no inLanguage', () => {
    const ld = '{"@context":"https://schema.org","@type":"Organization","name":"X"}';
    const findings = lintHtml(
      `<!doctype html><html lang="es"><head>${headOK}<script type="application/ld+json">${ld}</script></head><body><main><h1>X</h1></main></body></html>`,
    );
    expect(findings.some((f) => f.code === 'LD_LANG_MISMATCH')).toBe(false);
  });
});
