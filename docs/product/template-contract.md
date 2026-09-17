# test-astro-html-build — contrato de producto y arquitectura de skills

Estado: propuesta para la siguiente iteración  
Fecha: 2026-09-16

## Decisión ejecutiva

test-astro-html-build no debería ser una demo visual recargada ni un repositorio que obliga a cada agente a leer decenas de miles de tokens. Debe quedar como una base Astro estática, pequeña y comprobable, con SEO, accesibilidad, contenido y configuración bien resueltos. Las capacidades costosas o específicas de un cliente deben activarse como extensiones.

La implementación todavía no está demostrada. El trabajo de arquitectura y revisión es sólido, pero el primer intento de OpenCode consumió aproximadamente 100 000 tokens y USD 0,06 sin producir cambios de la Unidad 1. La causa visible fue contaminación de contexto: el worker heredó el `CLAUDE.md` global y entró en el protocolo Gentle/review en vez de ejecutar la migración Bun→pnpm. No se debe repetir el dispatch hasta verificar el aislamiento del runtime.

## Cómo debe quedar el producto

### Núcleo que siempre se entrega

- Astro en modo estático.
- TypeScript estricto.
- pnpm pineado y Node con rango explícito.
- Una sola fuente de configuración del sitio: `src/site.config.ts`.
- Sitio monolingüe por defecto; sin rutas `/es/`, alternates ficticios ni contenido inglés bajo rutas españolas.
- Content Collections y un contrato de fuente de contenido neutral respecto al CMS.
- Adaptador local incluido; adaptadores remotos como extensiones.
- SEO técnico: canonical, metadatos sociales, sitemap, robots, JSON-LD y validación sin origen hard-coded.
- HTML semántico, navegación por teclado, `prefers-reduced-motion` y funcionamiento sin JavaScript para contenido y navegación esenciales.
- CSS y tokens pequeños, semánticos y documentados.
- JavaScript cero por defecto; islas solo donde exista una necesidad medida.
- Pruebas de configuración, contenido, rutas, SEO y accesibilidad básica.
- Documentación breve para humanos y agentes.

### Extensiones opt-in

- Segundo idioma con contenido, slugs, canonical y `hreflang` reales por locale.
- CMS o fuente remota concreta.
- Formularios e integración con un proveedor.
- Analytics, GTM y consentimiento, deny-by-default.
- Scheduling y cron.
- Upload de archivos y política de retención.
- React, Three.js, WebGL, GSAP, Lenis o animación avanzada.
- Pipelines específicos de Cloudflare, Netlify, Vercel u otro host.

El repositorio original mezcla varios de estos elementos en el núcleo: Bun, rutas inglesas/españolas, Partytown/GA, React/Three, GSAP/Lenis y WebGL. La nueva base debe conservar únicamente las piezas que demuestren valor general.

## Evaluación del trabajo de agentes

| Fase | Resultado | Evaluación |
|---|---|---|
| A–D: auditorías y síntesis | Hallazgos, disputas y decisiones ratificadas | Buen trabajo de descubrimiento; produjo límites útiles para el producto. |
| E: arquitectura Codex | Documento de 24 secciones | Fuerte como mapa de producto y secuencia de implementación. |
| F: revisión Codex | Seis correcciones y división de unidades grandes | Muy valiosa: evitó aceptar afirmaciones sin evidencia y unidades demasiado amplias. |
| OpenCode Unidad 1 | 31 minutos, ~100k tokens, USD 0,06, cero cambios | Fallo operativo. No invalida el diseño; prueba que el aislamiento de instrucciones debe ser un gate técnico. |

La orquestación ha sido más costosa que el código producido. A partir de ahora el indicador de progreso no debe ser “worker running”, sino evidencia concreta: diff relevante, validación ejecutada y resultado revisado.

## Arquitectura de skills

### Principio

Las skills forman una biblioteca consultable, no un prompt monolítico. El agente siempre ve un router mínimo y carga solo las skills necesarias para la tarea actual. Los contratos largos se consultan por sección.

### Catálogo inicial

| Skill | Estado | Cuándo cargarla | No cargarla para |
|---|---|---|---|
| `site-build` | Core, debe compactarse | Inicio de una construcción o extensión de sitio | Correcciones locales ya delimitadas |
| `project-setup` | Core | Inicio de proyecto o cambio de toolchain | Edición ordinaria de componentes |
| `astro-craft` | Core | Páginas, componentes, layouts, estilos, islands | Toolchain puro |
| `static-site-seo` | Core | Rutas, head, schema, sitemap, robots | Cambios sin superficie SEO |
| `visual-gate` | Core de aceptación | Comparación visual y responsive final | Lógica o configuración sin UI |
| `design-ingestion` | Extensión | Llega Figma, captura o mockup | Trabajo sin referencia visual |
| `form-slot` | Extensión | Diseño incluye un formulario sin integración | Sitios sin formularios |
| `security-audit` de Cloudflare | Gate de release, opt-in | Auditoría de seguridad explícita | Cada cambio o cada unidad pequeña |

El bundle revisado contiene siete skills y contratos extensos. La separación conceptual es buena, pero no se debe cargar completo: el material ronda decenas de miles de palabras. `site-build` por sí solo ronda 3 500 palabras. También debe resolverse el contrato de `tools/seo.mjs`: la documentación lo referencia, pero el snapshot proporcionado no incluye ese archivo como herramienta autónoma.

