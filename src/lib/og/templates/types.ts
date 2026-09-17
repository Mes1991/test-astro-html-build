export type OgTemplateName = 'default' | 'article' | 'home';

/** Shared neutral palette for OG templates. Aligned with themeColor #1f2937. */
export const OG_PALETTE = {
  ink: '#1f2937',
  inkDeep: '#111827',
  inkMid: '#374151',
  accent: '#3b82f6',
  paper: '#f9fafb',
  paperWarm: '#f3f4f6',
} as const;

export interface DefaultTemplateData {
  template: 'default';
  title: string;
  kicker?: string; // small label above title
}

export interface ArticleTemplateData {
  template: 'article';
  title: string;
  category?: string;
  author?: string;
  readTime?: string;
  /** Rotating CTA text rendered as a pill under the title (see assets.ts). */
  cta?: string;
  /** Locale tag — reserved for locale-aware micro-copy. */
  locale?: 'en' | 'es';
}

export interface HomeTemplateData {
  template: 'home';
  /** Hero headline lines, e.g. ["Build something", "that lasts."]. Last line renders in the accent color. */
  lines: readonly string[];
  /** Small caps line above the headline — mirrors the hero eyebrow. */
  eyebrow?: string;
  /** CTA text rendered as an accent pill at the foot. */
  cta?: string;
  /** Locale tag — reserved for locale-aware micro-copy. */
  locale?: 'en' | 'es';
}

export type TemplateData =
  | DefaultTemplateData
  | ArticleTemplateData
  | HomeTemplateData;
