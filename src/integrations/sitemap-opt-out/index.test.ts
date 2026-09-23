import { describe, expect, it } from 'vitest';
import { removeSitemapUrls } from './index';

describe('sitemap page-level opt-out', () => {
  it('removes only URL blocks whose loc is excluded', () => {
    const xml =
      '<urlset>' +
      '<url><loc>https://example.com/kept/</loc></url>' +
      '<url><loc>https://example.com/private/</loc><changefreq>weekly</changefreq></url>' +
      '</urlset>';
    expect(removeSitemapUrls(xml, new Set(['https://example.com/private/']))).toBe(
      '<urlset><url><loc>https://example.com/kept/</loc></url></urlset>',
    );
  });
});
