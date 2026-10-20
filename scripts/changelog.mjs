/**
 * Fold changelog fragments into CHANGELOG.md.
 *
 * Each pull request adds its entry as its own file, changes/<branch-name>.md,
 * instead of editing CHANGELOG.md, so two pull requests never touch the same
 * lines. A fragment is one or more `### Added|Changed|Fixed|Removed` headings,
 * each followed by bullets in the CHANGELOG style.
 *
 *   node scripts/changelog.mjs           move every fragment under ## Unreleased
 *   node scripts/changelog.mjs --check   fail on a malformed fragment (CI)
 *
 * Run it when cutting a release, then rename ## Unreleased to the version.
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = resolve(root, "changes");
const changelogPath = resolve(root, "CHANGELOG.md");
const check = process.argv.includes("--check");
const KINDS = ["Changed", "Added", "Fixed", "Removed"];

/** Parse "### Kind" sections into { Kind: "- bullet\n  wrapped\n" }. */
function sections(text, where) {
  const out = {};
  let kind = null;
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const heading = line.match(/^### (.+)$/);
    if (heading) {
      kind = heading[1].trim();
      if (!KINDS.includes(kind)) throw new Error(`${where}: unknown heading "### ${kind}" (use ${KINDS.join(", ")})`);
      out[kind] ??= "";
    } else if (line.trim()) {
      if (!kind) throw new Error(`${where}: text before the first ### heading`);
      out[kind] += line + "\n";
    }
  }
  if (!Object.values(out).some((v) => v.trim())) throw new Error(`${where}: no entries`);
  for (const [k, v] of Object.entries(out)) if (v && !v.startsWith("- ")) throw new Error(`${where}: ### ${k} must start with a "- " bullet`);
  return out;
}

const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").sort() : [];
const fragments = [];
let bad = 0;
for (const file of files) {
  try {
    fragments.push({ file, parts: sections(readFileSync(resolve(dir, file), "utf8"), `changes/${file}`) });
  } catch (error) {
    bad++;
    console.log(`FAIL ${error.message}`);
  }
}
if (check || bad) {
  if (!bad) console.log(`${fragments.length} changelog fragment(s) ok`);
  process.exit(bad ? 1 : 0);
}
if (!fragments.length) {
  console.log("No fragments in changes/.");
  process.exit(0);
}

const changelog = readFileSync(changelogPath, "utf8").replace(/\r\n/g, "\n");
const start = changelog.indexOf("## Unreleased\n");
if (start < 0) throw new Error("CHANGELOG.md has no ## Unreleased section");
const bodyStart = start + "## Unreleased\n".length;
const next = changelog.indexOf("\n## ", bodyStart);
const bodyEnd = next < 0 ? changelog.length : next + 1;
const unreleased = changelog.slice(bodyStart, bodyEnd).trim() ? sections(changelog.slice(bodyStart, bodyEnd), "CHANGELOG.md ## Unreleased") : {};

for (const { parts } of fragments) for (const [kind, bullets] of Object.entries(parts)) unreleased[kind] = (unreleased[kind] ?? "") + bullets;
const body = KINDS.filter((k) => unreleased[k]?.trim()).map((k) => `\n### ${k}\n${unreleased[k]}`).join("");
writeFileSync(changelogPath, changelog.slice(0, bodyStart) + body + "\n" + changelog.slice(bodyEnd));
for (const { file } of fragments) rmSync(resolve(dir, file));
console.log(`Folded ${fragments.length} fragment(s) into CHANGELOG.md ## Unreleased: ${fragments.map((f) => f.file).join(", ")}`);
