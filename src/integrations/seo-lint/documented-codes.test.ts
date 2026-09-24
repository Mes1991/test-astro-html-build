import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { Severity } from './lint';

/**
 * Parity gate between the finding codes `seo-lint` really emits and the two
 * documents that publish a canonical list of them.
 *
 * A gate can be added, removed or re-graded in the integration without anything
 * forcing the documentation to follow, and a stale list of codes reads exactly
 * like a current one. This file removes that possibility: a code that does not
 * appear in both canonical lists, with the severity the integration really
 * emits, breaks the test suite.
 *
 * Deliberately *not* covered: prose. A brittle string assertion over an English
 * or Spanish sentence would fail on a rewording that is still true, so the
 * narrative claims around these lists stay human-reviewed.
 *
 * ## What this gate guarantees, and what it does not
 *
 * Guaranteed: parity for the declarations the integration actually contains:
 * object literals reaching a findings collector, every static `PropertyName`
 * form, conditional severities, and carriers reached through an alias chain
 * (a direct import, a rename, one barrel, several barrels) or through `const` /
 * `let` initialisers. Static code strings may also flow through simple variable
 * aliases and named object-literal properties. Anything it cannot resolve
 * within those forms fails closed with a file, line and column.
 *
 * Simple local function returns are followed when a collected call resolves to
 * a function declaration returning an object literal or a resolvable carrier.
 * Calls into excluded/external modules and calls whose return construction
 * cannot be resolved fail closed with `UNRESOLVED_FINDING_PROVENANCE`.
 * Assignments after declaration, destructuring and computed property access
 * are not followed; when one of those shapes reaches a collector, the analysis
 * fails closed rather than treating the value as documented.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
// `src/integrations/seo-lint` -> repository root. Resolved from the module URL,
// never from `process.cwd()`: one CI leg runs on Windows in a path with spaces.
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

/**
 * The integration's entry point. Every module that may declare a finding is
 * discovered from here through the TypeScript module graph, never from a list
 * kept by hand: a file added to the integration tomorrow joins the parity
 * check by being imported, and a dead file nobody imports cannot change what
 * the documentation must say.
 */
const INTEGRATION_ENTRY = path.join('src', 'integrations', 'seo-lint', 'index.ts');

/** The documents that publish a canonical code list, each validated on its own. */
const DOCUMENTS = [
  path.join('skills', 'static-site-seo', 'SKILL.md'),
  path.join('docs', 'product', 'rebrand-checklist.md'),
] as const;

const SEVERITIES: readonly Severity[] = ['fail', 'warn'];

const read = (relative: string): string =>
  readFileSync(path.join(REPO_ROOT, relative), 'utf8');

/**
 * The source side is read through the TypeScript parser, not through patterns
 * over the text.
 *
 * A pattern over the text only sees the shapes it enumerates. A code written in
 * double quotes, a property key written as `'code':` or spaced away from its
 * colon — each is valid TypeScript, and each would simply not be found. Worse,
 * any counter written in the same style shares the same blind spot, so it would
 * agree with the extractor while both were wrong and the parity check stayed
 * green over documentation missing a code. Enumerating variants is a race
 * against whatever somebody writes next.
 *
 * The parser has no such blind spot: it is the one `bun run check` and the build
 * use, so every shape that compiles is a shape it understands. Comments,
 * whitespace, quote style, regex literals and `code:` inside a string stop being
 * cases to handle and become things the grammar already resolved.
 *
 * No separate sentinel is needed, because there is nothing to cross-check: the
 * traversal is fail-closed by construction. Every finding it reaches either
 * yields a code and its severities, or throws naming the file and position.
 * Nothing is skipped.
 */

/** `file:line:column` for a node, so a failure points at the declaration. */
function positionOf(source: ts.SourceFile, node: ts.Node, label: string): string {
  const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
  return `${label}:${line + 1}:${character + 1}`;
}

/**
 * The statically known name of a property, or null when it cannot be known.
 *
 * Covers every `PropertyName` the grammar allows to be a constant: a bare
 * identifier, a quoted key in either quote style, a substitution-free template
 * key, and a computed key whose expression is one of those. A computed key
 * built from a variable returns null, which the caller turns into a failure
 * rather than a silent skip.
 */
function staticPropertyName(name: ts.PropertyName | undefined): string | null {
  if (!name) return null;
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) return name.text;
  if (ts.isNumericLiteral(name)) return name.text;
  if (ts.isComputedPropertyName(name)) {
    const inner = unwrap(name.expression);
    if (ts.isStringLiteral(inner) || ts.isNoSubstitutionTemplateLiteral(inner)) {
      return inner.text;
    }
  }
  return null;
}

/** Strip parentheses and type-only wrappers that never change a value. */
function unwrap(expression: ts.Expression): ts.Expression {
  let current = expression;
  for (;;) {
    if (ts.isParenthesizedExpression(current)) current = current.expression;
    else if (ts.isAsExpression(current)) current = current.expression;
    else if (ts.isTypeAssertionExpression(current)) current = current.expression;
    else if (ts.isSatisfiesExpression(current)) current = current.expression;
    else if (ts.isNonNullExpression(current)) current = current.expression;
    else return current;
  }
}

/** A statically known string, or null. */
function staticString(expression: ts.Expression): string | null {
  const inner = unwrap(expression);
  if (ts.isStringLiteral(inner) || ts.isNoSubstitutionTemplateLiteral(inner)) {
    return inner.text;
  }
  return null;
}

/**
 * Every severity an expression can evaluate to.
 *
 * A conditional yields both of its branches, which is how the build-time
 * contract of `SITEMAP_OUTPUT_MISSING` is derived rather than assumed: the
 * integration writes `sitemapExpected ? 'fail' : 'warn'`, and both grades are
 * real outcomes. Anything not statically resolvable returns null so the caller
 * can fail with a position.
 */
