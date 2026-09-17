# Current repository map — estado real (pre-migración)

Este documento describe el repositorio **tal como existe hoy**, no el producto
objetivo. Fue extraído del `AGENTS.md` anterior (commit `HEAD` de este archivo,
552 líneas, stack Bun/Astro 6/bilingüe obligatorio/GSAP+Lenis+React+Three
obligatorio) antes de que `AGENTS.md` se reemplazara por el nuevo contrato de
producto en `docs/product/template-contract.md`.

El propósito de este archivo es que ningún agente pierda la capacidad de
operar sobre el código real mientras las unidades de migración (Unidad 1 en
adelante) no se hayan ejecutado. Cuando una migración reemplace un hecho de
aquí (por ejemplo, Bun → pnpm), edita este archivo para reflejar el nuevo
estado — no lo borres de golpe; es el mapa vivo del repositorio actual.

---

## 1. Comandos reales actuales

Este proyecto usa **Bun** hoy (pendiente de migración a pnpm en la Unidad 1).

```bash
bun install          # instala dependencias
bun dev              # dev server en http://localhost:4321
bun run build        # build de producción a ./dist/ — corre seo-lint, puede FALLAR el build
bun run preview      # preview del build de producción
bun run test         # vitest run (tests unitarios)
bun run test:watch   # vitest watch mode
bun run audit        # build + Lighthouse CI (config desktop)
bun run audit:mobile # build + Lighthouse CI (config mobile)
bun astro check      # chequeo de tipos TypeScript/Astro
```

**Advertencia vigente:** usar `bun run test`, nunca `bun test` — este último
invoca el test runner nativo de Bun, no vitest, y falla o reporta mal.

**Definición de "hecho" (heredada, hoy):** `bun run build` (incluye seo-lint)
**y** `bun run test` en verde. Después de la Unidad 1 esto pasa a los scripts
`pnpm run *` listados en `AGENTS.md` → "Validación".

**Rutas que compilan hoy:** `/`, `/es/`, `/blog`, `/blog/example-post`,
`/es/blog`, `/es/blog/example-post`, `/404`, `/coming-soon`.

---

## 2. Estructura y archivos importantes

```
/
├── astro.config.mjs        site URL, config i18n, sitemap ROUTE_MAP + filter, integraciones
├── package.json            scripts (nota: test = vitest run)
├── lighthouserc.json       presupuestos Lighthouse CI (desktop)
├── lighthouserc.mobile.json    presupuestos Lighthouse CI (mobile)
├── .env.example            plantilla de variables de entorno
├── public/
│   ├── assets/
│   │   ├── logo-mark.svg    marca (reemplazable)
│   │   ├── pattern.svg      textura decorativa
│   │   └── avatar/{default,active,surprised}.svg   expresiones de AvatarCycler (coming-soon)
│   ├── favicon.svg          (reemplazable)
│   ├── fonts/jetbrains-mono/    webfonts mono autohospedadas (woff2)
│   ├── draco/               decoder Draco — retenido para permitir un GLB comprimido
│   ├── masks/{mask-square,mask-tall}.svg   máscaras SVG decorativas
│   └── _headers             cache headers (formato Netlify/Cloudflare)
└── src/
    ├── assets/
    │   ├── blog/example-post.png        imagen de blog optimizada en build (demo, deletable)
    │   └── fonts/JetBrainsMono-{Regular,Bold}.ttf   fuentes para render de OG
    ├── styles/global.css    tokens @theme de Tailwind + @font-face
    ├── layouts/BaseLayout.astro    <head>, SEO, init de Lenis+GSAP, overlay de intro
    ├── middleware.ts        gate de coming-soon (reescribe todas las rutas si está activo)
    ├── content.config.ts    schema de la colección `blog` (única colección)
    ├── content/
    │   └── blog/example-post.md            (demo, deletable)
    ├── i18n/
    │   ├── en.json / es.json    diccionarios de strings de UI (claves deben permanecer espejadas)
    │   ├── t.ts                 helper t() de ruta punteada
    │   └── t.test.ts
    ├── pages/
    │   ├── index.astro          home (SiteHeader → Hero → FAQ → BlogTeaser → Footer)
    │   ├── 404.astro            usa isla NotFoundBackground (GradFlow)
    │   ├── coming-soon.astro    página de espera (Hero3D + AvatarCycler)
    │   ├── blog/{index,[slug]}.astro
    │   ├── es/{index, blog/{index,[slug]}}.astro    espejos en español
    │   ├── og/[...slug].png.ts  endpoint de imagen OG
    │   └── robots.txt.ts        robots consciente del entorno
    ├── components/
    │   ├── home/    Hero, FAQ, BlogTeaser, Footer
    │   ├── shared/  SiteHeader, MobileMenu, LanguageSwitcher
    │   ├── seo/     SEO.astro, Schema.astro, BreadcrumbsJsonLd.astro, GoogleAnalytics.astro
    │   ├── blog/    BlogArchive, NextRead
    │   ├── coming-soon/ Hero3D (Icosaedro procedural), AvatarCycler
    │   └── react/   NotFoundBackground.tsx (fondo GradFlow de 404)
    ├── lib/
    │   ├── seo/     defaults.ts (siteSeo), types.ts, url.ts, title.ts, locale.ts,
    │   │            schemas/*, data/{faq,services}.ts
    │   ├── og/      render.ts, fonts.ts, manifest.ts, assets.ts, templates/{default,article,home}.tsx + types.ts
    │   └── blog/    reading-time.ts, next-read.ts (+ *.test.ts)
    └── integrations/seo-lint/   integración de lint en build (index.ts + lint.ts)
```

