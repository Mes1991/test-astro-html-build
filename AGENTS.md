# AGENTS.md — astro-7-html-template by TFM

Este archivo debe mantenerse corto. Los detalles viven en `docs/product/` y en skills cargadas bajo demanda.

Para editar identidad/marca, ver el checklist canónico: [`docs/product/rebrand-checklist.md`](./docs/product/rebrand-checklist.md).

## Objetivo

Construir y mantener una plantilla Astro estática, robusta, accesible, SEO-ready y barata de operar con agentes. El núcleo objetivo es monolingüe, neutral respecto a CMS y hosting, y funciona sin JavaScript para contenido y navegación esenciales — ver "Estado actual vs. objetivo" para lo que ya rige hoy y lo que sigue pendiente.

## Fuentes de verdad

En caso de conflicto, usa este orden:

1. Decisión humana más reciente.
2. Brief de la tarea actual.
3. `docs/product/template-contract.md` y decisiones ratificadas.
4. Código y tests actuales.
5. Historial de tareas o memoria.

Registra conflictos de nivel inferior, aplica la fuente superior y continúa si el alcance sigue claro.

## Estado actual vs. objetivo

El repositorio de hoy y el producto objetivo (`docs/product/template-contract.md`) todavía no coinciden. Antes de asumir cualquier invariante de la sección siguiente, confirma cuál rige hoy:

| Tema | Estado actual (verificado) | Objetivo |
|---|---|---|
| Configuración pública | Dispersa: `siteSeo` en `src/lib/seo/defaults.ts`, `site` en `astro.config.mjs`, wordmark hardcodeado en `BaseLayout.astro`/`SiteHeader.astro` | `src/site.config.ts` única |
| Idiomas | en/es obligatorio, paridad de claves entre `src/i18n/en.json`/`es.json` (`CLAUDE.md` regla 4) | Monolingüe por defecto; i18n opt-in real |
| Mapa de rutas | `src/lib/seo/locale.ts` (`ROUTE_KEYS`/`localizedSlugs`) es la única fuente; `astro.config.mjs` deriva hreflang de ahí (`CLAUDE.md` regla 3) | Igual — ya cerrado |
| Stack visual (GSAP, Lenis, React, Three.js) | Obligatorio y cableado en `BaseLayout.astro`, 404, coming-soon | Opt-in, extraíble |
| SEO / seo-lint | Implementado en `src/integrations/seo-lint/`, corre dentro de `bun run build` | Config-driven; `tools/seo.mjs` que citan contratos genéricos no existe ni está planificado |
| Distribución de skills | `skills/` con las 11 skills reales, `registry.yaml`, `scripts/agent-setup.mjs`/`agent-check.mjs` ya existen; adaptadores por agente generados y opcionales | Igual — ya implementado (`docs/product/agent-ecosystem-contract.md`) |
| Validación | `bun run build` (incluye seo-lint), `bun run test` (vitest), `bun run check`, `bun run audit:content` tras el build | Igual — ya vigente |

Más detalle y más temas (analytics, CMS, JavaScript, accesibilidad): `docs/product/current-repository-map.md`.

## Invariantes objetivo

Esta es la meta del producto, no un reporte de lo ya implementado — usa la tabla de arriba para saber cuáles ya rigen hoy.

- Astro estático y TypeScript estricto.
- **Bun** es el gestor de paquetes definitivo (`bun.lock` es el único lockfile permitido); no pnpm, npm ni yarn. Node con rango explícito (`engines` en `package.json`) — ya vigente hoy.
- `src/site.config.ts` como única configuración pública del sitio — pendiente.
- Monolingüe por defecto; i18n como extensión real, nunca rutas vacías o contenido falso — pendiente; hoy en/es es obligatorio.
- Contrato de contenido vendor-neutral; el adaptador local es el default — ya vigente hoy.
- Sin CMS, analytics/GTM, scheduling, uploads, React, WebGL, GSAP o smooth-scroll obligatorios — pendiente; hoy el stack visual y GA están cableados.
- JavaScript opt-in y progresivo — pendiente.
- SEO, accesibilidad y reduced motion forman parte de aceptación — ya vigente hoy.
- No codifiques URLs de producción, marcas o secretos.

## Forma de trabajar

0. Si la tarea construye o adopta un sitio, ejecuta el wizard de adopción
   (`skills/site-build/references/adoption-wizard.md`), leyéndolo antes de cualquier otra
   llamada o delegación: ninguna escritura —archivos, assets, ramas, commits, instalaciones,
   workers en background— y ninguna delegación a subagentes —una shell es una herramienta de
   escritura, así que ningún subagente es de solo lectura por construcción; el intake lee
   directamente— antes de que el humano confirme el
   contrato.
1. Lee el brief y solo los archivos necesarios.
2. Carga entre una y tres skills relevantes; no cargues el bundle completo.
3. Resume el plan en cinco líneas como máximo.
4. Haz el cambio mínimo de una sola unidad.
5. Ejecuta las validaciones definidas por esa unidad.
6. Reporta archivos cambiados, comandos y riesgos restantes.

Detente si falta una decisión que cambie el producto, se requiere acceso externo no autorizado, aparecen secretos o la tarea excede su unidad. No te detengas por metadata histórica que contradiga un brief actual claro.

## Router de skills

