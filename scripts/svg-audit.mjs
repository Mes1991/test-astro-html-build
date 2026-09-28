#!/usr/bin/env node
/**
 * Static safety/shape check for SVG files.
 *
 * This is a pre-publication check for untrusted/third-party SVG (icons,
 * illustrations, masks) before they land in `public/` or `src/`. It looks
 * for content that can execute code, leak data to a third party, or break
 * the accessible/static-rendering contract this template relies on. It does
 * NOT check licensing, color contrast, or accessible naming (`<title>`,
 * `aria-label`) — those depend on how the SVG is actually embedded in a page
 * and are review items in `skills/svg-assets`, not something a standalone
 * file can answer.
 *
 * Usage: node scripts/svg-audit.mjs [paths...]  (default: public src)
 * Directories are walked recursively for `*.svg`, skipping `node_modules`.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFragment } from 'parse5';

const EVENT_HANDLER_RE = /^on/i;
const JAVASCRIPT_URL_RE = /javascript:/i;
const RASTER_DATA_RE = /^data:image\/(?:png|jpeg|webp)/i;
const EXTERNAL_URL_RE = /url\(\s*['"]?(?:https?:)?\/\//i;
const ENTITY_OR_INTERNAL_SUBSET_RE = /<!entity\b|<!doctype\b[^>[]*\[/i;
const DOCTYPE_RE = /<!doctype\b/i;

function isElement(node) {
  return 'tagName' in node;
}

function elementsIn(root) {
  const out = [];
  const visit = (parent) => {
    for (const child of parent.childNodes ?? []) {
      if (!isElement(child)) continue;
      out.push(child);
      visit(child);
    }
  };
  visit(root);
  return out;
}

function textOf(element) {
  let text = '';
  for (const child of element.childNodes ?? []) {
    if (child.nodeName === '#text' && 'value' in child) text += child.value;
  }
  return text;
}

/**
 * Audit one SVG document's source text.
 * @param {string} text
 * @returns {Array<{severity: 'error'|'warn', code: string, message: string}>}
 */
