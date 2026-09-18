import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveDistPath, walkHtml } from './index';

/**
 * Regression coverage for the `astro:build:done` hook resolving its `dir` URL
 * into a filesystem path.
 *
 * The previous implementation used `dir.pathname` directly. That fails in two
 * independent ways:
 *   - `pathname` stays percent-encoded, so any checkout path containing a space
 *     resolves to a non-existent `%20` directory (all platforms);
 *   - on Windows `pathname` keeps a leading slash before the drive letter,
 *     producing `/C:/...` which `readdir` reads as `C:\C:\...`.
 *
 * Every assertion below fails against `dir.pathname` and passes against
 * `fileURLToPath(dir)`.
 */

/** A dist-like fixture whose path contains spaces, mirroring a real checkout. */
async function fixtureDistWithSpaces(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'seo lint dist '));
  await mkdir(path.join(dir, 'blog', 'nested post'), { recursive: true });
  await writeFile(path.join(dir, 'index.html'), '<html><h1>home</h1></html>');
  await writeFile(
    path.join(dir, 'blog', 'nested post', 'index.html'),
    '<html><h1>post</h1></html>',
  );
  await writeFile(path.join(dir, 'not-html.txt'), 'ignored');
  return dir;
}

/** Build the directory URL exactly as Astro hands it to the hook: with a trailing separator. */
function buildDirUrl(dir: string): URL {
  return pathToFileURL(dir + path.sep);
}

describe('resolveDistPath', () => {
  it('resolves a directory URL whose path contains spaces to a usable filesystem path', async () => {
    const dir = await fixtureDistWithSpaces();
    const url = buildDirUrl(dir);

    expect(path.resolve(resolveDistPath(url))).toBe(path.resolve(dir));
  });

  it('never leaks percent-encoding into the resolved path', async () => {
    const dir = await fixtureDistWithSpaces();
    const url = buildDirUrl(dir);

    // Guard: the fixture must actually exercise encoding, otherwise this test
    // would pass against the broken implementation too.
    expect(url.pathname).toContain('%20');

    expect(resolveDistPath(url)).not.toContain('%20');
    expect(resolveDistPath(url)).toContain(' ');
  });

  it('produces a path that readdir can actually walk', async () => {
    const dir = await fixtureDistWithSpaces();
    const url = buildDirUrl(dir);

    const files = await walkHtml(resolveDistPath(url));

    expect(files).toHaveLength(2);
    expect(files.every((f) => f.endsWith('.html'))).toBe(true);
  });

  it('does not resolve to the raw pathname, which is unusable as a path', async () => {
    const dir = await fixtureDistWithSpaces();
    const url = buildDirUrl(dir);

    // Guard: `url.pathname` is the value the previous implementation returned,
    // and readdir cannot use it. If this ever stops throwing, the assertion
    // below stops being meaningful.
    await expect(walkHtml(url.pathname)).rejects.toThrow();

    // The regression: `resolveDistPath` must not hand back that value, and what
    // it does hand back must be walkable.
    expect(resolveDistPath(url)).not.toBe(url.pathname);
    await expect(walkHtml(resolveDistPath(url))).resolves.toHaveLength(2);
  });
});
