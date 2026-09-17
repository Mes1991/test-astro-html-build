import type { FAQPage, Question, WithContext } from 'schema-dts';
import type { FaqEntry } from '../data/faq';

/**
 * Build a FAQPage schema from a list of Q&As. Returns null on empty input
 * — emitting an empty FAQPage flags an SEO error in Google's validator.
 */
export function buildFaqPage(entries: readonly FaqEntry[]): WithContext<FAQPage> | null {
  if (entries.length === 0) return null;
  const mainEntity: Question[] = entries.map((e) => ({
    '@type': 'Question',
    name: e.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: e.answer,
    },
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}
