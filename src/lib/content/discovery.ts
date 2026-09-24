import { z } from 'astro/zod';

export const SITEMAP_INDEXABILITY_RULE =
  'noindex: true requires sitemap: false; noindex and sitemap are independent controls.';

export const blogDiscoverySchema = z
  .object({
    noindex: z.boolean().default(false),
    sitemap: z.boolean().default(true),
  })
  .superRefine(({ noindex, sitemap }, context) => {
    if (noindex && sitemap) {
      context.addIssue({
        code: 'custom',
        path: ['sitemap'],
        message: SITEMAP_INDEXABILITY_RULE,
      });
    }
  });
