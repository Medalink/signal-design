#!/usr/bin/env node
/**
 * Fails when a tracked text file is not valid UTF-8, or holds U+FFFD (what a lossy
 * decode leaves behind). Commit 0594b95 wrote invalid bytes into two CSS comments.
 *
 *   node scripts/check-utf8.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const where = ["src", "scripts", "showcase", "docs", "changes", "bin", "e2e", "examples", "skills", "*.md"];
const text = /\.(css|js|jsx|mjs|cjs|ts|tsx|html|md|txt|json|svg|ya?ml|toml)$/;
const strict = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
const lossy = new TextDecoder("utf-8", { ignoreBOM: true });

const files = execFileSync("git", ["-C", root, "ls-files", "-z", "--", ...where], { encoding: "utf8", maxBuffer: 1 << 26 })
  .split("\0").filter((f) => text.test(f));

const bad = [];
for (const file of files) {
  const bytes = readFileSync(resolve(root, file));
  let valid = true;
  try { strict.decode(bytes); } catch { valid = false; }
  const decoded = lossy.decode(bytes);
  const at = decoded.indexOf(String.fromCharCode(0xfffd));
  if (valid && at < 0) continue;
  const line = decoded.slice(0, at).split("\n").length;
  bad.push(`${file}:${line}: ${valid ? "contains U+FFFD" : "invalid UTF-8 byte"}`);
}

if (bad.length) {
  console.error(`${bad.join("\n")}\nRewrite those characters as UTF-8 (or plain ASCII) and save the file as UTF-8.`);
  process.exit(1);
}
console.log(`utf-8: ${files.length} files ok`);
