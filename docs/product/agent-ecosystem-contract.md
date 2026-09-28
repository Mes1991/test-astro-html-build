# astro-7-html-template by TFM — contrato del ecosistema portable de agentes

Estado: decisiones humanas ratificadas, 2026-09-16 — ese acto de ratificación
fue documental únicamente, sin tocar script, dependencia ni `package.json`.
La implementación (registro, scripts, manifiesto) se completó y verificó
después, el 2026-09-28 — ver "Estado de implementación" abajo.

Este documento es la fuente autoritativa de Unidad 0. Complementa, no
sustituye, a `docs/product/template-contract.md` (contrato de producto) y al
`skills/registry.yaml` (metadata de skills — ya existe, ver
"Estado de implementación"). En caso de conflicto sobre distribución de
skills entre agentes, este documento gana.

## Decisiones ratificadas

1. `skills/` en la raíz del repositorio es la **única fuente canónica**. Ningún
   otro directorio contiene metadata o contenido de skill que no derive de ahí.
2. Los adaptadores por agente son **copias materializadas, no symlinks**:
   - `.agents/skills/` — consumido por Codex y OpenCode (mismo destino para
     ambos; ninguno tiene convención propia distinta de `.agents/`).
   - `.claude/skills/` — consumido por Claude.
3. Ambos adaptadores son **generados** y se **excluyen de Git**
   (`.gitignore`) para evitar una segunda fuente de verdad y drift entre la
   copia y el canónico.
4. `agent:check` debe detectar, comparando hashes contra `skills/`:
   - skills faltantes en un adaptador (existe en `skills/`, no en el destino);
   - skills adicionales en un adaptador (existe en el destino, no en
     `skills/registry.yaml` — puede ser contenido manual no gestionado);
   - skills desactualizadas (existe en ambos lados, hash distinto).
