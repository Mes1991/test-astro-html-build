#!/usr/bin/env node
/**
 * FAQPage JSON-LD vs. visible-content editorial audit.
 *
 * This is NOT a schema validator. It does not check JSON-LD vocabulary
 * correctness, structured-data eligibility, or JSON syntax — the build's
 * seo-lint integration (src/integrations/seo-lint/lint.ts) already fails the
 * build on invalid JSON-LD (LD_PARSE_ERROR), missing `@context`, and
 * `inLanguage` mismatches. This script only checks whether an emitted
 * FAQPage's shape is sound and whether its questions/answers editorially
 * agree with the page's own visible body text (catching a stale, swapped, or
 * silently-hidden FAQ entry that would otherwise ship unnoticed).
 *
 * Usage: node scripts/seo-faq-audit.mjs [distDir=dist]
 *
 * Known limitations:
 *  - CSS-class-based hiding (e.g. a `max-height:0` collapse driven by an
 *    external stylesheet, or a `.sr-only` utility class) is invisible to a
 *    static HTML parser — this can produce false negatives (an answer judged
 *    "visible" that a browser actually hides).
 *  - JSON-LD injected client-side by JavaScript, and therefore absent from
 *    the static HTML this script reads, is not seen at all.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, parseFragment } from 'parse5';

const INLINE_ELEMENTS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'em', 'i',
  'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup',
  'time', 'u', 'var', 'wbr',
]);

/** Subtrees whose text never counts as visible content, regardless of `hidden`. */
const SKIPPED_SUBTREE_TAGS = new Set(['script', 'style', 'template', 'noscript']);

const FAQ_TYPE_VALUES = new Set(['faqpage', 'schema:faqpage', 'https://schema.org/faqpage']);

const LAYER_LEGEND =
  'syntax: owned by seo-lint (build) | shape+content: checked here | ' +
  'vocabulary: not validated | Google eligibility: not evaluated';
const VOCABULARY_NOTE = 'vocabulary: not validated (use validator.schema.org)';
const ELIGIBILITY_NOTE =
  'eligibility: Google FAQ rich result retired 2026-05-07 — not evaluated ' +
  '(https://developers.google.com/search/updates)';

function isElement(node) {
  return 'tagName' in node;
}

/** Every element in `root`'s subtree, in document order. */
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

function attributesOf(element) {
  return new Map(element.attrs.map(({ name, value }) => [name, value]));
}

/** The literal text content of a `<script>` element (its raw, unescaped body). */
function rawTextOf(element) {
  let text = '';
  for (const child of element.childNodes ?? []) {
    if (child.nodeName === '#text' && 'value' in child) text += child.value;
  }
  return text;
}

function hasHiddenStyle(styleValue) {
  if (!styleValue) return false;
  const normalized = styleValue.replace(/\s+/g, '').toLowerCase();
  return /display:none\b/.test(normalized) || /visibility:hidden\b/.test(normalized);
}

function isHiddenElement(attributes) {
  if (attributes.has('hidden')) return true;
  if ((attributes.get('aria-hidden') ?? '').trim().toLowerCase() === 'true') return true;
  if (attributes.has('inert')) return true;
  if (hasHiddenStyle(attributes.get('style'))) return true;
  return false;
}

/**
 * Concatenate text nodes under `root`, inserting a boundary space around
 * every non-inline element (so `<h2>A</h2><p>B</p>` doesn't glue into "AB")
 * while leaving inline markup (`<strong>`, `<b>`, …) glued to its neighbours.
 * When `skipHidden` is set, subtrees hidden via `hidden`/`aria-hidden="true"`/
 * `inert`/inline `display:none`/`visibility:hidden` are excluded entirely.
 */
function extractText(root, { skipHidden }) {
  const parts = [];
  const visit = (node) => {
    if (node.nodeName === '#text' && 'value' in node) {
      parts.push(node.value);
      return;
    }
    if (!isElement(node)) return;
    const tagName = node.tagName;
    if (SKIPPED_SUBTREE_TAGS.has(tagName)) return;
    if (skipHidden && isHiddenElement(attributesOf(node))) return;
    const isBoundary = !INLINE_ELEMENTS.has(tagName);
    if (isBoundary) parts.push(' ');
    for (const child of node.childNodes ?? []) visit(child);
    if (isBoundary) parts.push(' ');
  };
  for (const child of root.childNodes ?? []) visit(child);
  return parts.join('');
}

/** Collapse whitespace, trim, casefold, and NFC-normalize for stable comparison. */
function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim().normalize('NFC').toLocaleLowerCase('und');
}

