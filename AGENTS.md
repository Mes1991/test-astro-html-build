# AGENTS.md — test-astro-html-build

Este archivo debe mantenerse corto. Los detalles viven en `docs/product/` y en skills cargadas bajo demanda.

Para editar identidad/marca, ver el checklist canónico: [`docs/product/rebrand-checklist.md`](./docs/product/rebrand-checklist.md).

## Objetivo

Construir y mantener una plantilla Astro estática, robusta, accesible, SEO-ready y barata de operar con agentes. El núcleo es monolingüe, neutral respecto a CMS y hosting, y funciona sin JavaScript para contenido y navegación esenciales.

## Fuentes de verdad

En caso de conflicto, usa este orden:

1. Decisión humana más reciente.
2. Brief de la tarea actual.
3. `docs/product/template-contract.md` y decisiones ratificadas.
4. Código y tests actuales.
5. Historial de tareas o memoria.

Registra conflictos de nivel inferior, aplica la fuente superior y continúa si el alcance sigue claro.

## Invariantes del núcleo

- Astro estático y TypeScript estricto.
- **Bun** es el gestor de paquetes definitivo (`bun.lock` es el único lockfile permitido); no pnpm, npm ni yarn. Node con rango explícito (`engines` en `package.json`).
- `src/site.config.ts` es la única configuración pública del sitio.
- Monolingüe por defecto; i18n es una extensión real, nunca rutas vacías o contenido falso.
- Contrato de contenido vendor-neutral; el adaptador local es el default.
- Sin CMS, analytics/GTM, scheduling, uploads, React, WebGL, GSAP o smooth-scroll obligatorios.
- JavaScript opt-in y progresivo.
- SEO, accesibilidad y reduced motion forman parte de aceptación.
- No codifiques URLs de producción, marcas o secretos.

## Forma de trabajar

0. Si la tarea construye o adopta un sitio, ejecuta el wizard de adopción
   (`skills/site-build/references/adoption-wizard.md`), leyéndolo antes de cualquier otra
   llamada o delegación: ninguna escritura —archivos, assets, ramas, commits, instalaciones,
   workers en background ni subagentes con herramientas de escritura; solo se delega
   exploración de solo lectura— antes de que el humano confirme el
   contrato.
1. Lee el brief y solo los archivos necesarios.
2. Carga entre una y tres skills relevantes; no cargues el bundle completo.
3. Resume el plan en cinco líneas como máximo.
4. Haz el cambio mínimo de una sola unidad.
5. Ejecuta las validaciones definidas por esa unidad.
6. Reporta archivos cambiados, comandos y riesgos restantes.

Detente si falta una decisión que cambie el producto, se requiere acceso externo no autorizado, aparecen secretos o la tarea excede su unidad. No te detengas por metadata histórica que contradiga un brief actual claro.

## Estado transitorio

- `docs/product/template-contract.md` describe el **producto objetivo**. Los "Invariantes del núcleo" de arriba son esa meta, no un reporte de lo que ya existe.
- El repositorio todavía puede contener rutas bilingües obligatorias y dependencias legacy (GSAP, Lenis, React, Three.js) hasta que sus unidades de migración correspondientes queden implementadas y validadas. Bun **no** es parte de esta lista: es la decisión final del gestor de paquetes, no una migración pendiente.
- Antes de ejecutar cualquier comando, cada tarea debe inspeccionar `package.json` y el estado real del repositorio — no asumas los scripts objetivo de la sección "Validación" sin confirmarlos.
- No afirmes que la configuración única `src/site.config.ts` o cualquier otra migración pendiente ya existen hasta que su diff y sus validaciones estén completados y registrados.
- Para el estado actual verificado (comandos reales, estructura, Content Collections, seo-lint, OG, variables de entorno, rutas/i18n vigentes, accesibilidad/reduced-motion/performance), consulta `docs/product/current-repository-map.md`.

