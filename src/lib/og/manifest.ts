import { getCollection } from 'astro:content';
import { t } from '../../i18n/t';
import { readingTime } from '../blog/reading-time';
import { pickCtaForSlug } from './assets';
import type { TemplateData } from './templates/types';

export interface OgManifestEntry {
  /** URL slug after `/og/` (no leading slash, no extension). */
  slug: string;
  data: TemplateData;
}

/** Home cards read the live hero copy so the OG image never drifts from the page. */
function homeEntry(locale: 'en' | 'es'): TemplateData {
  return {
    template: 'home',
    eyebrow: t('home.hero.eyebrow', locale),
    lines: [t('home.hero.headline.line1', locale), t('home.hero.headline.line2', locale)],
    cta: t('home.hero.cta', locale),
    locale,
  };
}

export async function getOgManifest(): Promise<OgManifestEntry[]> {
  const blog = await getCollection('blog', (e) => !e.data.draft);

  const enStatic: OgManifestEntry[] = [
    { slug: 'default', data: { template: 'default', title: 'Build something great.' } },
    { slug: 'home', data: homeEntry('en') },
    { slug: 'blog', data: { template: 'default', kicker: 'Blog', title: 'Notes from the studio' } },
  ];

  const esStatic: OgManifestEntry[] = [
    { slug: 'es/default', data: { template: 'default', title: 'Crea algo grande.' } },
    { slug: 'es/home', data: homeEntry('es') },
    { slug: 'es/blog', data: { template: 'default', kicker: 'Blog', title: 'Notas del estudio' } },
  ];

  const enBlogPosts: OgManifestEntry[] = blog.map((entry) => ({
    slug: `blog/${entry.data.slug}`,
    data: {
      template: 'article',
      title: entry.data.title,
      category: entry.data.category,
      author: entry.data.author,
      readTime: `${readingTime(entry.body ?? '')} min read`,
      cta: pickCtaForSlug(entry.data.slug, 'en'),
      locale: 'en',
    },
  }));

  const esBlogPosts: OgManifestEntry[] = blog.map((entry) => {
    const es = entry.data.translations?.es;
    return {
      slug: `es/blog/${entry.data.slug}`,
      data: {
        template: 'article',
        title: es?.title ?? entry.data.title,
        category: es?.category ?? entry.data.category,
        author: entry.data.author,
        readTime: `${readingTime(entry.body ?? '')} min de lectura`,
        cta: pickCtaForSlug(entry.data.slug, 'es'),
        locale: 'es',
      },
    };
  });

  return [
    ...enStatic,
    ...esStatic,
    ...enBlogPosts,
    ...esBlogPosts,
  ];
}