export function auditSvg(text) {
  const findings = [];

  // Regex precheck ahead of parsing: an ENTITY declaration or a DOCTYPE
  // internal subset (`<!DOCTYPE svg [ ... ]>`) is an XXE / entity-expansion
  // ("billion laughs") vector regardless of where in the document it sits, so
  // this does not rely on the parsed tree at all. A plain public DOCTYPE (the
  // SVG 1.1 boilerplate many editors export) declares nothing and is only
  // flagged as removable noise.
  if (ENTITY_OR_INTERNAL_SUBSET_RE.test(text)) {
    findings.push({
      severity: 'error',
      code: 'SVG_DOCTYPE_ENTITY',
      message: 'File declares an ENTITY or a DOCTYPE internal subset, which can enable XXE or entity-expansion attacks.',
    });
  } else if (DOCTYPE_RE.test(text)) {
    findings.push({
      severity: 'warn',
      code: 'SVG_DOCTYPE',
      message: 'File carries a DOCTYPE declaration; it is unnecessary for SVG on the web and can be removed.',
    });
  }

  const fragment = parseFragment(text);
  const elements = elementsIn(fragment);
  const rootSvg = elements.find((el) => el.tagName === 'svg');

  if (rootSvg) {
    const hasViewBox = rootSvg.attrs.some((attr) => attr.name === 'viewBox');
    if (!hasViewBox) {
      findings.push({
        severity: 'error',
        code: 'SVG_NO_VIEWBOX',
        message: 'Root <svg> has no viewBox attribute.',
      });
    }
  }

  for (const element of elements) {
    const tagName = element.tagName;

    if (tagName === 'script') {
      findings.push({ severity: 'error', code: 'SVG_SCRIPT', message: '<script> element found in SVG.' });
    }
    if (tagName === 'foreignObject') {
      findings.push({
        severity: 'error',
        code: 'SVG_FOREIGN_OBJECT',
        message: '<foreignObject> element found in SVG.',
      });
    }

    for (const attr of element.attrs) {
      const name = attr.name;
      const value = attr.value ?? '';

      if (EVENT_HANDLER_RE.test(name)) {
        findings.push({
          severity: 'error',
          code: 'SVG_EVENT_HANDLER',
          message: `<${tagName}> has an event handler attribute "${name}".`,
        });
      }

      if (JAVASCRIPT_URL_RE.test(value)) {
        findings.push({
          severity: 'error',
          code: 'SVG_JAVASCRIPT_URL',
          message: `<${tagName}> attribute "${name}" contains a javascript: URL.`,
        });
      }

      // `xlink:href` is normalized to the plain attribute name `href` by
      // parse5's foreign-content adjustment, so checking `href` alone covers
      // both forms.
      if (name === 'href' || name === 'src') {
        if (!value.startsWith('#') && !/^data:image\//i.test(value)) {
          findings.push({
            severity: 'error',
            code: 'SVG_EXTERNAL_REF',
            message: `<${tagName}> attribute "${name}" references an external resource: ${value}`,
          });
        }
        if (tagName === 'image' && RASTER_DATA_RE.test(value)) {
          findings.push({
            severity: 'warn',
            code: 'SVG_EMBEDDED_RASTER',
            message: `<image> embeds a raster image inline (${value.slice(0, 40)}…).`,
          });
        }
      }

      if (EXTERNAL_URL_RE.test(value)) {
        findings.push({
          severity: 'error',
          code: 'SVG_EXTERNAL_REF',
          message: `<${tagName}> attribute "${name}" references an external URL via url(...): ${value}`,
        });
      }
    }

    if (tagName === 'style') {
      const css = textOf(element);
      if (/@import\b/i.test(css)) {
        findings.push({ severity: 'error', code: 'SVG_STYLE_IMPORT', message: '<style> declares @import.' });
      }
      if (EXTERNAL_URL_RE.test(css)) {
        findings.push({
          severity: 'error',
          code: 'SVG_EXTERNAL_REF',
          message: '<style> references an external URL via url(...).',
        });
      }
    }
  }

  return findings;
}

async function walkSvgFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkSvgFiles(full)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
      out.push(full);
    }
  }
  return out;
}

async function collectSvgFiles(inputPaths) {
  const files = [];
  for (const input of inputPaths) {
    const resolved = path.resolve(process.cwd(), input);
    let stats;
    try {
      stats = await stat(resolved);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      files.push(...(await walkSvgFiles(resolved)));
    } else if (stats.isFile() && resolved.toLowerCase().endsWith('.svg')) {
      files.push(resolved);
    }
  }
  return [...new Set(files)].sort();
}

async function main(argv) {
  const inputPaths = argv.slice(2);
  const targets = inputPaths.length > 0 ? inputPaths : ['public', 'src'];
  const files = await collectSvgFiles(targets);

  if (files.length === 0) {
    console.error(`svg-audit: no .svg files found under ${targets.join(', ')}`);
    return 2;
  }

  let errorCount = 0;
  let warnCount = 0;

  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const rel = path.relative(process.cwd(), file).split(path.sep).join('/');
    for (const finding of auditSvg(text)) {
      const tag = finding.severity === 'error' ? '✗' : '⚠';
      const line = `${rel}: ${tag} [${finding.code}] ${finding.message}`;
      if (finding.severity === 'error') {
        errorCount++;
        console.error(line);
      } else {
        warnCount++;
        console.warn(line);
      }
    }
  }

  const status = errorCount > 0 ? 'FAIL' : 'PASS';
  console.log(`svg-audit: ${files.length} files, ${errorCount} error(s), ${warnCount} warning(s) — ${status}`);

  return errorCount > 0 ? 1 : 0;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main(process.argv).then((code) => {
    process.exitCode = code;
  });
}