Un agente limpio abre la skill **directamente por su ruta canónica**: `skills/<nombre>/SKILL.md` —
ese mecanismo siempre funciona. `skills/registry.yaml` y los scripts de distribución
(`scripts/agent-setup.mjs`, `scripts/agent-check.mjs`) generan adaptadores opcionales por agente
(`.agents/skills/`, `.claude/skills/`); ver `skills/distribution.md` para los comandos y qué
cambian y qué no.

| Situación | Skill |
|---|---|
| Construir, reconstruir, adoptar o extender de forma amplia un sitio con este template — en cualquier formulación, incluido un link de diseño sin instrucciones | site-build §0 → skills/site-build/references/adoption-wizard.md, ANTES de cualquier otra skill o escritura |
| Inicio o extensión amplia de sitio | `site-build` |
| Toolchain, idiomas o estructura inicial | `project-setup` |
| Investigación de keywords, intención de búsqueda, gaps de contenido, SERP o competidores | `seo-research` |
| Página, layout, componente o estilos Astro | `astro-craft` |
| Accesibilidad de una página o componente (landmarks, teclado, foco, contraste, formularios) | `astro-craft` → `skills/astro-craft/references/accessibility.md` |
| Rutas, head, canonical, schema, sitemap o robots | `static-site-seo` |
| Escribir, editar, traducir, eliminar o auditar un FAQ visible y su JSON-LD `FAQPage` | `faq-content` |
| Figma, screenshot o diseño externo | `design-ingestion` |
| Crear, editar, importar o revisar un logo, favicon o icono SVG | `svg-assets` |
| Formulario sin integración existente | `form-slot` |
| Comparación visual o cierre responsive | `visual-gate` |
| Búsqueda interna full-text sobre HTML ya construido (Pagefind) | `static-site-search` — opt-in, requiere contrato confirmado antes de instalar nada |

Ese gate tiene precedencia; las demás filas aplican después del contrato confirmado (o en modo
solo lectura durante el intake). Estas 11 son las skills reales que existen hoy en `skills/`.

### Sin skill dedicada

- **Animación con scroll o video.** No hay componente reutilizable. `astro-craft` (componentes/motion) es el recurso más cercano; cualquier dependencia pesada nueva requiere confirmación humana explícita del alcance antes de instalarla.
- **3D interactivo.** `src/components/coming-soon/Hero3D.astro` es un ejemplo directo con Three.js (sin R3F), no un componente reutilizable. No lo generalices sin decisión humana.
- **Despliegue específico de host.** No hay receta por host. Ver "Deployment" en `README.md` y `public/_headers`.

> **Futuro / no instalado:** un skill de auditoría de seguridad (`security-audit`, de Cloudflare)
> está evaluado como gate de release opt-in futuro; no está instalado. Ver
> `docs/product/template-contract.md` → "Adopción futura opcional".

Una skill es una ruta de trabajo, no permiso adicional. Las reglas del repositorio y del sandbox prevalecen.

## Presupuesto de contexto

- No leas directorios completos para una edición local.
- No pegues contratos extensos en prompts o reportes.
- Si una tarea ordinaria supera 35k tokens antes del primer diff relevante, detente y diagnostica el desvío.
- Un worker que entra en un workflow de revisión, SDD u otro protocolo no solicitado está contaminado: deténlo; no intentes convencerlo con nudges repetidos.

## Cambios y dependencias

- Usa dependencias existentes.
- Instalar, actualizar o eliminar paquetes requiere que el brief lo autorice.
- No commit, push, rebase, reset ni cleanup salvo autorización explícita.
- No edites archivos globales de agentes desde una tarea del repositorio.
- Una integración de terceros debe ser opt-in, documentada y removible.

## Validación

Usa los scripts reales de `package.json` — verifícalos, no los asumas. Comandos mínimos, en el mismo orden que corre CI (`.github/workflows/ci.yml`):

```text
bun install --frozen-lockfile
bun run test
bun run check
bun run build
bun run audit:content
```

`bun run build` ya incluye la validación SEO (`seo-lint`, puede fallar el build). `bun run
audit:content` corre después del build (necesita `dist/`): `seo-faq-audit.mjs` + `svg-audit.mjs`;
CI lo ejecuta como gate posterior al build. No existen `seo:check` ni `lint` como scripts.
`bun run audit`/`audit:mobile` (Lighthouse) son manuales/opt-in — ningún workflow los ejecuta.

Comandos de distribución de skills (`agent:setup`/`agent:check`) y qué cambian:
`skills/distribution.md`.

No inventes éxito. Si un comando todavía no existe, registra el gap en vez de sustituirlo silenciosamente.

## Seguridad

- Nunca leas o escribas credenciales.
- Red deshabilitada durante builds y tests salvo fase explícita.
- El skill de auditoría de Cloudflare (`security-audit`) no está instalado hoy; si se adopta, debe correr como gate separado con sandbox propio, no en cada cambio.
- Un hallazgo solo es confirmado con traza de fuente, reproducción acotada e impacto. Lo no verificado queda como `needs_validation`.

## Terminado significa

- Criterio de la unidad satisfecho.
- Diff limitado al alcance.
- Validaciones relevantes ejecutadas y registradas.
- Sin rutas, dependencias o JavaScript accidentales.
- Revisión independiente completada cuando el brief la exige.