function staticSeverities(expression: ts.Expression): string[] | null {
  const inner = unwrap(expression);
  const literal = staticString(inner);
  if (literal !== null) return [literal];
  if (ts.isConditionalExpression(inner)) {
    const whenTrue = staticSeverities(inner.whenTrue);
    const whenFalse = staticSeverities(inner.whenFalse);
    if (!whenTrue || !whenFalse) return null;
    return [...whenTrue, ...whenFalse];
  }
  return null;
}

export interface FindingDeclaration {
  code: string;
  severities: Severity[];
  /** `file:line:column`, so evidence points somewhere. */
  at: string;
}

export interface Analysis {
  /** code -> every severity that code can be emitted with. */
  bySeverity: Map<string, Set<Severity>>;
  /** Every declaration the analysis resolved. */
  declarations: FindingDeclaration[];
  /** The production modules reached from the entry point, entry-relative. */
  modules: string[];
}

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  resolveJsonModule: true,
};

const slash = (p: string): string => p.replace(/\\/g, '/');

/** A compiler host that serves in-memory modules before touching disk. */
function hostFor(virtual: ReadonlyMap<string, string> | undefined): ts.CompilerHost {
  const host = ts.createCompilerHost(COMPILER_OPTIONS, true);
  if (!virtual) return host;
  const lookup = new Map([...virtual].map(([name, text]) => [slash(name), text]));
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreate) => {
    const text = lookup.get(slash(name));
    return text === undefined
      ? original(name, languageVersion, onError, shouldCreate)
      : ts.createSourceFile(name, text, languageVersion, true, ts.ScriptKind.TS);
  };
  host.fileExists = (name) => lookup.has(slash(name)) || ts.sys.fileExists(name);
  host.readFile = (name) => lookup.get(slash(name)) ?? ts.sys.readFile(name);
  // Without this the resolver never probes for the in-memory modules at all:
  // it checks the containing directory first, finds nothing on disk, and
  // reports every import unresolved — which would leave these cases typed
  // `any` and silently finding nothing.
  const directories = new Set([...lookup.keys()].map((name) => slash(path.dirname(name))));
  host.directoryExists = (name) =>
    directories.has(slash(name)) || ts.sys.directoryExists(name);
  return host;
}

/**
 * Resolve every finding the integration can emit, from its entry point.
 *
 * Discovery is by **emission context**, not by the shape of an object's keys.
 * Asking "does this object literal have a `code` or a `severity` property?"
 * silently skips an object whose keys are all computed, or one composed
 * entirely by spread — precisely the shapes the rejections below exist to
 * catch would never reach them. The question here is "does this expression
 * flow into something that
 * collects findings?", which the type checker answers regardless of how the
 * expression is written. An irrelevant object full of spreads and dynamic keys
 * is simply not in such a position, so it costs nothing.
 *
 * `virtual` overlays in-memory modules for tests; nothing is written to disk.
 */
