# test-astro-html-build — contrato de producto y arquitectura de skills

Estado: propuesta para la siguiente iteración  
Fecha: 2026-09-16

## Decisión ejecutiva

test-astro-html-build no debería ser una demo visual recargada ni un repositorio que obliga a cada agente a leer decenas de miles de tokens. Debe quedar como una base Astro estática, pequeña y comprobable, con SEO, accesibilidad, contenido y configuración bien resueltos. Las capacidades costosas o específicas de un cliente deben activarse como extensiones.

## Cómo debe quedar el producto

### Núcleo que siempre se entrega

- Astro en modo estático.
- TypeScript estricto.
- Bun pineado (`bun.lock`, `engines.node` en `package.json`) — decisión final, sin migración a pnpm.
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

Estas 7 son las skills reales que existen hoy en `skills/`, cada una con contenido completo. La separación conceptual es buena, pero no se debe cargar el bundle completo: el material ronda decenas de miles de palabras. `site-build` por sí solo ronda 3 500 palabras. También debe resolverse el contrato de `tools/seo.mjs`: la documentación lo referencia, pero el snapshot proporcionado no incluye ese archivo como herramienta autónoma.

### Adopción futura opcional: `security-audit` de Cloudflare

No es una skill instalada ni forma parte del catálogo de 7 anterior. Es una evaluación de trabajo futuro opcional: el skill oficial implementa seis fases (reconocimiento, hunting guiado por cobertura, validación independiente, hallazgos estructurados, verificación independiente y reportes derivados) e incluye validadores sin dependencias para el ledger y los hallazgos. Sería un buen gate de seguridad de release, nunca una instrucción permanente para todo agente.

Si se adopta en el futuro, condiciones mínimas:

1. Instalarlo mediante una acción de mantenimiento separada y aprobada, nunca desde un worker con política “no instalar”.
2. Pinear una revisión concreta y registrar fuente, licencia y versión; no seguir `main` silenciosamente.
3. Revisar el contenido antes de confiar en él como instrucciones.
4. Ejecutar el modo completo solo con un agente que soporte subagentes paralelos y con sandbox real: sin red, entorno allowlisted, límites de recursos y escritura solo en scratch.
5. Priorizar, para test-astro-html-build, `CLIENT-SIDE`, `SUPPLY-CHAIN-AND-RELEASE`, configuración/deploy y manejo de contenido; omitir clases nativas o de kernel que no apliquen.
6. Guardar sus reportes fuera del prompt ordinario. Las tareas normales reciben únicamente los hallazgos relevantes.

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

Los límites son guardrails, no sustituyen el juicio. Una tarea de investigación puede requerir más contexto; una unidad de implementación ordinaria no debería gastar decenas de miles de tokens antes de editar un archivo.

## Principio de aislamiento de agentes

Un agente no debe depender de, modificar ni suprimir configuración global de la máquina sin autorización explícita de la tarea actual. Cada ejecución debe poder verificarse contra el brief de la unidad — lectura del brief correcto, un plan acotado y un primer diff relevante dentro del presupuesto de contexto de arriba — no contra estado ambiental heredado. Si reaparece instrucción externa a la tarea, detener el worker; no insistir con nudges repetidos ni relanzar el mismo dispatch.

## Secuencia recomendada

1. **Contrato del producto y skills.** Adoptar este documento, el `AGENTS.md` compacto y un registro de skills con versiones.
2. **Aislamiento del runtime.** Probar cada agente/orquestador con una tarea desechable de lectura y salida corta antes de autorizar escritura.
3. **Toolchain.** Consolidar Bun (`bun.lock`, `engines.node`, `packageManager`) como base verificable: `--frozen-lockfile`, `--ignore-scripts` y ausencia de `trustedDependencies` documentados.
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
- Los comandos de install, check, test y build son Bun y reproducibles; `bun run build` incluye la validación SEO (`seo-lint`).
- Un agente puede completar una unidad ordinaria cargando `AGENTS.md`, el brief y un máximo de tres skills.
- Una revisión independiente verifica el diff y los comandos, no la confianza declarada del implementador.

## Decisiones humanas todavía necesarias

- Directorio canónico y mecanismo de distribución de skills entre Claude, Codex y OpenCode: **ratificado** — ver `docs/product/agent-ecosystem-contract.md`. Solo queda pendiente su implementación (`scripts/agent-setup.mjs`, `scripts/agent-check.mjs`).
- Revisión exacta a pinear del skill de Cloudflare.
- Umbrales finales de Lighthouse/axe y navegadores soportados.
- Host y CI concretos, si se quiere una receta oficial.
- Duraciones de retención para cualquier extensión futura de archivos sensibles.

