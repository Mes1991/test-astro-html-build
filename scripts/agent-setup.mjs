#!/usr/bin/env node
/**
 * CLI: node scripts/agent-setup.mjs <codex|claude|opencode|all>
 * Thin wrapper — see scripts/lib/agent-skills.mjs for the actual logic.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSetup } from './lib/agent-skills.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const target = process.argv[2];

const result = await runSetup({ root, target, log: (line) => console.log(line) });
process.exitCode = result.exitCode;
