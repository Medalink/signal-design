/**
 * The production showcase build, as GitHub Pages serves it.
 *
 *   node scripts/check-showcase-build.mjs
 *
 * The dev server keeps every import, so only a build shows what a bundler
 * drops (the package marks only CSS as side-effect free). This builds the
 * showcase with SHOWCASE_BASE=/signal-design/ into a temp dir, serves it under
 * that subpath, and opens every page in Chromium. Each page must have the
 * showcase bar, example pages must carry the Mock badge, and nothing may log a
 * console error or fail to load. Each page opens with and without its .html.
 */
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { build } from "vite";
import { ALL, EXAMPLES, HOME, keyOf } from "../showcase/pages.js";

const BASE = "/signal-design/";
const showcase = fileURLToPath(new URL("../showcase/", import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml", ".json": "application/json" };

let failures = 0;
const fail = (where, message) => {
  failures++;
  console.log(`FAIL ${where}: ${message}`);
};

const out = mkdtempSync(join(tmpdir(), "signal-showcase-"));
let server;
let browser;
try {
  const started = Date.now();
  process.env.SHOWCASE_BASE = BASE;
  await build({ root: showcase, configFile: resolve(showcase, "vite.config.js"), logLevel: "warn", build: { outDir: out, emptyOutDir: true } });
  console.log(`ok   built the showcase under ${BASE} in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  // GitHub Pages: files as they are, a missing .html added, a directory to its index.html.
  const resolveFile = (pathname) => {
    if (!pathname.startsWith(BASE)) return null;
    const rel = normalize(decodeURIComponent(pathname.slice(BASE.length)));
    if (rel.startsWith("..")) return null;
    const file = join(out, rel);
    for (const candidate of [file, `${file}.html`, join(file, "index.html")]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
    return null;
  };
  server = createServer((req, res) => {
    const file = resolveFile(new URL(req.url, "http://localhost").pathname);
    if (!file) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const origin = `http://127.0.0.1:${server.address().port}`;

  browser = await chromium.launch();
  const visit = async (path, check) => {
    const where = `${BASE}${path}`;
    const page = await browser.newPage();
    const problems = [];
    page.on("console", (m) => m.type() === "error" && problems.push(`console error: ${m.text()}`));
    page.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
    page.on("requestfailed", (r) => problems.push(`request failed: ${r.url()}`));
    try {
      await page.goto(`${origin}${BASE}${path}`, { waitUntil: "networkidle" });
      const bar = await page.waitForSelector(".vp-bar", { timeout: 3000 }).catch(() => null);
      if (!bar) problems.push("no .vp-bar in the built page");
      else problems.push(...(await check(page)));
    } catch (error) {
      problems.push(error.message.split("\n")[0]);
    } finally {
      await page.close();
    }
    for (const problem of problems) fail(where, problem);
    if (!problems.length) console.log(`ok   ${where}`);
  };

  const barOf = (entry) => async (page) => {
    const example = EXAMPLES.includes(entry);
    const bar = await page.evaluate(() => ({
      kind: document.querySelector(".vp-bar")?.dataset.kind,
      badge: document.querySelector(".vp-bar .sd-badge")?.textContent,
      title: document.querySelector(".vp-title")?.textContent,
      current: document.querySelector('#vp-pages [aria-current="page"]')?.getAttribute("href"),
    }));
    const problems = [];
    if (bar.kind !== (example ? "mock" : "library")) problems.push(`bar kind ${bar.kind}`);
    if (example && bar.badge !== "Mock") problems.push(`Mock badge reads ${JSON.stringify(bar.badge)}`);
    if (!example && bar.badge) problems.push(`library page shows the badge ${JSON.stringify(bar.badge)}`);
    if (entry !== HOME && bar.title !== entry.title) problems.push(`bar title ${JSON.stringify(bar.title)}, want ${entry.title}`);
    if (bar.current !== `./${entry.file}`) problems.push(`pages menu marks ${bar.current} as current, want ./${entry.file}`);
    return problems;
  };
  for (const entry of ALL) {
    await visit(entry.file, barOf(entry));
    // GitHub Pages also serves a page without its .html, and the folder root as the overview.
    await visit(entry === HOME ? "" : keyOf(entry), barOf(entry));
  }
} finally {
  await browser?.close();
  await new Promise((done) => (server ? server.close(done) : done()));
  rmSync(out, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} failure(s)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
