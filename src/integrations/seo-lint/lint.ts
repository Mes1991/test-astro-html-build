export type Severity = 'fail' | 'warn';

export interface Finding {
  code: string;
  severity: Severity;
  message: string;
}

const TITLE_MIN = 30;
const TITLE_MAX = 70;
const DESC_MIN = 70;
const DESC_MAX = 160;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Pure linter: takes an HTML string, returns findings. */
export function lintHtml(html: string): Finding[] {
  const findings: Finding[] = [];

  // Title
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (!titleMatch) {
    findings.push({ code: 'TITLE_MISSING', severity: 'fail', message: 'No <title> tag.' });
  } else {
    const title = decodeEntities(titleMatch[1]).trim();
    if (title.length === 0) {
      findings.push({ code: 'TITLE_MISSING', severity: 'fail', message: '<title> is empty.' });
    } else {
      if (title.length < TITLE_MIN) {
        findings.push({
          code: 'TITLE_TOO_SHORT',
          severity: 'warn',
          message: `Title is ${title.length} chars (min ${TITLE_MIN}).`,
        });
      }
      if (title.length > TITLE_MAX) {
        findings.push({
          code: 'TITLE_TOO_LONG',
          severity: 'warn',
          message: `Title is ${title.length} chars (max ${TITLE_MAX}).`,
        });
      }
    }
  }

  // Description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!descMatch) {
    findings.push({ code: 'DESC_MISSING', severity: 'fail', message: 'No <meta name="description">.' });
  } else {
    const desc = decodeEntities(descMatch[1]).trim();
    if (desc.length === 0) {
      findings.push({ code: 'DESC_MISSING', severity: 'fail', message: 'Description is empty.' });
    } else {
      if (desc.length < DESC_MIN) {
        findings.push({
          code: 'DESC_TOO_SHORT',
          severity: 'warn',
          message: `Description is ${desc.length} chars (min ${DESC_MIN}).`,
        });
      }
      if (desc.length > DESC_MAX) {
        findings.push({
          code: 'DESC_TOO_LONG',
          severity: 'warn',
          message: `Description is ${desc.length} chars (max ${DESC_MAX}).`,
        });
      }
    }
  }

  // Canonical
  if (!/<link\s+rel="canonical"\s+href="[^"]+"/i.test(html)) {
    findings.push({ code: 'CANONICAL_MISSING', severity: 'fail', message: 'No <link rel="canonical">.' });
  }

  // og:image
  if (!/<meta\s+property="og:image"\s+content="[^"]+"/i.test(html)) {
    findings.push({ code: 'OG_IMAGE_MISSING', severity: 'warn', message: 'No <meta property="og:image">.' });
  }

  // H1 count
  const h1Matches = html.match(/<h1[\s>][^]*?<\/h1>/gi) ?? [];
  if (h1Matches.length === 0) {
    findings.push({ code: 'H1_MISSING', severity: 'fail', message: 'No <h1> on page.' });
  } else if (h1Matches.length > 1) {
    findings.push({
      code: 'H1_MULTIPLE',
      severity: 'fail',
      message: `Found ${h1Matches.length} <h1> tags (expected 1).`,
    });
  }

  // <img> alt audit
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const img of imgTags) {
    const hasAlt = /\salt\s*=/.test(img);
    if (!hasAlt) {
      findings.push({
        code: 'IMG_ALT_MISSING',
        severity: 'fail',
        message: `<img> without alt attribute: ${img.slice(0, 80)}…`,
      });
    }
  }

  // <html lang> for the JSON-LD inLanguage cross-check below.
  const htmlLangMatch = html.match(/<html[^>]*\slang="([^"]+)"/i);
  const htmlLang = htmlLangMatch ? htmlLangMatch[1].trim() : null;

  // JSON-LD blocks: must parse, must have @context, inLanguage must match <html lang>.
  const ldRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = ldRegex.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      findings.push({
        code: 'LD_PARSE_ERROR',
        severity: 'fail',
        message: `Invalid JSON in <script type="application/ld+json">: ${(err as Error).message}`,
      });
      continue;
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      if (
        !item ||
        typeof item !== 'object' ||
        !('@context' in item) ||
        (item as { '@context': unknown })['@context'] !== 'https://schema.org'
      ) {
        findings.push({
          code: 'LD_NO_CONTEXT',
          severity: 'warn',
          message: 'JSON-LD entry missing @context "https://schema.org".',
        });
      }
      if (
        htmlLang &&
        item &&
        typeof item === 'object' &&
        'inLanguage' in item &&
        typeof (item as { inLanguage: unknown }).inLanguage === 'string'
      ) {
        const ldLang = (item as { inLanguage: string }).inLanguage;
        if (!langMatches(ldLang, htmlLang)) {
          const typeStr =
            '@type' in item && typeof (item as { '@type': unknown })['@type'] === 'string'
              ? (item as { '@type': string })['@type']
              : 'JSON-LD entry';
          findings.push({
            code: 'LD_LANG_MISMATCH',
            severity: 'warn',
            message: `${typeStr} inLanguage "${ldLang}" does not match <html lang="${htmlLang}">.`,
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Compare two BCP-47-ish language tags by their primary subtag (case-insensitive).
 * `'en'` matches `'en-US'`; `'es'` matches `'es-MX'`; `'en-US'` does not match
 * `'es-MX'`. Empty strings never match.
 */
function langMatches(a: string, b: string): boolean {
  const left = a.split('-')[0]?.toLowerCase() ?? '';
  const right = b.split('-')[0]?.toLowerCase() ?? '';
  if (!left || !right) return false;
  return left === right;
}