5. Setup inicial ejecutable como `node scripts/agent-setup.mjs
   <codex|claude|opencode|all>` (script todavía no implementado — ver "Estado
   de implementación"). `node` es la única dependencia asumida; no depende de
   pnpm, que no es ni será el gestor de paquetes de este repositorio (Bun es
   la decisión final, ver `template-contract.md`).
6. Cuando ese script exista, `package.json` puede exponer `bun run agent:setup`
   y `bun run agent:check` como envoltorios finos sobre el mismo script — no
   una reimplementación paralela. No habrá equivalentes `pnpm`.
7. `all` es un **modo avanzado para orquestadores** (Orca u otro), no el modo
   por defecto para un agente individual. Debe emitir una advertencia
   explícita: ejecutar `all` sin aislar el descubrimiento de skills por agente
   permite que un runtime multi-agente descubra simultáneamente
   `.agents/skills/` y `.claude/skills/`, contaminando su contexto con
   instrucciones ajenas a su propio adaptador.
8. Orca permanece **fuera del contrato del template** — configuración personal
   de máquina (`.orca/`), no una dependencia que el producto astro-7-html-template asuma.

## Qué NO decide este contrato todavía

- El código real de `scripts/agent-setup.mjs` y `scripts/agent-check.mjs` ya
  existe (ver "Estado de implementación" abajo); lo que sigue sin decidirse es
  si se ejecuta en CI, en pre-commit, o solo manualmente.
- El algoritmo de hash quedó resuelto en la implementación: SHA-256 sobre las
  rutas relativas y el contenido de cada archivo de la skill, agregado en
  `.agent-skills-manifest.json` (`hashDir` en `scripts/lib/agent-skills.mjs`).

## Riesgo conocido: `.claude/skills/` ya existe con contenido no gestionado

Este worktree ya tiene `.claude/skills/` con contenido preexistente (no
originado por este contrato). `agent:setup`/`agent:check` para el destino
Claude **no deben asumir el directorio vacío**:

- Nunca borrar ni sobrescribir una entrada de `.claude/skills/<nombre>` que no
  corresponda a una skill listada en `skills/registry.yaml`.
- Tratar esa colisión como hallazgo de `agent:check` (categoría "adicional"),
  nunca como limpieza automática.

Este riesgo queda documentado aquí para que la unidad de implementación de
`scripts/agent-setup.mjs` lo trate como requisito, no como sorpresa.

## Estado de implementación

Implementado y verificado el 2026-09-28. Estado real verificado:

- **Existe:** `skills/` con las 11 skills reales del catálogo (`astro-craft`,
  `design-ingestion`, `faq-content`, `form-slot`, `project-setup`,
  `seo-research`, `site-build`, `static-site-search`, `static-site-seo`,
  `svg-assets`, `visual-gate`), cada una con su `SKILL.md`. Un agente limpio
  sigue pudiendo abrir cada una directamente por su ruta canónica:
  `skills/<nombre>/SKILL.md` — esa lectura por ruta nunca dejó de funcionar.
- `skills/registry.yaml` (fuente de qué skills existen y su estado
  `installed`), `scripts/agent-setup.mjs` y `scripts/agent-check.mjs`
  (implementación compartida en `scripts/lib/agent-skills.mjs`) ya existen y
  están cubiertos por `bun run test`. Las entradas `.agents/skills/` y
  `.claude/skills/` ya están en `.gitignore`.
- **Decisión de implementación sobre el "Riesgo conocido" de arriba:** cada
  destino generado lleva un manifiesto `.agent-skills-manifest.json` (hash de
  contenido por skill que ese generador materializó). Es la forma concreta en
  que el script distingue "una skill que yo gestiono y quedó desactualizada"
  de "un directorio que ya estaba ahí por otra razón" — nunca borra ni
  sobrescribe una entrada no registrada en su propio manifiesto
  (`UNMANAGED_COLLISION`), satisfaciendo el punto 4 de "Riesgo conocido" con un
  mecanismo verificable en vez de una convención de nombres.
- `skills/registry.yaml` se parsea con un subconjunto estricto de YAML escrito
  a mano (`parseRegistry` en `scripts/lib/agent-skills.mjs`) — comentarios,
  una línea `version: 1`, y pares `- name:` / `installed:` — precisamente
  porque el repositorio no tiene ninguna dependencia de parseo YAML instalada
  y añadir una solo para este archivo no estaba autorizado.

Ninguna de estas decisiones bloquea Unidad 0: el contrato queda ratificado y
verificable por criterios, y esos criterios ya están implementados.

## Criterios verificables de `agent:setup` (implementado)

`node scripts/agent-setup.mjs <codex|claude|opencode|all>` (también expuesto
como `bun run agent:setup -- <target>`) cumple, para cada target invocado:

1. Lee `skills/registry.yaml` como única fuente de qué skills existen; nunca
   escanea `skills/` a ciegas ni asume una lista hard-coded.
2. Para cada skill con `installed: true` (las 11 hoy), copia su
   contenido completo desde `skills/<nombre>/` al destino del target
   (`.agents/skills/<nombre>/` para `codex`/`opencode`, `.claude/skills/<nombre>/`
   para `claude`), preservando estructura de archivos.
3. Con cero skills `installed: true`, termina en éxito sin crear directorios
   vacíos ni fallar — reporta explícitamente "0 skills materializadas" en vez
   de simular trabajo. (Estado actual: las 11 skills registradas están
   marcadas `installed: true`, así que este es el caso vacío verificado, no el
   estado por defecto.)
4. Nunca borra ni sobrescribe una entrada del destino que no corresponda a una
   skill de `skills/registry.yaml` (ver "Riesgo conocido" arriba); esas
   entradas se reportan, no se tocan.
5. Es idempotente: ejecutarlo dos veces seguidas sin cambios en `skills/`
   produce el mismo resultado y ninguna escritura adicional.
6. Con `all`, imprime la advertencia del punto 7 de "Decisiones ratificadas"
   antes de materializar, no después.
7. Con un target desconocido (ni `codex`, `claude`, `opencode` ni `all`),
   termina con código de salida distinto de cero y sin escribir nada.

## Criterios verificables de `agent:check` (implementado)

`node scripts/agent-check.mjs [<codex|claude|opencode|all>]` (target opcional;
por defecto revisa los tres; también expuesto como `bun run agent:check`)
cumple:

1. Para cada skill de `skills/registry.yaml`, calcula un hash de su contenido
   en `skills/<nombre>/` y lo compara contra el hash del contenido
   materializado en cada destino aplicable.
2. Reporta cuatro categorías por destino, sin mezclarlas: **MISSING**
   (registrada e `installed: true`, ausente del destino), **OUTDATED**
   (presente, hash ya no coincide con `skills/`), **ADDITIONAL** (presente en
   el destino, ausente de `skills/registry.yaml`), **UNMANAGED_COLLISION**
   (presente y `installed: true`, pero no registrada en el manifiesto de ese
   destino — ver la decisión de manifiesto en "Estado de implementación").
3. Termina con código de salida distinto de cero si existe al menos un
   hallazgo en cualquier categoría; código cero solo si los destinos
   revisados están exactamente sincronizados con `skills/`.
4. Nunca modifica ningún archivo — es de solo lectura por diseño; una
   discrepancia se corrige re-ejecutando `agent:setup`, no `agent:check`.
5. Con cero skills `installed: true`, un destino vacío no es un hallazgo de
   "MISSING" — solo lo es cuando `skills/registry.yaml` marca al menos una
   skill como instalada y el destino no la refleja.

## Matriz de aceptación por agente/orquestador

`agent:check` ya existe (ver "Estado de implementación"). El uso de un
adaptador generado sigue siendo opcional: todo agente puede seguir abriendo
skills directamente por `skills/<nombre>/SKILL.md` sin depender de esta
matriz.

| Agente/orquestador | Destino leído | Precondición de aislamiento | Criterio de aceptación |
|---|---|---|---|
| Codex | `.agents/skills/` | Ninguna adicional conocida | `agent:check codex` retorna código 0 antes de que Codex arranque una tarea que dependa de un adaptador materializado |
| OpenCode | `.agents/skills/` (y `.claude/skills/`, que también lee — ver `skills/distribution.md`) | Aislar el descubrimiento de skills por agente (ver "Principio de aislamiento de agentes" en `template-contract.md`) | `agent:check opencode` retorna código 0; terminal fresca confirmada por ese mismo principio |
| Claude | `.claude/skills/` | Ninguna adicional conocida; respetar el "Riesgo conocido" (contenido preexistente no gestionado) | `agent:check claude` retorna código 0 **y** cero hallazgos de categoría `UNMANAGED_COLLISION`/`ADDITIONAL` que correspondan a skills de este registro (contenido preexistente ajeno se tolera, se reporta, no bloquea) |
| Orca | No lee ningún destino de skills; permanece fuera del contrato | Ninguna — Orca es configuración personal, no parte del producto | El template debe construir, testear y pasar `agent:check` sin que Orca esté instalado en la máquina |

## Referencia cruzada

- `AGENTS.md` → tabla "Estado actual vs. objetivo", fila "Distribución de skills".
- `skills/registry.yaml` → lista de skills instaladas (`skills:`); hoy no tiene
  bloques `distribution:` ni `human_decisions_pending`.
- `docs/product/template-contract.md` → "Decisiones humanas todavía
  necesarias" (actualizado para remitir aquí).