**Tech stack real hoy** (referencia rápida; el detalle vive en `package.json`):
Astro 6 (SSG), Bun (package manager + test runner driver, `bun.lock` committed —
migrar en Unidad 1), Tailwind v4, GSAP 3.x + ScrollTrigger, Lenis 1.x (smooth
scroll compartiendo el RAF loop de GSAP, expuesto en `window.__lenis`), React 19
vía `@astrojs/react` (solo isla 404), Three.js 0.18x (mesh procedural en
coming-soon), `gradflow` (gradiente WebGL animado del fondo 404), Satori +
Resvg (render de OG: JSX → SVG → PNG), `schema-dts` (builders JSON-LD tipados),
`@astrojs/sitemap`, `@astrojs/partytown` (offload de Google Analytics a un
worker), `vitest`, `@lhci/cli` (presupuestos Lighthouse CI).

---

## 3. Content Collections

Existe **una** colección, `blog`, definida en `src/content.config.ts` y cargada
vía el loader `glob` de Astro desde `src/content/blog/*.md`.

**`blog`** — campos requeridos: `title`, `slug`, `description`,
`datePublished` (ISO 8601), `image` (optimizada vía `image()`), `imageAlt`.
Opcionales: `dateModified`, `author` (default `"Example Site"`), `category`,
`keywords[]` (default `[]`), `draft` (default false),
`translations.es` (subconjunto: `title`, `description`, `category`, `imageAlt`,
`seo`), `seo.{title,description}`.

- **Agregar una entrada:** un `.md` nuevo en `src/content/blog/` con frontmatter
  válido; las páginas de blog y el manifest de OG lo incluyen automáticamente.
- **Patrón `translations.es`:** overrides por locale; las páginas `/es/`, el
  teaser y el manifest de OG leen `es?.field ?? entry.data.field`.
- **Drafts:** `draft: true` excluye el post de todos los listados
  (`getCollection('blog', e => !e.data.draft)`).
- `src/content/blog/example-post.md` y su imagen son **demo deletable**.

---

## 4. seo-lint

Vive en `src/integrations/seo-lint/lint.ts`, corre dentro de `bun run build`.

