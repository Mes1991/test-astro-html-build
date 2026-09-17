import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkOgImage404 } from './index';

async function fixtureDist(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'seo-lint-og-'));
  await mkdir(path.join(dir, 'og'), { recursive: true });
  await writeFile(path.join(dir, 'og', 'home.png'), 'png-bytes');
  return dir;
}

describe('checkOgImage404', () => {
  it('fails when og:image points at a missing file in dist/', async () => {
    const dist = await fixtureDist();
    const html =
      '<meta property="og:image" content="https://example.com/og/sobre-nosotros.png">';
    const findings = await checkOgImage404(html, dist);
    expect(findings.some((f) => f.code === 'OG_IMAGE_404' && f.severity === 'fail')).toBe(true);
  });

  it('passes when og:image points at an existing file in dist/', async () => {
    const dist = await fixtureDist();
    const html = '<meta property="og:image" content="https://example.com/og/home.png">';
    const findings = await checkOgImage404(html, dist);
    expect(findings.length).toBe(0);
  });
});
