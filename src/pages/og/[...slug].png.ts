import type { APIRoute, GetStaticPaths } from 'astro';
import { getOgManifest, type OgManifestEntry } from '../../lib/og/manifest';
import { renderOg } from '../../lib/og/render';
import { DefaultOgCard } from '../../lib/og/templates/default';
import { ArticleOgCard } from '../../lib/og/templates/article';
import { HomeOgCard } from '../../lib/og/templates/home';

export const getStaticPaths: GetStaticPaths = async () => {
  const manifest = await getOgManifest();
  return manifest.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: OgManifestEntry };
  let node;
  switch (entry.data.template) {
    case 'default': {
      const { title, kicker } = entry.data;
      const locale = entry.slug.startsWith('es/') ? 'es' : 'en';
      node = DefaultOgCard({ title, kicker, locale });
      break;
    }
    case 'article': {
      const { title, category, author, readTime, cta, locale } = entry.data;
      node = ArticleOgCard({ title, category, author, readTime, cta, locale });
      break;
    }
    case 'home': {
      const { lines, eyebrow, cta, locale } = entry.data;
      node = HomeOgCard({ lines, eyebrow, cta, locale });
      break;
    }
  }
  const png = await renderOg(node);
  return new Response(png as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
