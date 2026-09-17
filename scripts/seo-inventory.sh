#!/usr/bin/env bash
# SEO inventory — quick post-build sanity check.
# Usage: bun run build && bash scripts/seo-inventory.sh

set -euo pipefail

DIST="${DIST:-dist}"

if [ ! -d "$DIST" ]; then
  echo "ERROR: $DIST not found. Run 'bun run build' first." >&2
  exit 1
fi

echo "=== SEO Inventory ==="
echo

PAGES=$(find "$DIST" -name "*.html" | wc -l | tr -d ' ')
EN_PAGES=$(find "$DIST" -name "*.html" -not -path "*/es/*" | wc -l | tr -d ' ')
ES_PAGES=$(find "$DIST/es" -name "*.html" 2>/dev/null | wc -l | tr -d ' ')
echo "HTML pages total: $PAGES (EN: $EN_PAGES, ES: $ES_PAGES)"

OG=$(find "$DIST/og" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
echo "OG images: $OG"

LD_BLOCKS=$(grep -rh "application/ld+json" "$DIST" --include="*.html" | wc -l | tr -d ' ')
echo "JSON-LD blocks (across all pages): $LD_BLOCKS"

HREFLANG=$(grep -rh '<link rel="alternate" hreflang=' "$DIST" --include="*.html" | wc -l | tr -d ' ')
echo "hreflang links (across all pages): $HREFLANG"

CANONICAL=$(grep -rh '<link rel="canonical"' "$DIST" --include="*.html" | wc -l | tr -d ' ')
echo "Canonical links: $CANONICAL"

OG_TAGS=$(grep -rh '<meta property="og:' "$DIST" --include="*.html" | wc -l | tr -d ' ')
echo "Open Graph meta tags: $OG_TAGS"

TWITTER=$(grep -rh '<meta name="twitter:' "$DIST" --include="*.html" | wc -l | tr -d ' ')
echo "Twitter Card meta tags: $TWITTER"

echo
echo "=== Sitemap & robots ==="
test -f "$DIST/sitemap-index.xml" && echo "sitemap-index.xml: OK" || echo "sitemap-index.xml: MISSING"
test -f "$DIST/robots.txt" && echo "robots.txt: OK" || echo "robots.txt: MISSING"
test -f "$DIST/_headers" && echo "_headers: OK" || echo "_headers: MISSING"

echo
echo "=== Done ==="