export function analyze(
  entryFileName: string,
  virtual?: ReadonlyMap<string, string>,
): Analysis {
  const program = ts.createProgram([entryFileName], COMPILER_OPTIONS, hostFor(virtual));
  const checker = program.getTypeChecker();
  const entryDirectory = path.dirname(entryFileName);

  // Reachability comes from the program: a module nobody imports is not here,
  // and a cycle yields each file once, so findings cannot be counted twice.
  const modules = program
    .getSourceFiles()
    .filter(
      (file) =>
        !file.isDeclarationFile &&
        !slash(file.fileName).includes('/node_modules/') &&
        !/\.test\.ts$/.test(file.fileName),
    );
  const analyzed = new Set(modules.map((file) => slash(file.fileName)));

  const declarations: FindingDeclaration[] = [];
  const bySeverity = new Map<string, Set<Severity>>();
  const resolved = new Set<string>();

  const label = (file: ts.SourceFile): string =>
    slash(path.relative(entryDirectory, file.fileName)) || slash(file.fileName);

  const fail = (file: ts.SourceFile, node: ts.Node, message: string): never => {
    throw new Error(`${positionOf(file, node, label(file))}: ${message}`);
  };

  /** The element type of an array-like type, or null. */
  const elementOf = (type: ts.Type): ts.Type | null =>
    checker.getIndexTypeOfType(type, ts.IndexKind.Number) ?? null;

  /** A type is a finding when it carries both of a finding's defining fields. */
  const isFindingType = (type: ts.Type | undefined): boolean =>
    !!type && !!checker.getPropertyOfType(type, 'code') &&
    !!checker.getPropertyOfType(type, 'severity');

  /**
   * Follow an alias to the symbol that really declares the value.
   *
   * `getSymbolAtLocation` on an imported identifier returns the *alias*, whose
   * only declaration is the local `ImportSpecifier`. Checking locality on that
   * says nothing: the specifier is always in the importing file, so every
   * import passed the check, including one whose value is built outside the
   * graph where no literal is ever read. The chain is followed while the symbol
   * is still an alias — a rename, a barrel, several barrels — and a cycle or a
   * dead end returns null for the caller to reject.
   */
  const terminalSymbol = (symbol: ts.Symbol): ts.Symbol | null => {
    const seen = new Set<ts.Symbol>();
    let current = symbol;
    while (current.flags & ts.SymbolFlags.Alias) {
      if (seen.has(current)) return null;
      seen.add(current);
      let next: ts.Symbol | undefined;
      try {
        next = checker.getAliasedSymbol(current);
      } catch {
        return null;
      }
      if (!next || next === current) return null;
      current = next;
    }
    return current;
  };

  /** The symbol whose declaration supplies an expression's runtime value. */
  const valueSymbol = (expression: ts.Expression): ts.Symbol | undefined => {
    const inner = unwrap(expression);
    if (ts.isPropertyAccessExpression(inner)) {
      return checker.getSymbolAtLocation(inner.name) ?? checker.getSymbolAtLocation(inner);
    }
    return checker.getSymbolAtLocation(inner);
  };

  /** Initialiser carried by the declaration forms this analysis supports. */
  const declarationInitialiser = (declaration: ts.Declaration): ts.Expression | null => {
    if (ts.isVariableDeclaration(declaration)) return declaration.initializer ?? null;
    if (ts.isPropertyAssignment(declaration)) return declaration.initializer;
    return null;
  };

  /** Resolve a code string through simple local initialiser/property aliases. */
  const staticCode = (
    file: ts.SourceFile,
    expression: ts.Expression,
    seen: Set<ts.Symbol> = new Set(),
  ): string | null => {
    const literal = staticString(expression);
    if (literal !== null) return literal;

    const symbol = valueSymbol(expression);
    if (!symbol) return null;
    const terminal = terminalSymbol(symbol);
    if (!terminal || seen.has(terminal)) return null;
    seen.add(terminal);

    const values: string[] = [];
    for (const declaration of terminal.getDeclarations() ?? []) {
      const origin = slash(declaration.getSourceFile().fileName);
      if (!analyzed.has(origin)) {
        fail(
          file,
          expression,
          `the code value \`${symbol.getName()}\` is declared in ${path.basename(origin)}, ` +
            'outside the integration module graph.',
        );
      }
      const initialiser = declarationInitialiser(declaration);
      if (!initialiser) continue;
      const value = staticCode(declaration.getSourceFile(), initialiser, seen);
      if (value !== null) values.push(value);
    }
    return values.length === 1 ? values[0] : null;
  };

  /** `<collector>.push(...)` where the collector holds findings. */
  const isCollectorPush = (node: ts.CallExpression): boolean => {
    const callee = node.expression;
    if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== 'push') return false;
    const element = elementOf(checker.getTypeAtLocation(callee.expression));
    return isFindingType(element ?? undefined);
  };

  /** Resolve one object literal already known to be a finding, or throw. */
  const readFinding = (file: ts.SourceFile, object: ts.ObjectLiteralExpression): void => {
    const key = `${slash(file.fileName)}:${object.pos}`;
    if (resolved.has(key)) return;
    resolved.add(key);

    const named = object.properties.map((property) => ({
      property,
      name: ts.isSpreadAssignment(property)
        ? null
        : staticPropertyName(property.name as ts.PropertyName | undefined),
    }));

    for (const { property, name } of named) {
      if (ts.isSpreadAssignment(property)) {
        fail(
          file,
          property,
          'a finding is composed with a spread, so its code cannot be read here. ' +
            'Write the code and severity literally, or teach this analysis to ' +
            'follow the spread.',
        );
      }
      if (name === null) {
        fail(file, property, 'a finding property has a name that is not statically known.');
      }
    }

    const pick = (wanted: string): ts.ObjectLiteralElementLike[] =>
      named.filter(({ name }) => name === wanted).map(({ property }) => property);

    const codeProperties = pick('code');
    const severityProperties = pick('severity');

    if (codeProperties.length > 1) {
      fail(file, codeProperties[1], 'a finding declares `code` more than once.');
    }
    if (severityProperties.length > 1) {
      fail(file, severityProperties[1], 'a finding declares `severity` more than once.');
    }
    if (codeProperties.length === 0) {
      fail(file, object, 'a finding declares a severity but no code.');
    }
    if (severityProperties.length === 0) {
      fail(file, object, 'a finding declares a code but no severity.');
    }

    const codeProperty = codeProperties[0];
    const severityProperty = severityProperties[0];

    if (!ts.isPropertyAssignment(codeProperty)) {
      fail(file, codeProperty, '`code` has no literal value here (shorthand or accessor).');
    }
    if (!ts.isPropertyAssignment(severityProperty)) {
      fail(
        file,
        severityProperty,
        '`severity` has no literal value here (shorthand or accessor).',
      );
    }

    const code = staticCode(file, (codeProperty as ts.PropertyAssignment).initializer);
    if (code === null) {
      fail(
        file,
        codeProperty,
        'the code is not a static string, so it cannot be documented. A finding ' +
          'code must be a literal.',
      );
    }

    const severities = staticSeverities(
      (severityProperty as ts.PropertyAssignment).initializer,
    );
    if (severities === null) {
      fail(
        file,
        severityProperty,
        `the severity of ${code} is not statically resolvable. Teach this analysis ` +
          'the new shape rather than letting the code go unchecked.',
      );
    }

    for (const severity of severities as string[]) {
      if (severity !== 'fail' && severity !== 'warn') {
        fail(
          file,
          severityProperty,
          `${code} is graded "${severity}", which is not a severity.`,
        );
      }
    }

    const grades = severities as Severity[];
    declarations.push({
      code: code as string,
      severities: [...new Set(grades)].sort(),
      at: positionOf(file, codeProperty, label(file)),
    });
    const set = bySeverity.get(code as string) ?? new Set<Severity>();
    for (const severity of grades) set.add(severity);
    bySeverity.set(code as string, set);
  };

  /**
   * An expression handed to a findings collector. Object/array literals resolve
   * directly; other carriers follow symbol aliases and local `const`/`let`
   * initialisers until the constructed value is found.
   *
   * Named object-literal properties are covered too. A local function
   * declaration is followed through each explicit return expression. Any call
   * whose returned finding cannot be resolved fails closed; it never counts as
   * a declaration-free success.
   */
  const readCollected = (
    file: ts.SourceFile,
    node: ts.Expression,
    seen: Set<ts.Symbol> = new Set(),
  ): void => {
    const expression = unwrap(node);

    if (ts.isObjectLiteralExpression(expression)) {
      readFinding(file, expression);
      return;
    }
    if (ts.isArrayLiteralExpression(expression)) {
      for (const element of expression.elements) readCollected(file, element);
      return;
    }
    if (ts.isSpreadElement(expression)) {
      readCollected(file, expression.expression);
      return;
    }

    // A carrier: a variable, a call, a property. It declares no code of its
    // own. Supported declaration initialisers and local function returns are
    // followed below. Every other carrier shape fails closed.
    const type = checker.getTypeAtLocation(expression);
    if (!isFindingType(type) && !isFindingType(elementOf(type) ?? undefined)) {
      fail(
        file,
        expression,
        'an expression reaches a findings collector without being statically a ' +
          'finding, so the code it carries cannot be documented.',
      );
    }

    // Look through `await` and through the call itself to reach the callee, so
    // `findings.push(...(await collect(x)))` is traced to `collect`.
    let origin: ts.Node = expression;
    if (ts.isAwaitExpression(origin)) origin = unwrap(origin.expression);
    const call = ts.isCallExpression(origin) ? origin : null;
    if (ts.isCallExpression(origin)) origin = origin.expression;

    const symbol = valueSymbol(origin as ts.Expression);
    if (!symbol) {
      fail(
        file,
        expression,
        'a finding reaches a collector from an expression whose construction ' +
          'cannot be located, so its code cannot be documented.',
      );
    }

    const name = (symbol as ts.Symbol).getName();
    const terminal = terminalSymbol(symbol as ts.Symbol);
    if (!terminal) {
      fail(
        file,
        expression,
        `\`${name}\` is an alias whose chain does not terminate in a real ` +
          'declaration, so the code it carries cannot be documented.',
      );
    }

    const sites = (terminal as ts.Symbol).getDeclarations() ?? [];
    if (sites.length === 0) {
      fail(
        file,
        expression,
        `\`${name}\` has no terminal declaration this analysis can read, so the ` +
          'code it carries cannot be documented.',
      );
    }
    for (const site of sites) {
      const origin_file = slash(site.getSourceFile().fileName);
      if (!analyzed.has(origin_file)) {
        fail(
          file,
          expression,
          'UNRESOLVED_FINDING_PROVENANCE: ' +
            `expression \`${expression.getText(file)}\` cannot be resolved locally; ` +
            `\`${name}\` is declared in ${path.basename(origin_file)}, outside the integration module graph, ` +
            'so the code it returns or carries cannot be documented.',
        );
      }
    }

    if (seen.has(terminal as ts.Symbol)) {
      fail(file, expression, `\`${name}\` forms a value-initialiser cycle.`);
    }
    const nextSeen = new Set(seen).add(terminal as ts.Symbol);
    if (call) {
      const returns: { file: ts.SourceFile; expression: ts.Expression }[] = [];
      for (const site of sites) {
        if (!ts.isFunctionDeclaration(site) || !site.body) continue;
        const visitReturns = (node: ts.Node): void => {
          if (node !== site && ts.isFunctionLike(node)) return;
          if (ts.isReturnStatement(node) && node.expression) {
            returns.push({ file: site.getSourceFile(), expression: node.expression });
            return;
          }
          ts.forEachChild(node, visitReturns);
        };
        visitReturns(site.body);
      }
      if (returns.length === 0) {
        fail(
          file,
          expression,
          'UNRESOLVED_FINDING_PROVENANCE: ' +
            `the return value of expression \`${expression.getText(file)}\` cannot be ` +
            'resolved to a local finding literal or carrier.',
        );
      }
      for (const returned of returns) {
        readCollected(returned.file, returned.expression, nextSeen);
      }
      return;
    }

    const initialisers = sites.flatMap((site) => {
      const initialiser = declarationInitialiser(site);
      return initialiser ? [{ file: site.getSourceFile(), initialiser }] : [];
    });
    if (initialisers.length > 0) {
      for (const next of initialisers) readCollected(next.file, next.initialiser, nextSeen);
      return;
    }

    if (sites.some((site) => ts.isVariableDeclaration(site) || ts.isPropertyAssignment(site))) {
      fail(
        file,
        expression,
        `\`${name}\` reaches a findings collector without a supported declaration initialiser.`,
      );
    }
    fail(
      file,
      expression,
      'UNRESOLVED_FINDING_PROVENANCE: ' +
        `expression \`${expression.getText(file)}\` has no supported local value source.`,
    );
  };

  for (const file of modules) {
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && isCollectorPush(node)) {
        for (const argument of node.arguments) readCollected(file, argument);
      }
      // Catches findings that reach a collector without a call of their own —
      // `findings: [{ … }]`, `return [{ … }]` — by asking what the position
      // expects rather than what the object happens to look like.
      if (
        ts.isObjectLiteralExpression(node) &&
        isFindingType(checker.getContextualType(node))
      ) {
        readFinding(file, node);
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }

  return {
    bySeverity,
    declarations,
    modules: modules.map(label).sort(),
  };
}

