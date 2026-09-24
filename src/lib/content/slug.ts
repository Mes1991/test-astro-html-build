import { z } from 'astro/zod';

export const ROUTER_SAFE_SLUG_RULE =
  'Router-safe slug rule: use a non-empty lowercase path segment with no whitespace, ASCII control characters, path separators ("/" or "\\"), URL delimiters ("?", "#", or "%"), or Windows-forbidden filename characters ("<", ">", ":", "\\\"", "|", or "*"); ".", "..", and leading/trailing "-" are not allowed. Dots and Unicode letters are allowed.';

/** A single URL path segment that the static blog routes can carry unchanged. */
export const routerSafeSlugSchema = z.string().superRefine((slug, context) => {
  const invalid =
    slug.length === 0 ||
    slug !== slug.toLowerCase() ||
    /[\u0000-\u001f\u007f\s\\/?#%<>:"|*]/u.test(slug) ||
    slug.startsWith('-') ||
    slug.endsWith('-') ||
    slug === '.' ||
    slug === '..';

  if (invalid) context.addIssue({ code: 'custom', message: ROUTER_SAFE_SLUG_RULE });
});
