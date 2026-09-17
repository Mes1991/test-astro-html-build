/**
 * Deterministic pickers for OG-card flavor (ported from an internal OG-card
 * factory, neutralized for the template). Everything here is pure and
 * hash-driven: the same slug always renders the same card across builds, so
 * OG images stay byte-stable in CI while different posts still get variety.
 */

/** Stable djb2 hash → unsigned 32-bit int. */
export function hashSlug(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h) ^ slug.charCodeAt(i);
  }
  return h >>> 0;
}

/**
 * Pool of general-purpose CTAs rotated across blog OG cards. Each one fits
 * any post and stays short enough to live in a pill button. Swap or extend
 * per brand voice when rebranding.
 */
const CTAS = [
  'Read more',
  'Read on',
  'Keep reading',
  'Read in full',
  'Read the post',
  'Take a look',
  'See more',
  'Check it out',
  'Find out more',
  'Get the full story',
  'Explore the post',
  'The whole story',
] as const;

/** Spanish CTAs for blog OG cards — mirrors the EN pool in spirit. */
const CTAS_ES = [
  'Leer más',
  'Sigue leyendo',
  'Lee el post',
  'Lee la nota',
  'Echa un vistazo',
  'Ver más',
  'Échale un ojo',
  'Descúbrelo',
  'La historia completa',
  'Explora la nota',
  'Lo que sigue',
  'A leer',
] as const;

/**
 * Deterministically pick a CTA for a given slug. Uses a rotated hash so the
 * pick is decorrelated from the raw hash (future pickers can XOR different
 * salts and stay independent). Locale switches between EN and ES pools.
 */
export function pickCtaForSlug(slug: string, locale: 'en' | 'es' = 'en'): string {
  const pool = locale === 'es' ? CTAS_ES : CTAS;
  const idx = ((hashSlug(slug) ^ 0xa5a5a5a5) >>> 0) % pool.length;
  return pool[idx];
}
