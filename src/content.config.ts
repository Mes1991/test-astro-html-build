import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { routerSafeSlugSchema } from "./lib/content/slug";

/**
 * Blog entries. MD files with body content.
 * - frontmatter: structured metadata (title, slug, date, author, image, etc.)
 * - body: the post itself, rendered via entry.render() in [slug].astro
 *
 * The collection is named `blog` (matching the URL slug) to keep the data
 * layer language-neutral — the display labels live in i18n dictionaries.
 */
const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: routerSafeSlugSchema,
      description: z.string(),
      datePublished: z.string(), // ISO 8601
      dateModified: z.string().optional(),
      author: z.string().default("Example Site"),
      category: z.string().optional(),
      image: image(),
      imageAlt: z.string(),
      keywords: z.array(z.string()).default([]),
      draft: z.boolean().default(false),

      /** Optional per-locale overrides. */
      translations: z
        .object({
          es: z
            .object({
              title: z.string().optional(),
              description: z.string().optional(),
              category: z.string().optional(),
              imageAlt: z.string().optional(),
              seo: z
                .object({
                  title: z.string().optional(),
                  description: z.string().optional(),
                })
                .optional(),
            })
            .optional(),
        })
        .optional(),

      /** Optional per-page SEO override. */
      seo: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
        })
        .optional(),
    }),
});

export const collections = { blog };
