import type { BlogPosting, WithContext } from 'schema-dts';
import { siteSeo, localeTag } from '../defaults';
import { absoluteUrl } from '../url';
import type { LocaleCode } from '../types';

export interface BlogPostingInput {
  headline: string;
  description: string;
  slug: string;
  imageUrl: string;
  datePublished: string; // ISO 8601
  dateModified?: string;
  authorName: string;
  section?: string;
  keywords?: readonly string[];
  locale?: LocaleCode;
  /** Optional explicit page URL (e.g. /es/blog/<slug>). If omitted, defaults to /blog/<slug>. */
  pageUrl?: string;
}

export function buildBlogPosting(input: BlogPostingInput): WithContext<BlogPosting> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    image: input.imageUrl.startsWith('http') ? input.imageUrl : absoluteUrl(input.imageUrl),
    url: input.pageUrl ?? absoluteUrl(`/blog/${input.slug}`),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { '@type': 'Person', name: input.authorName },
    publisher: {
      '@type': 'Organization',
      name: siteSeo.brand,
      url: siteSeo.siteUrl,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/favicon.svg') },
    },
    inLanguage: localeTag[input.locale ?? 'en'],
    ...(input.section ? { articleSection: input.section } : {}),
    ...(input.keywords ? { keywords: [...input.keywords].join(', ') } : {}),
  };
}