| Tema | Estado actual del repositorio | Producto objetivo | Unidad que lo cierra |
|---|---|---|---|
| Configuración pública | Dispersa (`siteSeo` en `src/lib/seo/defaults.ts`, `astro.config.mjs`, wordmark hardcodeado) | `src/site.config.ts` única | Pendiente, posterior a Unidad 1 |
| Idiomas | en/es obligatorio con paridad de claves | Monolingüe por defecto; i18n extensión opt-in real | Pendiente |
| Stack visual (GSAP, Lenis, React, Three.js) | Obligatorio y cableado en `BaseLayout.astro`, 404, coming-soon | Opt-in, extraíble | Pendiente |
| Analytics | GA + Partytown presentes y activos | Extensión opt-in, deny-by-default | Pendiente |
| CMS / scheduling / uploads | No existen hoy | Extensiones opt-in explícitas, deny-by-default | Pendiente |
| JavaScript | Motion y WebGL obligatorios en varias páginas | Opt-in y progresivo | Pendiente |
| SEO / seo-lint / OG | Parcialmente implementado; gaps conocidos, incluyendo configuración/origen y materialización de `tools/seo.mjs` (ver `current-repository-map.md` §4) | Config-driven, verificable, sin origen hard-coded | Pendiente de cierre |
| Distribución de skills | `skills/` contiene las 7 skills reales con contenido completo; no existe `skills/registry.yaml` ni sincronización a `.agents/`/`.claude/`. Un agente limpio abre cada skill directamente por ruta canónica: `skills/<nombre>/SKILL.md` | `skills/` canónico + distribución automática; Codex/OpenCode consumirían `.agents/skills/`; Claude consumiría `.claude/skills/`; Orca queda fuera del contrato como configuración personal | Trabajo futuro, ver `docs/product/agent-ecosystem-contract.md` |

## Router de skills

Un agente limpio abre la skill **directamente por su ruta canónica**:
`skills/<nombre>/SKILL.md`. No hay hoy un distribuidor automático ni un
`skills/registry.yaml`; ese mecanismo es trabajo futuro (ver
`docs/product/agent-ecosystem-contract.md`).

| Situación | Skill |
|---|---|
| Construir, reconstruir, adoptar o extender de forma amplia un sitio con este template — en cualquier formulación, incluido un link de diseño sin instrucciones | site-build §0 → skills/site-build/references/adoption-wizard.md, ANTES de cualquier otra skill o escritura |
| Inicio o extensión amplia de sitio | `site-build` |
| Toolchain, idiomas o estructura inicial | `project-setup` |
| Página, layout, componente o estilos Astro | `astro-craft` |
| Rutas, head, canonical, schema, sitemap o robots | `static-site-seo` |
| Figma, screenshot o diseño externo | `design-ingestion` |
| Formulario sin integración existente | `form-slot` |
| Comparación visual o cierre responsive | `visual-gate` |

Ese gate tiene precedencia; las demás filas aplican después del contrato confirmado (o en modo
solo lectura durante el intake).

Estas 7 son las únicas skills que existen hoy en `skills/`.

> **Futuro / no instalado:** un skill de auditoría de seguridad (`security-audit`,
> basado en el proyecto de Cloudflare) está evaluado como gate de release
> opt-in, pero no está instalado ni forma parte del catálogo anterior. Ver
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

Usa los scripts reales de `package.json` — verifícalos, no los asumas. Comandos vigentes hoy:

```text
bun install --frozen-lockfile
bun run dev
bun run test
bun run check
bun run build
```

No existe `seo:check`, `lint`, `agent:setup` ni `agent:check` como script de `package.json`. `bun run build` ya incluye la validación SEO (`seo-lint`) y puede fallar el build.

No inventes éxito. Si un comando todavía no existe, registra el gap en vez de sustituirlo silenciosamente.

## Seguridad

- Nunca leas o escribas credenciales.
- Red deshabilitada durante builds y tests salvo fase explícita.
- El skill de auditoría de Cloudflare (`security-audit`), cuando se adopte, debe ejecutarse como gate separado con sandbox y presupuesto propios, no en cada cambio; hoy no está instalado (ver "Router de skills").
- Un hallazgo solo es confirmado con traza de fuente, reproducción acotada e impacto. Lo no verificado queda como `needs_validation`.

## Terminado significa

- Criterio de la unidad satisfecho.
- Diff limitado al alcance.
- Validaciones relevantes ejecutadas y registradas.
- Sin rutas, dependencias o JavaScript accidentales.
- Revisión independiente completada cuando el brief la exige.