**FAIL (rompe el build):**
- `TITLE_MISSING` — sin `<title>` o vacío
- `DESC_MISSING` — sin `<meta name="description">` o vacío
- `CANONICAL_MISSING` — sin `<link rel="canonical">`
- `H1_MISSING` / `H1_MULTIPLE` — debe haber exactamente un `<h1>`
- `IMG_ALT_MISSING` — `<img>` sin `alt`
- `LD_PARSE_ERROR` — JSON inválido en un bloque JSON-LD

**WARN (se imprime, no rompe el build):**
- `TITLE_TOO_SHORT` (<30) / `TITLE_TOO_LONG` (>70)
- `DESC_TOO_SHORT` (<70) / `DESC_TOO_LONG` (>160)
- `OG_IMAGE_MISSING` — sin `og:image`
- `LD_NO_CONTEXT` — entrada JSON-LD sin `@context: "https://schema.org"`
- `LD_LANG_MISMATCH` — `inLanguage` del JSON-LD no coincide con `<html lang>`

> Gap conocido (ver `skills/registry.yaml` → `gaps.tools-seo-mjs`): la skill
> `static-site-seo` (§27-36) asume un `tools/seo.mjs` autónomo que no existe en
> este snapshot del repositorio.

Componentes SEO relacionados: `SEO.astro` (props, emite meta/canonical/hreflang/
OG+Twitter/JSON-LD vía `<Schema>`), builders en `src/lib/seo/schemas/`
(`buildOrganization`, `buildWebSite`, `buildBreadcrumbList`, `buildService`,
`buildFaqPage`, `buildAboutPage`/`buildContactPage`/`buildCollectionPage`,
`buildBlogPosting`), fuente de datos en `src/lib/seo/data/{services,faq}.ts`.

---

## 5. Generación OG

Pipeline en build-time: **manifest → template JSX → Satori (SVG) → Resvg (PNG)**.

- **Ruta:** `src/pages/og/[...slug].png.ts` — `getStaticPaths()` lee el
  manifest; `GET` elige template por `entry.data.template` y devuelve un PNG
  `1200×630` (cache headers inmutables).
- **Manifest** (`src/lib/og/manifest.ts`): entradas estáticas para `default`,
  `home` y `blog` (más sus espejos `es/*`) y **auto-deriva** una entrada
  `article` por cada post de blog no-draft (en + es).
- **Templates** (`src/lib/og/templates/`): `default.tsx`, `article.tsx` — JSX
  que consume `siteSeo` y `OG_PALETTE` (`types.ts`).
- **Render** (`render.ts`): `renderOg(node)` → `OG_WIDTH=1200`, `OG_HEIGHT=630`.
- **Fuentes** (`fonts.ts`): JetBrains Mono `.ttf` desde `src/assets/fonts/`.
- **Sync OG↔página:** `SEO.astro` pide `/og/<slug-de-la-página>.png` por
  defecto; una página nueva sin entrada de manifest ni `image` explícita
  produce warning de card faltante.

---

## 6. Variables de entorno

Definidas en `.env.example`, copiar a `.env`:

- `PUBLIC_COMING_SOON` — `"true"` sirve `/coming-soon` en toda ruta (vía `middleware.ts`).
- `PUBLIC_GA_MEASUREMENT_ID` — ID de GA4; GA solo emite en producción con esto seteado.
- `PUBLIC_GSC_VERIFICATION` / `PUBLIC_BING_VERIFICATION` — meta de verificación (solo prod).
- `SITE_ENV` — `production` emite el `robots.txt` completo; cualquier otro valor emite `Disallow: /`.

**Deploy:** salida estática pura → cualquier host estático (Netlify/Vercel/
Cloudflare Pages). `public/_headers` da cache headers en formato Netlify/Cloudflare.

---

## 7. Rutas / i18n todavía existentes

- **i18n nativo de Astro** (`astro.config.mjs`): `en` default (sin prefijo),
  `es` bajo `/es/`. `prefixDefaultLocale: false`, `fallbackType: 'rewrite'`,
  `fallback: { es: 'en' }`.
