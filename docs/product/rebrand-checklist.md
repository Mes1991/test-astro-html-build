# Rebrand Checklist — test-astro-html-build

Checklist canónico y único para personalizar este template. Sustituye al
checklist descrito en una versión anterior de `AGENTS.md` (obsoleta, ver
`docs/product/current-repository-map.md` → "Notas de migración"). Cada punto
fue verificado contra el archivo real citado — si el código cambia, actualiza
este documento en el mismo diff.

No dupliques este contenido en `README.md`, `AGENTS.md` ni `CLAUDE.md`:
esos archivos deben enlazar aquí, no repetir la lista.

> Nota de estado: hoy la configuración pública está dispersa entre los
> archivos listados abajo. `src/site.config.ts` como fuente única es
> **producto objetivo**, todavía no existe (ver `AGENTS.md` → "Estado
> transitorio"). Cuando exista, este checklist debe reescribirse para apuntar
> ahí en vez de a los archivos dispersos actuales.

## 1. Identidad (marca / wordmark)

- `src/lib/seo/defaults.ts` → objeto `siteSeo`: `brand`, `titleTemplate()`,
  `defaultTitle`, `defaultDescription`, `tagline` / `taglineEs`,
  `organization.{name, legalName, email, foundingDate, sameAs, knowsAbout}`.
  El propio archivo marca varios campos como `TBD` a propósito (comentario en
  cabecera) — resuélvelos antes de lanzar a producción.
- **Wordmark hardcodeado** (no lee de `siteSeo`, hay que editarlo a mano en
  dos sitios distintos):
  - `src/components/shared/SiteHeader.astro:42` — `<span>Example Site</span>`
    junto al logo en el header.
  - `src/layouts/BaseLayout.astro:76-78` (`#introWord`, dentro de
    `#introOverlay`) — overlay de intro con el texto "Example Site"; el
    propio archivo lo documenta como intencional: *"Intro wordmark —
    HARDCODED placeholder... To rebrand: change the word below, or replace this
    whole #introOverlay block with your own intro. See
    docs/product/rebrand-checklist.md"* — el comentario apunta a este documento.
- **CTA `mailto:` hardcodeado**, repetido en cuatro archivos (no es
  configuración, es texto literal):
  - `src/components/shared/SiteHeader.astro:28` — `const ctaHref =
    "mailto:hello@example.com"`.
  - `src/components/home/Hero.astro:30`.
  - `src/components/home/FAQ.astro:28`, más el propio email visible en
    `src/i18n/en.json` y `src/i18n/es.json` → `home.faq.cardEmail`
    (`"hello@example.com →"`).
  - `src/pages/coming-soon.astro:45`.
- `src/i18n/en.json` / `src/i18n/es.json` → `footer.copyright` = `"© {year}
  Example Site"` — la marca está escrita dentro del string de i18n, no viene
  de `siteSeo.brand`.
- `header.logoTaglineSmall` (`"DIGITAL STUDIO"` / `"ESTUDIO DIGITAL"`) en
  ambos diccionarios — copy de marca, edítalo junto con lo anterior.

## 2. URL del sitio

- `astro.config.mjs` → `site: 'https://example.com'` (propiedad top-level de
  `defineConfig`).
- `src/lib/seo/defaults.ts` → `siteSeo.siteUrl` — **debe coincidir
  exactamente** con `site` de `astro.config.mjs` (regla ya exigida en
  `CLAUDE.md` #2).
- `astro.config.mjs` → dentro de la integración `sitemap({ serialize(item)
  {...} })`, la constante local `SITE = 'https://example.com'` se usa para
  construir las URLs de `hreflang` del `ROUTE_MAP` — es una tercera
  ocurrencia de la misma URL, sepárala manualmente si cambias las dos
  anteriores.

## 3. Valores por defecto de SEO

- `src/lib/seo/defaults.ts` → `siteSeo`: `defaultOgImage`,
  `defaultOgImageAlt`, `twitterHandle`, `themeColor`.
- TBD explícitos que el propio archivo marca para resolver antes de
  producción: `organization.legalName`, `organization.email`,
  `organization.foundingDate`, `organization.sameAs`, `twitterHandle`.
- `src/lib/seo/locale.ts` → `ROUTE_KEYS` y `localizedSlugs` si añades,
  renombras o quitas rutas de nivel superior (hoy solo `home` y `blog`).

## 4. Colores y tipografía

- `src/styles/global.css` → bloque `@theme`: variables `--color-brand-*`
  (paleta completa), `--color-ui-*` (grises namespaced), `--font-sans` /
  `--font-display` / `--font-mono`, escalas `--text-display-*` y
  `--tracking-*`.
- JetBrains Mono está autohospedada vía `@font-face` en el mismo archivo
  (líneas 3-25); si cambias la fuente mono, reemplaza también los `.woff2`
  en `public/fonts/jetbrains-mono/`.

## 5. Logo y favicon

- `public/assets/logo-mark.svg` — logo usado en
  `src/components/shared/SiteHeader.astro:41`
  (`<img src="/assets/logo-mark.svg" alt="" aria-hidden="true">`).
- `public/favicon.svg` — hoy es un placeholder literal: un rectángulo
  `fill="#1e293b"` con la letra **"S"** en `fill="#3b82f6"` (inicial de
  "Site"/"Example Site"), referenciado desde
  `src/layouts/BaseLayout.astro:21`.
- `public/assets/pattern.svg` y `public/assets/avatar/{default,active,surprised}.svg`
  — assets decorativos usados solo en `coming-soon`; opcionales de
  rebrandear.

## 6. Idiomas

- `src/i18n/en.json` y `src/i18n/es.json` deben mantener **exactamente las
  mismas claves** (`CLAUDE.md` regla 4) — solo cambian los valores. Grupos
  reales hoy: `nav`, `languageSwitcher`, `common`, `pages`, `footer`,
  `header`, `home.{hero,faq,blog}`.
- `src/lib/seo/locale.ts` (`ROUTE_KEYS` / `localizedSlugs`) y el `ROUTE_MAP`
  de `astro.config.mjs` describen las mismas rutas desde dos ángulos y deben
  mantenerse sincronizados (`CLAUDE.md` regla 3).
- El bilingüe en/es es hoy **obligatorio en el núcleo**, no una extensión
  opt-in (ver `docs/product/current-repository-map.md` §7 y `AGENTS.md` →
  "Estado transitorio"). No quites un locale sin actualizar
  `astro.config.mjs`, `locale.ts` y ambos diccionarios a la vez.

## 7. Contenido de ejemplo

- `src/content/blog/example-post.md` y su imagen
  `src/assets/blog/example-post.png` son demos deletable (`CLAUDE.md` regla
  5) — reemplázalos o bórralos para un sitio real.
- Cualquier entrada nueva debe cumplir el schema de `src/content.config.ts`:
  requeridos `title`, `slug`, `description`, `datePublished` (ISO 8601),
  `image`, `imageAlt`; opcionales documentados en
  `docs/product/current-repository-map.md` §3.

## 8. Analytics opcional

- `src/components/seo/GoogleAnalytics.astro` solo emite en producción y solo
  si `PUBLIC_GA_MEASUREMENT_ID` está definido
  (`isProd && Boolean(measurementId)`) — deny-by-default.
- No existe `.env.example` en este repositorio hoy — verifica antes de
  asumirlo; define `PUBLIC_GA_MEASUREMENT_ID` directamente en el entorno de
  build/deploy si activas GA.
- El script corre a través de Partytown (`@astrojs/partytown`, configurado en
  `astro.config.mjs`) en un web worker, no en el hilo principal.

## 9. Validaciones finales

Comandos reales de `package.json` — no existen `seo:check`, `lint`,
`agent:setup` ni `agent:check`, no los invoques:

```bash
bun install --frozen-lockfile
bun run dev
bun run test
bun run check
bun run build
```

`bun run build` ejecuta el linter SEO de build-time
(`src/integrations/seo-lint/lint.ts`), que distingue dos severidades:

- **FAIL (rompe el build):** `TITLE_MISSING`, `DESC_MISSING`,
  `CANONICAL_MISSING`, `H1_MISSING`, `H1_MULTIPLE`, `IMG_ALT_MISSING`,
  `LD_PARSE_ERROR`, `OG_IMAGE_404`.
- **WARN (se imprime, no rompe el build):** `TITLE_TOO_SHORT` (<30),
  `TITLE_TOO_LONG` (>70), `DESC_TOO_SHORT` (<70), `DESC_TOO_LONG` (>160),
  `OG_IMAGE_MISSING`, `LD_NO_CONTEXT`, `LD_LANG_MISMATCH`.

Un rebrand solo cuenta como terminado cuando ambos comandos (`bun run build`
y `bun run test`) terminan en verde desde un checkout limpio.

---

**Nota sobre `BaseLayout.astro:74`:** ese comentario en código apuntaba a una
sección inexistente (`AGENTS.md §12`). Ya fue corregido y ahora apunta a este
documento. Si vuelves a moverlo, actualiza también esta nota.