export interface SourceCodes {
  bySeverity: Map<string, Set<Severity>>;
  declarations: FindingDeclaration[];
  modules: string[];
}

let cached: SourceCodes | null = null;

/** Derive the live codes and severities from the whole integration. */
export function sourceCodes(): SourceCodes {
  cached ??= analyze(path.join(REPO_ROOT, INTEGRATION_ENTRY));
  return cached;
}

/**
 * The codes the source emits at exactly one severity, sorted.
 *
 * Conditional codes are excluded on purpose: a code the build can grade either
 * way is not a `fail` code that also happens to warn. Listing it in both flat
 * lists would document it as unconditional twice over, which is the false
 * statement this file exists to prevent. They have their own region below.
 */
function realCodes(severity: Severity): string[] {
  return [...sourceCodes().bySeverity]
    .filter(([, severities]) => severities.size === 1 && severities.has(severity))
    .map(([code]) => code)
    .sort();
}

/** The codes whose severity the integration decides at build time. */
function realConditional(): Map<string, Set<Severity>> {
  return new Map([...sourceCodes().bySeverity].filter(([, s]) => s.size > 1));
}

/** Comparable, order-stable form of a code -> severities map. */
const asEntries = (map: Map<string, Set<Severity>>): [string, Severity[]][] =>
  [...map]
    .map(([code, severities]): [string, Severity[]] => [code, [...severities].sort()])
    .sort((a, b) => a[0].localeCompare(b[0]));

