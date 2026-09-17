# test-astro-html-build — contrato del ecosistema portable de agentes

Estado: decisiones humanas ratificadas, 2026-09-16. Documental únicamente —
ningún script, dependencia ni `package.json` fue tocado para producir este
contrato.

Este documento es la fuente autoritativa de Unidad 0. Complementa, no
sustituye, a `docs/product/template-contract.md` (contrato de producto) y a
`skills/registry.yaml` (metadata de skills). En caso de conflicto sobre
distribución de skills entre agentes, este documento gana.

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
   <codex|claude|opencode|all>`, porque pnpm todavía no existe en este
   repositorio hasta que la Unidad 1 (Bun→pnpm) se complete. `node` es la única
   dependencia asumida.
6. Después de la migración Bun→pnpm, `package.json` expondrá los aliases
   `pnpm agent:setup` y `pnpm agent:check` como envoltorios finos sobre el
   mismo script — no una reimplementación paralela.
7. `all` es un **modo avanzado para orquestadores** (Orca u otro), no el modo
   por defecto para un agente individual. Debe emitir una advertencia
   explícita: ejecutar `all` sin `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1`
   permite que OpenCode descubra simultáneamente `.agents/skills/` y
   `.claude/skills/`, contaminando su contexto con instrucciones ajenas a su
   propio adaptador.
8. Orca permanece **fuera del contrato del template** — configuración personal
   de máquina (`.orca/`), no una dependencia que el producto test-astro-html-build asuma.

## Qué NO decide este contrato todavía

- El código real de `scripts/agent-setup.mjs` y `scripts/agent-check.mjs` (no
  implementados; ver "Estado de implementación" abajo).
- El algoritmo de hash exacto (contenido recomendado: SHA-256 por archivo,
  agregado en un manifiesto por skill — a confirmar en la unidad de
  implementación).
- Si `agent:check` se ejecuta en CI, en pre-commit, o solo manualmente.

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

Puramente documental. No existe todavía:

- `scripts/agent-setup.mjs` ni `scripts/agent-check.mjs`.
- Ningún archivo de skill materializado bajo `skills/` más allá de
  `skills/registry.yaml` (los `core_skills` siguen `installed: false`, con
  `source` apuntando a una ruta local fuera del repositorio — ver
  `skills/registry.yaml`). `agent:setup` no tiene contenido real que copiar
  hasta que esa vendorización ocurra en una unidad posterior.
- El directorio `.agents/skills/` (no existe aún en este worktree).
- Entradas de `.gitignore` para `.agents/skills/` y `.claude/skills/`.

Ninguna de estas ausencias bloquea Unidad 0: el contrato queda ratificado y
verificable por criterios, independientemente de cuándo se implemente.

## Criterios verificables de `agent:setup`

`node scripts/agent-setup.mjs <codex|claude|opencode|all>` debe cumplir, para
cada target invocado:

1. Lee `skills/registry.yaml` como única fuente de qué skills existen; nunca
   escanea `skills/` a ciegas ni asume una lista hard-coded.
2. Para cada skill con `status.installed: true` (ninguna hoy), copia su
   contenido completo desde `skills/<nombre>/` al destino del target
   (`.agents/skills/<nombre>/` para `codex`/`opencode`, `.claude/skills/<nombre>/`
   para `claude`), preservando estructura de archivos.
3. Con cero skills `installed: true` (estado actual), termina en éxito sin
   crear directorios vacíos ni fallar — reporta explícitamente "0 skills
   materializadas" en vez de simular trabajo.
4. Nunca borra ni sobrescribe una entrada del destino que no corresponda a una
   skill de `skills/registry.yaml` (ver "Riesgo conocido" arriba); esas
   entradas se reportan, no se tocan.
5. Es idempotente: ejecutarlo dos veces seguidas sin cambios en `skills/`
   produce el mismo resultado y ninguna escritura adicional.
6. Con `all`, imprime la advertencia del punto 7 de "Decisiones ratificadas"
   antes de materializar, no después.
7. Con un target desconocido (ni `codex`, `claude`, `opencode` ni `all`),
   termina con código de salida distinto de cero y sin escribir nada.

## Criterios verificables de `agent:check`

`node scripts/agent-check.mjs [<codex|claude|opencode|all>]` (target opcional;
por defecto revisa los tres) debe cumplir:

1. Para cada skill de `skills/registry.yaml`, calcula un hash de su contenido
   en `skills/<nombre>/` y lo compara contra el hash del contenido
   materializado en cada destino aplicable.
2. Reporta tres categorías por destino, sin mezclarlas: **faltante** (en
   `skills/`, no en el destino), **adicional** (en el destino, no en
   `skills/registry.yaml`), **desactualizada** (hashes distintos en ambos
   lados).
3. Termina con código de salida distinto de cero si existe al menos un
   hallazgo en cualquier categoría; código cero solo si los tres destinos
   están exactamente sincronizados con `skills/`.
4. Nunca modifica ningún archivo — es de solo lectura por diseño; una
   discrepancia se corrige re-ejecutando `agent:setup`, no `agent:check`.
5. Con cero skills `installed: true` (estado actual), un destino vacío no es
   un hallazgo de "faltante" — solo lo es cuando `skills/registry.yaml` marca
   al menos una skill como instalada y el destino no la refleja.

## Matriz de aceptación por agente/orquestador

| Agente/orquestador | Destino leído | Precondición de aislamiento | Criterio de aceptación |
|---|---|---|---|
| Codex | `.agents/skills/` | Ninguna adicional conocida | `agent:check codex` retorna código 0 antes de que Codex arranque una tarea que dependa de una skill |
| OpenCode | `.agents/skills/` | Launcher exporta `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1`; para el modo `all`, también `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1` | `agent:check opencode` retorna código 0; terminal fresca confirmada por el gate de aislamiento existente (`template-contract.md` → "Gate de aislamiento de agentes") |
| Claude | `.claude/skills/` | Ninguna adicional conocida; respetar el "Riesgo conocido" (contenido preexistente no gestionado) | `agent:check claude` retorna código 0 **y** cero hallazgos de categoría "adicional" que correspondan a skills de este registro (contenido preexistente ajeno se tolera, se reporta, no bloquea) |
| Orca | No lee ningún destino de skills; permanece fuera del contrato | Ninguna — Orca es configuración personal, no parte del producto | El template debe construir, testear y pasar `agent:check` sin que Orca esté instalado en la máquina |

## Referencia cruzada

- `AGENTS.md` → tabla "Estado transitorio", fila "Distribución de skills".
- `skills/registry.yaml` → bloque `distribution:` y `human_decisions_pending`.
- `docs/product/template-contract.md` → "Decisiones humanas todavía
  necesarias" (actualizado para remitir aquí).
- `docs/sessions/2026-09-16-product-skills/unit-0-portable-skills.md` →
  versión previa de esta decisión, ahora superada por este contrato (la
  arquitectura de destinos no cambió; este documento añade el mecanismo,
  `agent:check` y la matriz de aceptación que faltaban).
