import { describe, expect, it } from 'vitest';
import { siteSeo } from '../defaults';
import { buildBreadcrumbList, breadcrumbsFromPath } from './breadcrumb';

const SITE = siteSeo.siteUrl;

describe('buildBreadcrumbList', () => {
  it('builds positions starting at 1', () => {
    const out = buildBreadcrumbList([
      { name: 'Home', url: 'https://example.com/' },
      { name: 'Work', url: 'https://example.com/work/' },
    ]);
    if (out === null) throw new Error('expected non-null');
    expect(out['@type']).toBe('BreadcrumbList');
    const list = out.itemListElement as unknown as Array<{
      position: number;
      name: string;
    }>;
    expect(list).toHaveLength(2);
    const first = list[0];
    expect(first.position).toBe(1);
    expect(first.name).toBe('Home');
  });

  it('returns null on empty input (callers should not emit)', () => {
    expect(buildBreadcrumbList([])).toBeNull();
  });
});

describe('breadcrumbsFromPath', () => {
  it('always starts with Home', () => {
    const crumbs = breadcrumbsFromPath('/work');
    expect(crumbs[0]).toEqual({ name: 'Home', url: `${SITE}/` });
  });

  it('builds nested crumbs from segments', () => {
    expect(breadcrumbsFromPath('/work/example-project')).toEqual([
      { name: 'Home', url: `${SITE}/` },
      { name: 'Work', url: `${SITE}/work/` },
      { name: 'Example Project', url: `${SITE}/work/example-project/` },
    ]);
  });

  it('humanizes slugs (kebab-case → Title Case)', () => {
    const last = breadcrumbsFromPath('/about-us').pop();
    expect(last?.name).toBe('About Us');
  });

  it('returns just Home for the root path', () => {
    expect(breadcrumbsFromPath('/')).toEqual([
      { name: 'Home', url: `${SITE}/` },
    ]);
  });

  it('skips locale prefix when deriving crumbs and translates Home', () => {
    expect(breadcrumbsFromPath('/es/', 'es')).toEqual([
      { name: 'Inicio', url: `${SITE}/es/` },
    ]);
  });

  it('preserves locale prefix in crumb URLs', () => {
    expect(breadcrumbsFromPath('/es/sobre-nosotros', 'es')).toEqual([
      { name: 'Inicio', url: `${SITE}/es/` },
      { name: 'Sobre Nosotros', url: `${SITE}/es/sobre-nosotros/` },
    ]);
  });
});