/**
 * The text a document marks as canonical for one region.
 *
 * Explicit markers rather than "the codes on the line after the table": the
 * region is the document's own declaration of what is canonical, so prose, a
 * worked example or a code named in a footnote cannot leak into it, and a list
 * that outgrows one line or one Markdown shape keeps working.
 */
function regionOf(markdown: string, name: string): string {
  const open = `<!-- seo-lint-codes:${name} -->`;
  const close = `<!-- /seo-lint-codes:${name} -->`;
  const opens = markdown.split(open).length - 1;
  const closes = markdown.split(close).length - 1;
  if (opens !== 1 || closes !== 1) {
    throw new Error(
      `Expected exactly one ${open} … ${close} region, found ${opens} opening and ` +
        `${closes} closing markers. Two regions would let one of them go unchecked.`,
    );
  }
  const start = markdown.indexOf(open) + open.length;
  const end = markdown.indexOf(close);
  if (end < start) {
    throw new Error(`${close} appears before ${open}.`);
  }
  return markdown.slice(start, end);
}

/** The codes a document publishes as unconditionally `fail` or `warn`. */
export function documentedCodes(markdown: string, severity: Severity): string[] {
  return [...regionOf(markdown, severity).matchAll(/`([A-Z][A-Z0-9_]*)`/g)].map((m) => m[1]);
}

/**
 * The conditional codes a document publishes, with every severity it claims
 * each one can take.
 *
 * An entry opens with its code and owns every `fail`/`warn` token until the
 * next code, so the prose stating *when* each severity applies is also the
 * machine-readable declaration of *which* severities exist. That keeps the
 * condition and the grades in one sentence instead of letting a prose footnote
 * drift away from a list nobody checks it against.
 */
export function documentedConditional(markdown: string): Map<string, Set<Severity>> {
  const out = new Map<string, Set<Severity>>();
  let current: string | null = null;
  for (const m of regionOf(markdown, 'conditional').matchAll(
    /`([A-Z][A-Z0-9_]*)`|`(fail|warn)`/g,
  )) {
    if (m[1]) {
      if (out.has(m[1])) {
        throw new Error(
          `${m[1]} opens a second entry in the conditional region. One entry per code, ` +
            'or a severity can land on the wrong one.',
        );
      }
      current = m[1];
      out.set(current, new Set<Severity>());
      continue;
    }
    if (!current) {
      throw new Error(
        `The conditional region grades \`${m[2]}\` before naming any code. Each entry ` +
          'must open with its code.',
      );
    }
    out.get(current)!.add(m[2] as Severity);
  }
  return out;
}

/** Every code a document publishes, mapped to the severities it claims for it. */
export function documentedSeverityMap(markdown: string): Map<string, Set<Severity>> {
  const out = new Map<string, Set<Severity>>();
  const add = (code: string, severity: Severity): void => {
    const set = out.get(code) ?? new Set<Severity>();
    set.add(severity);
    out.set(code, set);
  };
  for (const severity of SEVERITIES) {
    for (const code of documentedCodes(markdown, severity)) add(code, severity);
  }
  for (const [code, severities] of documentedConditional(markdown)) {
    for (const severity of severities) add(code, severity);
  }
  return out;
}

/**
 * A throwaway module graph, held in memory. Nothing reaches disk, so these
 * cases leave no fixture behind and cannot drift from the real analysis: it is
 * the same `analyze` the parity checks use.
 */
const VIRTUAL_ROOT = slash(path.join(REPO_ROOT, '__virtual__'));
const virtualPath = (name: string): string => `${VIRTUAL_ROOT}/${name}`;

/** The finding contract, as the real `lint.ts` declares it. */
const VIRTUAL_CONTRACT = `
export type Severity = 'fail' | 'warn';
export interface Finding { code: string; severity: Severity; message?: string }
`;

/** Build a graph whose entry is `entry.ts`, with the contract always available. */
function virtualGraph(files: Record<string, string>): Analysis {
  const modules = new Map<string, string>([
    [virtualPath('contract.ts'), VIRTUAL_CONTRACT],
    ...Object.entries(files).map(([name, text]): [string, string] => [
      virtualPath(name),
      text,
    ]),
  ]);
  return analyze(virtualPath('entry.ts'), modules);
}

/** An entry that collects findings, wrapping the body under test. */
const collecting = (body: string): string => `
import type { Finding } from './contract';
export function emit(): Finding[] {
  const findings: Finding[] = [];
${body}
  return findings;
}
`;

