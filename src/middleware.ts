import { defineMiddleware } from "astro:middleware";

const COMING_SOON_PATH = "/coming-soon";

// Paths that must NOT be rewritten:
//   - the holding page itself (rewriting it would loop)
//   - static assets the holding page needs (GLB, fonts, draco decoder, favicon)
//   - generated artefacts that are harmless to leave as-is (sitemap, robots,
//     OG images, _astro chunks)
const PASSTHROUGH_PREFIXES = [
  "/assets/",
  "/fonts/",
  "/draco/",
  "/og/",
  "/_astro/",
];
const PASSTHROUGH_EXACT = new Set([
  "/favicon.svg",
  "/robots.txt",
]);

function isPassthrough(pathname: string): boolean {
  if (pathname === COMING_SOON_PATH) return true;
  if (PASSTHROUGH_EXACT.has(pathname)) return true;
  if (pathname.startsWith("/sitemap") && pathname.endsWith(".xml")) return true;
  for (const prefix of PASSTHROUGH_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

export const onRequest = defineMiddleware((context, next) => {
  const enabled = import.meta.env.PUBLIC_COMING_SOON === "true";
  if (!enabled) return next();

  if (isPassthrough(context.url.pathname)) return next();

  return context.rewrite(COMING_SOON_PATH);
});
