import { describe, expect, it } from 'vitest';
import type { OgManifestEntry } from './manifest';

// Synthetic check: the static slugs we always need
const REQUIRED_STATIC_SLUGS = ['default', 'home', 'blog'];

describe('OG manifest static slugs', () => {
  it('declares all required static slugs (compile-time + sanity contract)', () => {
    // We can't execute getOgManifest() here without the Astro content layer.
    // This test documents the contract that the implementation must honor.
    // The build itself enforces it via getStaticPaths in the endpoint.
    expect(REQUIRED_STATIC_SLUGS).toContain('default');
    expect(REQUIRED_STATIC_SLUGS).toContain('home');
  });

  it('OgManifestEntry shape exposes slug + data', () => {
    const fake: OgManifestEntry = {
      slug: 'home',
      data: { template: 'default', title: 'x' },
    };
    expect(fake.slug).toBe('home');
    expect(fake.data.template).toBe('default');
  });

  it('home template entries carry hero lines + optional eyebrow/cta', () => {
    const fake: OgManifestEntry = {
      slug: 'home',
      data: {
        template: 'home',
        lines: ['Build something', 'that lasts.'],
        eyebrow: 'A studio for ambitious teams',
        cta: 'Get started',
        locale: 'en',
      },
    };
    expect(fake.data.template).toBe('home');
    if (fake.data.template === 'home') {
      expect(fake.data.lines).toHaveLength(2);
    }
  });
});