describe('seo-lint finding analysis', () => {
  it('resolves every declaration reachable from the integration entry', () => {
    // The analysis throws rather than skipping, so reaching this line is itself
    // the coverage guarantee. What is asserted here is that it found real work:
    // an analysis that silently resolved nothing — a moved entry point, types
    // degraded to `any` — is the one way a green parity check could mean
    // nothing. The parity checks below are the second net: they compare against
    // documents naming 21 real codes, so a zero-finding run cannot pass either.
    const { declarations, bySeverity, modules } = sourceCodes();
    expect(declarations.length).toBeGreaterThan(20);
    expect(bySeverity.size).toBeGreaterThan(20);
    for (const declaration of declarations) {
      expect(declaration.severities.length).toBeGreaterThan(0);
      expect(declaration.at).toMatch(/^[\w./-]+\.ts:\d+:\d+$/);
    }
    // The graph reaches beyond the integration folder, which is the point of
    // walking imports instead of listing three files.
    expect(modules).toContain('lint.ts');
    expect(modules).toContain('routes.ts');
    expect(modules.some((m) => m.includes('lib/seo/'))).toBe(true);
    expect(modules.every((m) => !m.includes('node_modules'))).toBe(true);
    expect(modules.every((m) => !m.endsWith('.test.ts'))).toBe(true);
  });

  it('finds the multi-line and conditional declarations', () => {
    const { bySeverity } = sourceCodes();
    // Written across several lines in index.ts.
    expect([...(bySeverity.get('OG_IMAGE_404') ?? [])].sort()).toEqual(['fail']);
    // Severity is `sitemapExpected ? 'fail' : 'warn'` — both are real outcomes,
    // derived from the conditional rather than assumed from the house style.
    expect([...(bySeverity.get('SITEMAP_OUTPUT_MISSING') ?? [])].sort()).toEqual([
      'fail',
      'warn',
    ]);
  });

  // Every `PropertyName` the grammar allows as a constant. The integration
  // writes only the first of these today; the convention is not the contract,
  // so none of the rest may ever go missing instead of failing.
  it.each([
    ['a bare key', "findings.push({ code: 'C', severity: 'fail' });"],
    ['a spaced colon', "findings.push({ code : 'C', severity : 'fail' });"],
    ['a comment before the colon', "findings.push({ code /* k */: 'C', severity: 'fail' });"],
    ['a single-quoted key', "findings.push({ 'code': 'C', severity: 'fail' });"],
    ['a double-quoted key', 'findings.push({ "code": "C", severity: "fail" });'],
    ['a template-literal key', 'findings.push({ [`code`]: `C`, severity: `fail` });'],
    ['a computed string key', "findings.push({ ['code']: 'C', ['severity']: 'fail' });"],
    ['severity declared first', "findings.push({ severity: 'fail', code: 'C' });"],
    ['line breaks', "findings.push({\n  code:\n    'C',\n  severity:\n    'fail',\n});"],
    ['no push at all', "  return [{ code: 'C', severity: 'fail' }];"],
  ])('resolves a declaration written with %s', (_form, body) => {
    const { declarations } = virtualGraph({ 'entry.ts': collecting(body) });
    expect(declarations).toEqual([
      { code: 'C', severities: ['fail'], at: expect.stringMatching(/^entry\.ts:\d+:\d+$/) },
    ]);
  });

  it('resolves a conditional severity to both of its branches', () => {
    const { declarations } = virtualGraph({
      'entry.ts': collecting(
        'const expected = Boolean(1);\n' +
          "findings.push({ code: 'C', severity: expected ? 'fail' : 'warn' });",
      ),
    });
    expect(declarations[0].severities).toEqual(['fail', 'warn']);
  });

  it.each([
    ['a line comment', "// findings.push({ code: 'GHOST', severity: 'fail' });"],
    ['a block comment', "/* findings.push({ code: 'GHOST', severity: 'fail' }); */"],
    ['a string', "const help = \"use code: 'GHOST', severity: 'fail'\";"],
    ['a template literal', "const help = `code: 'GHOST', severity: 'fail'`;"],
    ['a regex literal', 'const re = /content="code: \'GHOST\'"/i;'],
  ])('does not read a declaration out of %s', (_where, body) => {
    expect(virtualGraph({ 'entry.ts': collecting(body) }).declarations).toEqual([]);
  });

  it('ignores an opaque object that never reaches a findings collector', () => {
    // The counterpart of discovery by context: spreads and dynamic keys are
    // only a problem where a finding is expected. Elsewhere they are ordinary
    // code, and flagging them would make this gate unusable.
    const { declarations } = virtualGraph({
      'entry.ts': collecting(
        'const base = {} as Record<string, string>;\n' +
          'const key = String(1);\n' +
          'const unrelated = { ...base, [key]: 1 };\n' +
          'void unrelated;\n' +
          "findings.push({ code: 'C', severity: 'fail' });",
      ),
    });
    expect(declarations.map((d) => d.code)).toEqual(['C']);
  });

  it.each([
    [
      'every key computed dynamically',
      "const k = String(1);\nconst s = String(2);\nfindings.push({ [k]: 'NEW_CODE', [s]: 'fail' } as unknown as Finding);",
      /not statically known/,
    ],
    [
      'a finding composed only by spread',
      'const other = null as unknown as Finding;\nfindings.push({ ...other });',
      /composed with a spread/,
    ],
    [
      'a spread combined with literal properties',
      "const other = null as unknown as Finding;\nfindings.push({ ...other, severity: 'fail' });",
      /composed with a spread/,
    ],
    [
      'an identifier with no static resolution',
      'const loose = null as any;\nfindings.push(loose);',
      /without being statically a finding/,
    ],
    [
      'an interpolated code',
      "const kind = String(1);\nfindings.push({ code: `PREFIX_${kind}`, severity: 'fail' });",
      /not a static string/,
    ],
    [
      'a code with no severity',
      "findings.push({ code: 'C' } as unknown as Finding);",
      /declares a code but no severity/,
    ],
    [
      'a severity with no code',
      "findings.push({ severity: 'fail' } as unknown as Finding);",
      /declares a severity but no code/,
    ],
    [
      'a severity behind a variable',
      "const grade = 'fail' as 'fail';\nfindings.push({ code: 'C', severity: grade });",
      /not statically resolvable/,
    ],
    [
      'a shorthand code',
      "const code = String(1);\nfindings.push({ code, severity: 'fail' });",
      /shorthand or accessor/,
    ],
  ])('fails closed, naming the position, on %s', (_shape, body, expected) => {
    const build = () => virtualGraph({ 'entry.ts': collecting(body) });
    expect(build).toThrow(expected);
    expect(build).toThrow(/entry\.ts:\d+:\d+/);
  });
});