function plainTextFromHtmlFragment(html) {
  return extractText(parseFragment(html), { skipHidden: false });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Every word-bounded occurrence of `needle` in `haystack`, as ascending start indices. */
function findAllPositions(needle, haystack) {
  if (!needle) return [];
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(needle)}(?![\\p{L}\\p{N}])`, 'gu');
  const positions = [];
  let match;
  while ((match = pattern.exec(haystack)) !== null) {
    positions.push(match.index);
    if (pattern.lastIndex === match.index) pattern.lastIndex += 1; // guard against a zero-length needle
  }
  return positions;
}

function faqTypeMatches(type) {
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => typeof t === 'string' && FAQ_TYPE_VALUES.has(t.trim().toLowerCase()));
}

/** Recursively find every FAQPage node anywhere in a parsed JSON-LD value. */
function findFaqPageNodes(value, results = []) {
  if (Array.isArray(value)) {
    for (const item of value) findFaqPageNodes(item, results);
  } else if (value && typeof value === 'object') {
    if ('@type' in value && faqTypeMatches(value['@type'])) results.push(value);
    for (const key of Object.keys(value)) findFaqPageNodes(value[key], results);
  }
  return results;
}

/** Shape- and content-check one FAQPage node, pushing findings as it goes. */
function auditFaqPage(faq, visibleText, findings) {
  const rawEntity = faq.mainEntity;
  const entries = rawEntity == null ? [] : Array.isArray(rawEntity) ? rawEntity : [rawEntity];
  if (entries.length === 0) {
    findings.push({
      layer: 'shape',
      code: 'SHAPE_NO_QUESTIONS',
      message: 'FAQPage has no mainEntity questions.',
    });
    return;
  }

  const seenQuestions = new Set();
  const resolved = [];

  entries.forEach((entry, index) => {
    const label = `#${index + 1}`;
    const name = entry && typeof entry === 'object' ? entry.name : undefined;
    if (typeof name !== 'string' || name.trim() === '') {
      findings.push({
        layer: 'shape',
        code: 'SHAPE_QUESTION_NAME',
        message: `Question ${label} is missing a string "name".`,
      });
      resolved.push(null);
      return;
    }

    const acceptedAnswer = entry.acceptedAnswer;
    const answerTextRaw =
      acceptedAnswer && typeof acceptedAnswer === 'object' ? acceptedAnswer.text : undefined;
    if (typeof answerTextRaw !== 'string' || answerTextRaw.trim() === '') {
      findings.push({
        layer: 'shape',
        code: 'SHAPE_ANSWER_TEXT',
        message: `Question ${label} ("${name}") is missing "acceptedAnswer.text".`,
      });
      resolved.push(null);
      return;
    }

    const questionNorm = normalizeText(name);
    const answerNorm = normalizeText(plainTextFromHtmlFragment(answerTextRaw));
    resolved.push({ label, name, questionNorm, answerNorm });

    if (seenQuestions.has(questionNorm)) {
      findings.push({
        layer: 'content',
        code: 'CONTENT_DUPLICATE_QUESTION',
        message: `Question ${label} ("${name}") duplicates an earlier question in this FAQPage.`,
      });
    }
    seenQuestions.add(questionNorm);
  });

  // Sequential question positions: when the same question text repeats (see
  // CONTENT_DUPLICATE_QUESTION), each entry must resolve to its own successive
  // occurrence in the body rather than every entry collapsing onto the first
  // match — otherwise a legitimately repeated FAQ pair reads as out of order.
  let cursor = 0;
  const qPositions = resolved.map((entry) => {
    if (!entry) return -1;
    const positions = findAllPositions(entry.questionNorm, visibleText);
    if (positions.length === 0) return -1;
    const fromCursor = positions.find((p) => p >= cursor);
    const pos = fromCursor !== undefined ? fromCursor : positions[positions.length - 1];
    cursor = pos + entry.questionNorm.length;
    return pos;
  });

  for (let i = 0; i < resolved.length; i++) {
    const current = resolved[i];
    if (!current) continue;

    const qPos = qPositions[i];
    if (qPos === -1) {
      findings.push({
        layer: 'content',
        code: 'CONTENT_QUESTION_NOT_VISIBLE',
        message: `Question ${current.label} ("${current.name}") text was not found in the page's visible body.`,
      });
    }

    const answerPositions = findAllPositions(current.answerNorm, visibleText);
    if (answerPositions.length === 0) {
      findings.push({
        layer: 'content',
        code: 'CONTENT_ANSWER_NOT_VISIBLE',
        message: `Answer to question ${current.label} ("${current.name}") was not found in the page's visible body.`,
      });
    }

    if (qPos !== -1 && answerPositions.length > 0) {
      // The occurrence expected to pair with this question: the first one at
      // or after it, or — when the text is only visible earlier (a swapped
      // answer) — the closest one before it, so a visible-but-misplaced
      // answer is judged on position rather than misreported as invisible.
      const atOrAfter = answerPositions.find((p) => p >= qPos);
      const aPos = atOrAfter !== undefined ? atOrAfter : answerPositions[answerPositions.length - 1];

      let nextBound = Infinity;
      for (let j = i + 1; j < resolved.length; j++) {
        if (!resolved[j]) continue;
        if (qPositions[j] !== -1) nextBound = qPositions[j];
        break;
      }

      if (!(aPos > qPos && aPos < nextBound)) {
        findings.push({
          layer: 'content',
          code: 'CONTENT_PAIR_MISMATCH',
          message:
            `Answer to question ${current.label} ("${current.name}") does not appear positioned ` +
            'after its own question and before the next one in the visible body — it may be ' +
            'swapped with another answer.',
        });
      }
    }
  }
}

