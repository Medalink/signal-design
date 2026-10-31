#!/usr/bin/env node
/**
 * Builds the component tables in AGENTS.md and README.md from one file per entry.
 *
 *   node scripts/doc-tables.mjs           rewrite the tables
 *   node scripts/doc-tables.mjs --check   fail when a table is out of date (no writes)
 *   node scripts/doc-tables.mjs --list <table>   entries in table order, with their `order`
 *
 * An entry is docs/tables/<table>/<id>.txt: `key: value` lines, a blank line, then the
 * Markdown to show. Keys: `order` (a number; leave it out to go to the end) and, in the
 * `agents` table only, `row` (the row label). See CONTRIBUTING.md, "Component docs".
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = resolve(root, "docs/tables");

// Each table: the file that holds it, its header cells, and what an entry's body is.
// `segments`: the body is a piece of a row, and entries with the same `row` join with ", ".
// Otherwise the body is a whole table row.
const TABLES = {
  agents: { file: "AGENTS.md", head: ["Need", "Use"], segments: true },
  conversation: { file: "README.md", head: ["Class", "What"] },
  inputs: { file: "README.md", head: ["Class", "JS hook", "What"] },
  "framework-state": { file: "README.md", head: ["Class", "Render this", "Leave out", "You handle"] },
};

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const cells = (row) => row.replace(/\\\|/g, "").split("|").length - 2;

function parseEntry(table, name) {
  const where = `docs/tables/${table}/${name}`;
  const [first, ...rest] = read(resolve(dir, table, name)).trim().split(/\n\s*\n/);
  const header = first.split("\n").every((line) => /^[a-z]+:( |$)/.test(line));
  const fields = {};
  if (header) for (const line of first.split("\n")) fields[line.slice(0, line.indexOf(":"))] = line.slice(line.indexOf(":") + 1).trim();
  const body = (header ? rest : [first, ...rest]).join("\n\n").trim();
  const known = TABLES[table].segments ? ["order", "row"] : ["order"];
  for (const key of Object.keys(fields)) if (!known.includes(key)) fail(where, `unknown key "${key}" (known: ${known.join(", ")})`);
  const order = fields.order === undefined ? Infinity : Number(fields.order);
  if (Number.isNaN(order)) fail(where, `order "${fields.order}" is not a number`);
  if (TABLES[table].segments && !fields.row) fail(where, 'needs a "row: <label>" line');
  if (!body || body.includes("\n")) fail(where, "the body after the blank line must be one line of Markdown");
  else if (!TABLES[table].segments) {
    const want = TABLES[table].head.length;
    if (!body.startsWith("| ") || !body.endsWith(" |") || cells(body) !== want) fail(where, `the body must be one table row of ${want} cells: | a | b | (escape a pipe inside a cell as \\|)`);
  }
  return { id: name.replace(/\.txt$/, ""), order, row: fields.row, body };
}

function entries(table) {
  const names = existsSync(resolve(dir, table)) ? readdirSync(resolve(dir, table)).filter((f) => f.endsWith(".txt")) : [];
  const list = names.map((name) => parseEntry(table, name));
  const seen = new Map();
  for (const e of list) {
    if (seen.has(e.body)) fail(`docs/tables/${table}/${e.id}.txt`, `same text as ${seen.get(e.body)}.txt`);
    seen.set(e.body, e.id);
  }
  return list.sort((a, b) => (a.order === b.order ? (a.id < b.id ? -1 : 1) : a.order - b.order));
}

function render(table) {
  const { head, segments } = TABLES[table];
  let rows;
  if (segments) {
    const byRow = new Map();
    for (const e of entries(table)) byRow.set(e.row, [...(byRow.get(e.row) ?? []), e.body]);
    rows = [...byRow].map(([label, parts]) => `| ${label} | ${parts.join(", ")} |`);
  } else rows = entries(table).map((e) => e.body);
  return [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows];
}

const begin = (table) => `<!-- doc-table:${table} (generated from docs/tables/${table}/ by scripts/doc-tables.mjs: add or edit a file there, then run pnpm build:docs; do not edit these rows) -->`;
const end = (table) => `<!-- /doc-table:${table} -->`;

const check = process.argv.includes("--check");
const list = process.argv.indexOf("--list");
if (list > 0) {
  const table = process.argv[list + 1];
  if (!TABLES[table]) { console.error(`--list <table>: one of ${Object.keys(TABLES).join(", ")}`); process.exit(1); }
  for (const e of entries(table)) console.log(`${String(e.order === Infinity ? "end" : e.order).padStart(6)}  ${e.id}${e.row ? `  (${e.row})` : ""}`);
  process.exit(errors.length ? (console.error(errors.join("\n")), 1) : 0);
}
if (existsSync(dir)) for (const t of readdirSync(dir)) if (!TABLES[t]) fail(`docs/tables/${t}`, `no such table (known: ${Object.keys(TABLES).join(", ")})`);

const texts = {};
const stale = [];
for (const [table, { file }] of Object.entries(TABLES)) {
  texts[file] ??= read(resolve(root, file));
  const lines = texts[file].split("\n");
  const from = lines.findIndex((l) => l.startsWith(`<!-- doc-table:${table} `));
  const to = lines.indexOf(end(table));
  if (from < 0 || to < from) { fail(file, `markers for table "${table}" are missing: ${begin(table)} ... ${end(table)}`); continue; }
  const next = [begin(table), ...render(table), end(table)];
  const was = lines.slice(from, to + 1);
  if (next.join("\n") === was.join("\n")) continue;
  const line = next.findIndex((l, i) => l !== was[i]);
  stale.push(`${file}: table "${table}" differs from docs/tables/${table}/ at row ${line} of the table`);
  texts[file] = [...lines.slice(0, from), ...next, ...lines.slice(to + 1)].join("\n");
}

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
if (check) {
  if (stale.length) {
    console.error(`${stale.join("\n")}\nThe tables are generated: edit the entry files in docs/tables/, then run \`pnpm build:docs\` and commit the result.`);
    process.exit(1);
  }
  console.log("doc tables: up to date");
} else {
  for (const [file, text] of Object.entries(texts)) if (text !== read(resolve(root, file))) writeFileSync(resolve(root, file), text);
  console.log(stale.length ? `doc tables: rewrote ${stale.length} (${stale.map((s) => s.split('"')[1]).join(", ")})` : "doc tables: already up to date");
}