describe('seo-lint module graph', () => {
  it('picks up a new source file the moment it is imported', () => {
    const { bySeverity, modules } = virtualGraph({
      'entry.ts': `
import { extra } from './extra';
import type { Finding } from './contract';
export function emit(): Finding[] {
  const findings: Finding[] = [];
  findings.push({ code: 'KNOWN', severity: 'fail' });
  findings.push(...extra());
  return findings;
}
`,
      'extra.ts': collecting("findings.push({ code: 'NEW_CODE', severity: 'warn' });").replace(
        'export function emit',
        'export function extra',
      ),
    });
    // This is what "real but undocumented" looks like before it reaches the
    // documents: the new module's code is in the real set straight away.
    expect([...bySeverity.keys()].sort()).toEqual(['KNOWN', 'NEW_CODE']);
    expect(modules).toContain('extra.ts');
  });

  it('ignores a source file nobody imports', () => {
    const { bySeverity, modules } = virtualGraph({
      'entry.ts': collecting("findings.push({ code: 'KNOWN', severity: 'fail' });"),
      // Present in the overlay, unreachable from the entry — dead code must not
      // be able to change what the canonical documents are required to say.
      'orphan.ts': collecting("findings.push({ code: 'ORPHAN_CODE', severity: 'fail' });"),
    });
    expect([...bySeverity.keys()]).toEqual(['KNOWN']);
    expect(modules).not.toContain('orphan.ts');
  });

  it('fails closed on an imported module that builds a finding by spread', () => {
    expect(() =>
      virtualGraph({
        'entry.ts': `
import { extra } from './extra';
import type { Finding } from './contract';
export function emit(): Finding[] {
  const findings: Finding[] = [];
  findings.push(...extra());
  return findings;
}
`,
        'extra.ts': `
import type { Finding } from './contract';
export function extra(): Finding[] {
  const findings: Finding[] = [];
  const other = null as unknown as Finding;
  findings.push({ ...other });
  return findings;
}
`,
      }),
    ).toThrow(/extra\.ts:\d+:\d+: a finding is composed with a spread/);
  });

  // A value handed to a collector declares no code of its own, so the symbol is
  // followed to the declaration that really binds it rather than to the local
  // `import` line, which is always "inside" and proves nothing.
  //
  // These cases cover alias chains only: a direct import, a rename, one barrel,
  // several barrels. A *value* rebinding is not an alias and is not covered —
  // see the known limitation documented on `readCollected`.
  const vendor = [
    "import type { Finding } from '../contract';",
    "export const vendored: Finding = { code: 'VENDORED', severity: 'fail' };",
    "export const vendoredMany: Finding[] = [vendored];",
  ].join('\n');

  it.each([
    [
      'a direct import',
      "import { local } from './near';",
      'findings.push(local);',
      { 'near.ts': "import type { Finding } from './contract';\nexport const local: Finding = { code: 'NEAR', severity: 'fail' };" },
    ],
    [
      'a renamed import',
      "import { local as aliased } from './near';",
      'findings.push(aliased);',
      { 'near.ts': "import type { Finding } from './contract';\nexport const local: Finding = { code: 'NEAR', severity: 'fail' };" },
    ],
    [
      'a barrel re-export',
      "import { local } from './barrel';",
      'findings.push(local);',
      {
        'near.ts': "import type { Finding } from './contract';\nexport const local: Finding = { code: 'NEAR', severity: 'fail' };",
        'barrel.ts': "export { local } from './near';",
      },
    ],
    [
      'two chained barrels with a rename',
      "import { far } from './outer';",
      'findings.push(far);',
      {
        'near.ts': "import type { Finding } from './contract';\nexport const local: Finding = { code: 'NEAR', severity: 'fail' };",
        'inner.ts': "export { local as mid } from './near';",
        'outer.ts': "export { mid as far } from './inner';",
      },
    ],
  ])('accepts a carrier reached through %s', (_form, imports, push, extra) => {
    const { bySeverity } = virtualGraph({
      'entry.ts': `
import type { Finding } from './contract';
${imports}
export function emit(): Finding[] {
  const findings: Finding[] = [];
  ${push}
  return findings;
}
`,
      ...extra,
    });
    // The code is documented from where it is *built*, not from the push.
    expect([...bySeverity.keys()]).toEqual(['NEAR']);
  });

  it('follows a finding through const and let initialisers', () => {
    const { bySeverity } = virtualGraph({
      'entry.ts': collecting(
        "const original: Finding = { code: 'INITIALISED', severity: 'fail' };\n" +
          'let alias: Finding = original;\n' +
          'findings.push(alias);',
      ),
    });
    expect([...bySeverity.keys()]).toEqual(['INITIALISED']);
  });

  it('follows a code through a variable and an object-literal property', () => {
    const { bySeverity } = virtualGraph({
      'entry.ts': collecting(
        "const raw = 'ALIASED_CODE';\n" +
          'const codes = { undocumented: raw };\n' +
          "findings.push({ code: codes.undocumented, severity: 'warn' });",
      ),
    });
    expect([...bySeverity.keys()]).toEqual(['ALIASED_CODE']);
  });

  it('follows a collected call through a simple local function return', () => {
    const { bySeverity } = virtualGraph({
      'entry.ts': collecting(
        "function makeLocal(): Finding {\n" +
          "  const local = { code: 'LOCAL_RETURN', severity: 'fail' as const };\n" +
          '  return local;\n' +
          '}\n' +
          'findings.push(makeLocal());',
      ),
    });
    expect([...bySeverity.keys()]).toEqual(['LOCAL_RETURN']);
  });

  it('fails closed when a local wrapper returns an external call result', () => {
    const build = () => virtualGraph({
      'entry.ts': `
import type { Finding } from './contract';
import { wrap } from './bridge';
export function emit(): Finding[] {
  const findings: Finding[] = [];
  const local = wrap();
  findings.push(local);
  return findings;
}
`,
      'bridge.ts': `
import type { Finding } from './contract';
import { make } from './node_modules/vendor';
export function wrap(): Finding { return make(); }
`,
      'node_modules/vendor.ts': `
import type { Finding } from '../contract';
export function make(): Finding {
  return { code: 'EXTERNAL_ESCAPE', severity: 'fail' };
}
`,
    });
    expect(build).toThrow(/UNRESOLVED_FINDING_PROVENANCE/);
    expect(build).toThrow(/bridge\.ts:\d+:\d+/);
    expect(build).toThrow(/expression `make\(\)`/);
  });

  it('rejects an external finding rebound through a local initialiser', () => {
    const build = () => virtualGraph({
      'entry.ts': `
import type { Finding } from './contract';
import { vendored } from './node_modules/vendor';
export function emit(): Finding[] {
  const findings: Finding[] = [];
  const local: Finding = vendored;
  findings.push(local);
  return findings;
}
`,
      'node_modules/vendor.ts': vendor,
    });
    expect(build).toThrow(
      /`vendored` is declared in vendor\.ts, outside the integration module graph/,
    );
  });

  it.each([
    [
      'a Finding imported from outside the graph',
      "import { vendored } from './node_modules/vendor';",
      'findings.push(vendored);',
      /`vendored` is declared in vendor\.ts, outside the integration module graph/,
    ],
    [
      'a Finding[] imported from outside the graph',
      "import { vendoredMany } from './node_modules/vendor';",
      'findings.push(...vendoredMany);',
      /`vendoredMany` is declared in vendor\.ts, outside the integration module graph/,
    ],
    [
      'an external carrier re-exported by a local barrel',
      "import { vendored } from './launder';",
      'findings.push(vendored);',
      /`vendored` is declared in vendor\.ts, outside the integration module graph/,
    ],
    [
      'an expression with no symbol at all',
      "import { vendored } from './node_modules/vendor';",
      'findings.push((0, vendored));',
      /construction cannot be located/,
    ],
  ])('fails closed on %s, reached through an alias chain', (_form, imports, push, expected) => {
    const build = () =>
      virtualGraph({
        'entry.ts': `
import type { Finding } from './contract';
${imports}
export function emit(): Finding[] {
  const findings: Finding[] = [];
  ${push}
  return findings;
}
`,
        // `/node_modules/` in the path is what puts this module outside the
        // analysed set, exactly as a real dependency would be.
        'node_modules/vendor.ts': vendor,
        'launder.ts': "export { vendored } from './node_modules/vendor';",
      });
    expect(build).toThrow(expected);
    expect(build).toThrow(/entry\.ts:\d+:\d+/);
  });

  it('fails closed on an alias cycle instead of looping', () => {
    // A circular alias never acquires a type, so it is rejected one step before
    // locality is asked — which is why this asserts the type message rather
    // than the alias one. The visited-set guard in `terminalSymbol` stays as
    // depth: it is what keeps a chain the checker *does* resolve from spinning.
    const build = () =>
      virtualGraph({
        'entry.ts': `
import type { Finding } from './contract';
import { looped } from './ring-a';
export function emit(): Finding[] {
  const findings: Finding[] = [];
  findings.push(looped as unknown as Finding);
  return findings;
}
`,
        'ring-a.ts': "export { looped } from './ring-b';",
        'ring-b.ts': "export { looped } from './ring-a';",
      });
    expect(build).toThrow(/without being statically a finding/);
    expect(build).toThrow(/entry\.ts:\d+:\d+/);
  });

  it('terminates on a circular graph without counting a finding twice', () => {
    const { declarations, bySeverity } = virtualGraph({
      'entry.ts': `
import { b } from './b';
import type { Finding } from './contract';
export function a(): Finding[] {
  const findings: Finding[] = [];
  findings.push({ code: 'CYCLE_A', severity: 'fail' });
  findings.push(...b());
  return findings;
}
export function emit(): Finding[] { return a(); }
`,
      'b.ts': `
import { a } from './entry';
import type { Finding } from './contract';
export function b(): Finding[] {
  const findings: Finding[] = [];
  findings.push({ code: 'CYCLE_B', severity: 'warn' });
  if (false) findings.push(...a());
  return findings;
}
`,
    });
    expect(declarations.map((d) => d.code).sort()).toEqual(['CYCLE_A', 'CYCLE_B']);
    expect(bySeverity.size).toBe(2);
  });
});