- **Helper `t()`** (`src/i18n/t.ts`): `t(key, locale = 'en', vars = {})`,
  búsqueda por ruta punteada, fallback a `en` y luego a la clave literal.
  Interpola vars `{name}`.
- **Diccionarios:** `src/i18n/en.json` / `es.json` — **las claves deben
  permanecer espejadas** entre ambos archivos; solo cambian los valores.
  Grupos hoy: `nav`, `languageSwitcher`, `common`, `pages`, `footer`, `header`,
  `home` (`home.{hero,faq,blog}`).
- **Mapa de slugs por ruta** (`src/lib/seo/locale.ts`): `ROUTE_KEYS =
  ['home','blog']` y `localizedSlugs`. Helpers: `pathFor()`, `alternateUrls()`,
  `oppositeLocale()`, `routeKeyFromPath()`.
- **hreflang:** `SEO.astro` deriva alternates de `routeKeyFromPath()`; el
  sitemap emite hreflang desde su propio `ROUTE_MAP` en `astro.config.mjs`.
- **Requisito de sincronía vigente:** `ROUTE_MAP` (`astro.config.mjs`) y
  `localizedSlugs` (`src/lib/seo/locale.ts`) describen las mismas rutas desde
  dos ángulos — deben mantenerse sincronizados.

> Bajo el nuevo contrato de producto (`docs/product/template-contract.md`),
> i18n pasa a ser una extensión opt-in real, no un requisito. Este bloque
> describe el estado actual bilingüe obligatorio, no el objetivo.

---

## 8. Accesibilidad, reduced motion y performance

- **Lighthouse CI:** `lighthouserc.json` (desktop) + `lighthouserc.mobile.json`,
  corridos vía `bun run audit` / `audit:mobile`. Objetivo ≥95.
- **Partytown:** Google Analytics corre en un worker (`@astrojs/partytown`).
- **Carga diferida:** Lenis/GSAP/intro cargan en idle
  (`requestIdleCallback`), nunca bloquean LCP; la isla de fondo 404 hidrata
  en idle.
- **Skip link:** `BaseLayout` renderiza un "Skip to content" hacia `#main`.
- **Imágenes:** imágenes de contenido usan `image()` + `<Image>` de Astro;
  todo `<img>` requiere `alt` (lo exige seo-lint).
- **Motion (GSAP + Lenis, `BaseLayout.astro`):** Lenis corre sobre
  `gsap.ticker` (un solo RAF compartido), expuesto como `window.__lenis`. El
  overlay de intro respeta `prefers-reduced-motion` (salta directo a
  `skipIntro()`) y tiene un failsafe de pestaña en background + timeout de 4s
  en `document.fonts.ready`.
- **React islands / WebGL:** `NotFoundBackground.tsx` (gradiente `gradflow`,
  `client:idle` en 404) y `coming-soon/Hero3D.astro` (Icosaedro procedural,
  sin GLB — `public/draco/` retenido para agregar uno). Heavy JS nunca
  bloquea LCP.

> Bajo el nuevo contrato de producto, GSAP/Lenis/React/Three.js pasan a ser
> parte del "stack visual" opt-in, no invariantes del núcleo. Este bloque
> describe el código real presente hoy, pendiente de extracción a extensión.

---

## Notas de migración

- Bun → pnpm es responsabilidad de la Unidad 1. Hasta que se ejecute, todos
  los comandos reales siguen siendo los de la sección 1 (`bun run *`), no los
  `pnpm run *` que ya aparecen en `AGENTS.md` como estado objetivo.
- El checklist de rebrand (siteSeo, wordmark de intro hardcodeado, CTA
  `mailto:` hardcodeado) descrito en el `AGENTS.md` anterior queda obsoleto
  como metodología — el nuevo contrato reemplaza esos puntos de edición
  dispersos por `src/site.config.ts` como única configuración pública. Los
  archivos concretos (`src/lib/seo/defaults.ts`, `BaseLayout.astro`) siguen
  existiendo hoy y están documentados en la sección 2 de este mapa.
