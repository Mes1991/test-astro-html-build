import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every directory that redistributes a font file must also carry that font's
 * license text (R-16). A `@font-face` pointing at a `.woff2`/`.ttf` file
 * redistributes bytes that are not this repository's own MIT code — OFL 1.1
 * requires its text to travel with them.
 */

const ROOT_DIR = join(__dirname, '..');
const FONT_EXTENSIONS = ['.woff2', '.woff', '.ttf', '.otf'];
const LICENSE_FILENAMES = ['OFL.txt', 'LICENSE', 'LICENSE.txt'];

const FONT_DIRECTORIES = [join(ROOT_DIR, 'public', 'fonts', 'jetbrains-mono'), join(ROOT_DIR, 'src', 'assets', 'fonts')];

describe('font directories ship their license text (R-16)', () => {
  it.each(FONT_DIRECTORIES)('%s contains at least one font file', (dir) => {
    const files = readdirSync(dir);
    const hasFont = files.some((f) => FONT_EXTENSIONS.some((ext) => f.endsWith(ext)));
    expect(hasFont).toBe(true);
  });

  it.each(FONT_DIRECTORIES)('%s carries a license file alongside its font(s)', (dir) => {
    const files = readdirSync(dir);
    const hasLicense = files.some((f) => LICENSE_FILENAMES.includes(f));
    expect(hasLicense).toBe(true);
  });
});
