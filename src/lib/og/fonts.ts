import { readFile } from 'node:fs/promises';
import path from 'node:path';

// At build time we're always running from the project root, so we resolve the
// TTFs against process.cwd(). This sidesteps the headache of `import.meta.url`
// pointing into `dist/.prerender/chunks/...` once the endpoint is bundled.
const FONT_DIR = path.join(process.cwd(), 'src', 'assets', 'fonts');

let cache: { regular: Buffer; bold: Buffer } | null = null;

export async function loadOgFonts() {
  if (cache) return cache;
  const [regular, bold] = await Promise.all([
    readFile(path.join(FONT_DIR, 'JetBrainsMono-Regular.ttf')),
    readFile(path.join(FONT_DIR, 'JetBrainsMono-Bold.ttf')),
  ]);
  cache = { regular, bold };
  return cache;
}

/** Satori font config for both weights. */
export async function ogFontConfig() {
  const { regular, bold } = await loadOgFonts();
  return [
    { name: 'JetBrains Mono', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'JetBrains Mono', data: bold, weight: 700 as const, style: 'normal' as const },
  ];
}