/**
 * Audit one HTML document's FAQPage JSON-LD against its own visible body text.
 * @param {string} html
 * @returns {{ faqBlocks: number, findings: Array<{layer: string, code: string, message: string}>, skipped: Array<{code: string, message: string}> }}
 */
export function auditHtml(html) {
  const document = parse(html);
  const allElements = elementsIn(document);
  const ldScripts = allElements.filter((el) => {
    if (el.tagName !== 'script') return false;
    const type = (attributesOf(el).get('type') ?? '').trim().toLowerCase();
    return type === 'application/ld+json';
  });

  const findings = [];
  const skipped = [];
  const faqPages = [];

  for (const script of ldScripts) {
    const raw = rawTextOf(script).trim();
    if (!raw) continue;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      skipped.push({
        code: 'SYNTAX_SKIPPED',
        message:
          `Invalid JSON in <script type="application/ld+json">: ${err.message} ` +
          '(syntax is owned by seo-lint\'s LD_PARSE_ERROR at build time, not by this audit).',
      });
      continue;
    }
    faqPages.push(...findFaqPageNodes(parsed));
  }

  const bodyElement = allElements.find((el) => el.tagName === 'body');
  const visibleText = bodyElement ? normalizeText(extractText(bodyElement, { skipHidden: true })) : '';

  for (const faq of faqPages) {
    auditFaqPage(faq, visibleText, findings);
  }

  return { faqBlocks: faqPages.length, findings, skipped };
}

async function walkHtmlFiles(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkHtmlFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Audit every `.html` file under `dir`.
 * @param {string} dir
 * @returns {Promise<Array<{ file: string, faqBlocks: number, findings: Array<{layer: string, code: string, message: string}>, skipped: Array<{code: string, message: string}> }>>}
 */
export async function auditDist(dir) {
  const files = await walkHtmlFiles(dir);
  const results = [];
  for (const file of files.sort()) {
    const html = await readFile(file, 'utf8');
    const rel = path.relative(dir, file).split(path.sep).join('/');
    results.push({ file: rel, ...auditHtml(html) });
  }
  return results;
}

async function directoryHtmlFiles(distDir) {
  const resolved = path.resolve(process.cwd(), distDir);
  let stats;
  try {
    stats = await stat(resolved);
  } catch {
    return { resolved, files: null };
  }
  if (!stats.isDirectory()) return { resolved, files: null };
  return { resolved, files: await walkHtmlFiles(resolved) };
}

async function main(argv) {
  const distDir = argv[2] ?? 'dist';
  const { resolved, files } = await directoryHtmlFiles(distDir);

  if (files === null) {
    console.error(`seo-faq-audit: not a directory: ${distDir}`);
    return 2;
  }
  if (files.length === 0) {
    console.error(`seo-faq-audit: no .html files found under ${distDir}`);
    return 2;
  }

  let totalFindings = 0;
  let totalSkipped = 0;
  let totalBlocks = 0;

  for (const file of files.sort()) {
    const html = await readFile(file, 'utf8');
    const rel = path.relative(resolved, file).split(path.sep).join('/');
    const { faqBlocks, findings, skipped } = auditHtml(html);
    totalBlocks += faqBlocks;

    for (const s of skipped) {
      totalSkipped++;
      console.warn(`${rel}: [skipped] ${s.code} ${s.message}`);
    }
    for (const f of findings) {
      totalFindings++;
      console.log(`${rel}: [${f.layer}] ${f.code} ${f.message}`);
    }
  }

  if (totalBlocks === 0) {
    console.log('seo-faq-audit: no FAQPage found across the audited pages.');
  }

  const status = totalFindings > 0 ? 'FAIL' : 'PASS';
  console.log(
    `seo-faq-audit: ${files.length} pages, ${totalBlocks} FAQPage blocks, ${totalFindings} findings, ${totalSkipped} skipped — ${status}`,
  );
  console.log(VOCABULARY_NOTE);
  console.log(ELIGIBILITY_NOTE);
  console.log(LAYER_LEGEND);

  return totalFindings > 0 ? 1 : 0;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main(process.argv).then((code) => {
    process.exitCode = code;
  });
}
