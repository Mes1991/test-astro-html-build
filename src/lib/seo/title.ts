import { siteSeo } from './defaults';

const SUFFIX = ` — ${siteSeo.brand}`;

/** Resolve a page title to the final <title> string. Empty → default. */
export function resolveTitle(pageTitle: string): string {
  const trimmed = pageTitle.trim();
  if (!trimmed) return siteSeo.defaultTitle;
  if (trimmed.endsWith(SUFFIX)) return trimmed;
  return `${trimmed}${SUFFIX}`;
}