### Integración de `security-audit` de Cloudflare

El skill oficial implementa seis fases: reconocimiento, hunting guiado por cobertura, validación independiente, hallazgos estructurados, verificación independiente y reportes derivados. Incluye validadores sin dependencias para el ledger y los hallazgos. Es un buen gate de seguridad, no una instrucción permanente para todo agente.

Condiciones de adopción:

1. Instalarlo mediante una acción de mantenimiento separada y aprobada, nunca desde un worker con política “no instalar”.
2. Pinear una revisión concreta y registrar fuente, licencia y versión; no seguir `main` silenciosamente.
3. Revisar el contenido antes de confiar en él como instrucciones.
4. Ejecutar el modo completo solo con un agente que soporte subagentes paralelos y con sandbox real: sin red, entorno allowlisted, límites de recursos y escritura solo en scratch.
5. No asignarlo al perfil `orca-fixer`: ese perfil niega subagentes y está pensado para implementaciones delimitadas.
6. Para test-astro-html-build, priorizar `CLIENT-SIDE`, `SUPPLY-CHAIN-AND-RELEASE`, configuración/deploy y manejo de contenido; omitir clases nativas o de kernel que no apliquen.
7. Guardar sus reportes fuera del prompt ordinario. Las tareas normales reciben únicamente los hallazgos relevantes.

Fuente oficial: <https://github.com/cloudflare/security-audit-skill>

## Presupuesto de contexto y costo

| Elemento | Presupuesto recomendado |
|---|---:|
| `AGENTS.md` siempre visible | 800–1 500 palabras |
| Router de skills | 300–700 palabras |
| Skills cargadas por tarea ordinaria | 1–3 |
| Instrucciones + contratos para una unidad | objetivo 8k–15k tokens |
| Contexto antes del primer cambio relevante | menos de 25k tokens |
| Worker sin diff relevante | detener a los 10 minutos o 35k tokens |
| Auditoría de seguridad completa | presupuesto separado y explícito |

Los límites son guardrails, no sustituyen el juicio. Una tarea de investigación puede requerir más contexto; una migración de package manager no debería gastar 100k tokens antes de editar un archivo.

## Gate de aislamiento de agentes

Antes de cada implementación con OpenCode:

1. El launcher debe exportar `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1` y apuntar al perfil `orca-fixer`.
2. Crear una terminal fresca y confirmar agente, modelo, esfuerzo y worktree.
3. Verificar que el contexto no contiene encabezados de Gentle, `Concurrent Reviewer Group`, `Authority-First Terminal Procedure` ni instrucciones del `~/.claude/CLAUDE.md` global.
4. Confirmar que el dispatch solo referencia el brief de la unidad.
5. Exigir una señal temprana: lectura del brief correcto y un plan de máximo cinco líneas; después, primer diff relevante dentro del presupuesto anterior.
6. Si reaparece el protocolo global, detener el worker. No nudges repetidos, no segundo dispatch y no otros 100k tokens.

## Secuencia recomendada

1. **Contrato del producto y skills.** Adoptar este documento, el `AGENTS.md` compacto y un registro de skills con versiones.
2. **Aislamiento del runtime.** Probar OpenCode con una tarea desechable de lectura y salida corta antes de autorizar escritura.
3. **Toolchain.** Rehacer la Unidad 1 Bun→pnpm como cambio atómico y verificable.
4. **Core vertical.** Configuración, ruta principal, contenido local, SEO y build estático mínimos.
5. **Capas de calidad.** Accesibilidad, tests, visual gate y clientes representativos.
6. **Extensiones.** Bilingüe, CMS, forms, analytics y efectos solo como paquetes o recetas opt-in.
7. **Seguridad.** Auditoría enfocada durante desarrollo y auditoría completa antes de release.

## Criterios de aceptación del producto

- Un proyecto nuevo se personaliza sin buscar constantes de marca dispersas.
- Construye contenido local sin CMS ni red.
- No genera rutas de idiomas no configurados.
- Contenido y navegación esencial funcionan sin JavaScript.
- No incluye analytics, cron, uploads ni librerías visuales pesadas por defecto.
- El origen SEO proviene de configuración y las validaciones fallan si falta.
- El mismo contrato de contenido admite un fixture remoto sin acoplar el núcleo a un proveedor.
- Los comandos de install, check, test, build y SEO son pnpm y reproducibles.
- Un agente puede completar una unidad ordinaria cargando `AGENTS.md`, el brief y un máximo de tres skills.
- Una revisión independiente verifica el diff y los comandos, no la confianza declarada del implementador.

## Decisiones humanas todavía necesarias

- Directorio canónico y mecanismo de distribución de skills entre Claude, Codex y OpenCode: **ratificado** — ver `docs/product/agent-ecosystem-contract.md`. Solo queda pendiente su implementación (`scripts/agent-setup.mjs`, `scripts/agent-check.mjs`).
- Revisión exacta a pinear del skill de Cloudflare.
- Umbrales finales de Lighthouse/axe y navegadores soportados.
- Host y CI concretos, si se quiere una receta oficial.
- Duraciones de retención para cualquier extensión futura de archivos sensibles.

