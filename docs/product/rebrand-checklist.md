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
- **Email público**: vive solo en `src/lib/seo/defaults.ts` →
  `siteSeo.organization.email`. Los CTA de `SiteHeader.astro`, `Hero.astro`,
  `FAQ.astro` y `src/pages/coming-soon.astro:60` derivan de ese valor; el texto
  visible de FAQ usa la interpolación `{email}` de `home.faq.cardEmail` en
  ambos diccionarios. No dupliques una dirección literal en componentes ni
  en i18n.
- `src/i18n/en.json` / `src/i18n/es.json` → `footer.copyright` = `"© {year}
  Example Site"` — la marca está escrita dentro del string de i18n, no viene
  de `siteSeo.brand`.
- `header.logoTaglineSmall` (`"DIGITAL STUDIO"` / `"ESTUDIO DIGITAL"`) en
  ambos diccionarios — copy de marca, edítalo junto con lo anterior.

## 2. URL del sitio

- Cambia **solo** `src/lib/seo/defaults.ts` → `siteSeo.siteUrl`. Es la fuente
  única del origen público.
- `astro.config.mjs` deriva tanto la propiedad top-level `site` como la
  comparación de la home en `sitemap({ serialize(item) {...} })` desde ese
  valor. Las URLs `hreflang` del sitemap también lo toman mediante
  `hreflangLinksFor` (`src/lib/seo/sitemap.ts`). No dupliques el origen.
- Si `site` vuelve a separarse de `siteSeo.siteUrl`, o deja de ser un origen
  sin ruta, query ni hash, el build falla de inmediato con un diagnóstico
  `seo-lint:` en vez de producir errores engañosos del sitemap.

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
- `src/lib/seo/locale.ts` (`ROUTE_KEYS` / `localizedSlugs`) es hoy la **única**
  fuente de verdad de las rutas: `astro.config.mjs` ya no mantiene un segundo
  mapa propio, deriva los `hreflang` del sitemap de ahí vía `hreflangLinksFor`.
  Lo que sí debe mantenerse en paridad con `locale.ts` son los locales
  declarados en `i18n.locales` de `astro.config.mjs` (`CLAUDE.md` regla 3).
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

- La inclusión en el sitemap y la indexabilidad son controles independientes.
  Declara `sitemap: false` para omitir las rutas en/es del sitemap sin cambiar
  robots; declara `noindex: true` solo para controlar robots. El schema exige
  combinar `noindex: true` con un `sitemap: false` explícito. No mantengas una
  segunda lista de slugs en `astro.config.mjs`.

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
(`src/integrations/seo-lint/`: `lint.ts` sobre cada página, `index.ts` y
`routes.ts` sobre toda la salida de `dist/` y sobre el sitemap generado), que
distingue dos severidades:

**FAIL (rompe el build):**

<!-- seo-lint-codes:fail -->
- Una página a la vez (`lint.ts`): `TITLE_MISSING`, `DESC_MISSING`,
  `CANONICAL_MISSING`, `H1_MISSING`, `H1_MULTIPLE`, `IMG_ALT_MISSING`,
  `LD_PARSE_ERROR`.
- Salida de build completa (`index.ts`): `OG_IMAGE_404`.
- Rutas (`routes.ts`): `HTML_LANG_MISSING`, `LOCALE_CONTENT_MISMATCH`,
  `CANONICAL_NOT_CANONICAL_FORM`, `OG_URL_CANONICAL_MISMATCH`,
  `INTERNAL_LINK_NOT_CANONICAL_FORM`, `LOCALIZED_ROUTE_WITHOUT_ALTERNATES`.
- Sitemap generado (`routes.ts`): `SITEMAP_URL_NOT_CANONICAL_FORM`,
  `SITEMAP_NON_HTML_ENTRY`, `SITEMAP_ALTERNATES_MISSING`,
  `SITEMAP_LOC_DANGLING`, `SITEMAP_LOC_NOT_CANONICAL`,
  `SITEMAP_ALTERNATE_DANGLING`, `SITEMAP_PAGE_MISSING`,
  `SITEMAP_OPTED_OUT_PAGE`, `SITEMAP_NOINDEX_PAGE`.
<!-- /seo-lint-codes:fail -->

**WARN (se imprime, no rompe el build):**

<!-- seo-lint-codes:warn -->
`TITLE_TOO_SHORT` (<30), `TITLE_TOO_LONG` (>70), `DESC_TOO_SHORT` (<70),
`DESC_TOO_LONG` (>160), `OG_IMAGE_MISSING`, `LD_NO_CONTEXT`,
`LD_LANG_MISMATCH`
<!-- /seo-lint-codes:warn -->

**CONDICIONAL (la severidad la decide el build):**

<!-- seo-lint-codes:conditional -->
- `SITEMAP_OUTPUT_MISSING` — `fail` cuando `@astrojs/sitemap` está configurado,
  como en este repositorio, y aun así el build no emitió ningún sitemap;
  `warn` en un sitio que no configura sitemap alguno, donde no tenerlo es el
  resultado correcto. La integración lee la condición en `astro:config:done`,
  buscando la integración de sitemap en la configuración resuelta, y aplica la
  severidad en `astro:build:done`.
<!-- /seo-lint-codes:conditional -->

Ese código es el que impide que un orden de integraciones equivocado apague en
silencio todos los demás gates de sitemap: con `seoLint()` antes de
`sitemap()` todavía no existe sitemap cuando corren los gates, y sin este
código el build terminaría en verde sin haber verificado nada.

Las tres listas están verificadas por
`src/integrations/seo-lint/documented-codes.test.ts`, que las compara en las
dos direcciones contra los códigos que la integración declara de verdad y
rompe `bun run test` si divergen. También exige que la lista condicional
declare las dos severidades posibles, así que un código que deje de ser
condicional no puede quedarse acá en silencio. Los marcadores HTML que rodean
las tres listas son los anclajes de ese test — no los quites.

Un rebrand solo cuenta como terminado cuando ambos comandos (`bun run build`
y `bun run test`) terminan en verde desde un checkout limpio.

---

**Nota sobre `BaseLayout.astro:74`:** ese comentario en código apuntaba a una
sección inexistente (`AGENTS.md §12`). Ya fue corregido y ahora apunta a este
documento. Si vuelves a moverlo, actualiza también esta nota.