describe.each(DOCUMENTS)('%s documents the real seo-lint codes', (document) => {
  const markdown = read(document);

  it.each(SEVERITIES)('lists exactly the real unconditional `%s` codes', (severity) => {
    const documented = documentedCodes(markdown, severity);
    const deduplicated = [...new Set(documented)].sort();

    // A code listed twice inflates the list, so an absent one can hide behind a
    // matching total. Caught before the comparison, which works on sets.
    const duplicates = [
      ...new Set(documented.filter((code, i) => documented.indexOf(code) !== i)),
    ].sort();
    expect(duplicates, `${document} lists these ${severity} codes more than once`).toEqual(
      [],
    );

    // Both directions, on sorted arrays so the diff names the offending codes:
    // a code the source emits but the document omits (shown as expected-only),
    // and a code the document claims that the source no longer emits (shown as
    // received-only), are the same class of drift and appear together.
    expect(
      deduplicated,
      `${document} must list exactly the unconditional ${severity} codes the ` +
        'integration emits',
    ).toEqual(realCodes(severity));
  });

  it('declares exactly the real conditional codes, with both their severities', () => {
    expect(
      asEntries(documentedConditional(markdown)),
      `${document} must declare every code whose severity the build decides, and for ` +
        'each one exactly the severities it can take',
    ).toEqual(asEntries(realConditional()));
  });

  it('grades every code with the severity the integration emits', () => {
    // The set comparisons above already catch a code in the wrong list, but they
    // report it as two unrelated absences. This names the disagreement itself:
    // the code, what the document claims, and what the integration does.
    const real = sourceCodes().bySeverity;
    const mismatches = [...documentedSeverityMap(markdown)]
      .filter(([code]) => real.has(code))
      .map(([code, severities]) => ({
        code,
        documented: [...severities].sort(),
        real: [...real.get(code)!].sort(),
      }))
      .filter((m) => m.documented.join() !== m.real.join())
      .sort((a, b) => a.code.localeCompare(b.code));

    expect(
      mismatches,
      `${document} grades these codes differently from the integration`,
    ).toEqual([]);
  });
});
