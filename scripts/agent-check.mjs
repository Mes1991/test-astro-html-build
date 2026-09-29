#!/usr/bin/env node
/**
 * CLI: node scripts/agent-check.mjs [codex|claude|opencode|all]
 * Target defaults to `all`. Thin wrapper — see scripts/lib/agent-skills.mjs
 * for the actual logic. Read-only: never writes.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheck } from './lib/agent-skills.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const target = process.argv[2] ?? 'all';

const result = await runCheck({ root, target, log: (line) => console.log(line) });
process.exitCode = result.exitCode;
