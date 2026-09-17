/**
 * Source of truth for FAQ Q&As. Used by the FAQPage JSON-LD schema and by
 * the FAQ.astro component (which renders directly from these entries).
 *
 * Plain text only — the JSON-LD doesn't render HTML, and the component
 * renders these as text nodes too.
 */
import type { LocaleCode } from '../types';

export interface FaqEntry {
  question: string;
  answer: string;
}

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    question: 'What is this template?',
    answer:
      'This is a production-ready Astro starter template for building fast, accessible, multilingual websites. It ships with a built-in design system, SEO tooling, and an i18n framework so you can focus on your content from day one.',
  },
  {
    question: 'How do I customize this template for my project?',
    answer:
      'Start by updating the brand values in src/lib/seo/defaults.ts, replacing the example content entries in src/content/, and swapping the color tokens in your Tailwind config. The CLAUDE.md at the project root walks through each step.',
  },
  {
    question: 'Which tech stack does this template use?',
    answer:
      'This template is built on Astro with React islands for interactive components, Tailwind CSS for styling, and Bun as the package manager and test runner. Content is managed through Astro Content Collections.',
  },
  {
    question: 'Is this template free to use?',
    answer:
      'Yes. This template is open source and free to use for personal and commercial projects. Check the LICENSE file at the root of the repository for the full terms.',
  },
] as const;

export const FAQ_ENTRIES_ES: readonly FaqEntry[] = [
  {
    question: '¿Qué es esta plantilla?',
    answer:
      'Esta es una plantilla de inicio Astro lista para producción, diseñada para construir sitios web rápidos, accesibles y multilingües. Incluye un sistema de diseño integrado, herramientas de SEO y un framework de i18n para que puedas enfocarte en tu contenido desde el primer día.',
  },
  {
    question: '¿Cómo personalizo esta plantilla para mi proyecto?',
    answer:
      'Comienza actualizando los valores de marca en src/lib/seo/defaults.ts, reemplazando las entradas de contenido de ejemplo en src/content/ y cambiando los tokens de color en tu configuración de Tailwind. El archivo CLAUDE.md en la raíz del proyecto describe cada paso.',
  },
  {
    question: '¿Qué stack tecnológico usa esta plantilla?',
    answer:
      'Esta plantilla está construida con Astro y React para componentes interactivos, Tailwind CSS para estilos y Bun como gestor de paquetes y ejecutor de pruebas. El contenido se gestiona mediante Astro Content Collections.',
  },
  {
    question: '¿Esta plantilla es gratuita?',
    answer:
      'Sí. Esta plantilla es de código abierto y gratuita para proyectos personales y comerciales. Consulta el archivo LICENSE en la raíz del repositorio para conocer los términos completos.',
  },
] as const;

/** Pick the right entries for a locale. Falls back to English. */
export function getFaqEntries(locale: LocaleCode): readonly FaqEntry[] {
  if (locale === 'es') return FAQ_ENTRIES_ES;
  return FAQ_ENTRIES;
}
