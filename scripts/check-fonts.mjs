/**
 * Behavior checks for the font faces, on pages built from dist/ and served
 * from a fake origin, so nothing depends on the showcase:
 *   checkFonts(page) -> { errors, passed }
 * The core stylesheet declares no face, each font-<family>.css declares one,
 * and the default stylesheet declares them all. A browser fetches a file only
 * for text that uses it.
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const origin = "http://signal-fonts.test";
const TYPES = { css: "text/css", woff2: "font/woff2", html: "text/html" };
const FAMILIES = ["source-code-pro", "leon-sans", "literata"];

const pageHtml = (styles, body) =>
  `<!doctype html><html lang="en" data-theme="ink"><head><meta charset="utf-8"><title>faces</title>${styles.map((href) => `<link rel="stylesheet" href="/${href}">`).join("")}</head><body>${body}</body></html>`;

const READING = '<article id="page" class="sd-manuscript-page" data-face="reading"><p>Plain <em>italic</em> and <strong id="strong">strong</strong>.</p><p id="more"></p></article><code id="code">code</code>';

export async function checkFonts(page) {
  const errors = [];
  let passed = 0;
  const expect = (ok, message) => (ok ? passed++ : errors.push(message));
  const files = () => requested.filter((name) => name.endsWith(".woff2")).sort();
  let requested = [];
  let html = "";

  await page.route(`${origin}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/") return route.fulfill({ status: 200, contentType: TYPES.html, body: html });
    const file = dist + path.slice(1);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    requested.push(path.replace(/^\/fonts\//, ""));
    return route.fulfill({ status: 200, contentType: TYPES[file.split(".").pop()] ?? "application/octet-stream", body: readFileSync(file) });
  });

  const open = async (styles, body) => {
    requested = [];
    html = pageHtml(styles, body);
    await page.goto(`${origin}/`);
    await page.evaluate(() => document.fonts.ready);
  };
  const faceRules = () => page.evaluate(() => [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]).filter((rule) => rule instanceof CSSFontFaceRule).map((rule) => rule.style.fontFamily.replaceAll('"', "")));
  const family = (selector) => page.evaluate((s) => getComputedStyle(document.querySelector(s)).fontFamily.replaceAll('"', ""), selector);

  for (const name of FAMILIES) expect(existsSync(`${dist}font-${name}.css`), `dist/font-${name}.css is missing: run pnpm build:css`);
  const resolve = createRequire(import.meta.url).resolve;
  for (const request of ["signal-design/css/core", ...FAMILIES.map((name) => `signal-design/css/fonts/${name}`), "signal-design/dist/signal-core.css", ...FAMILIES.map((name) => `signal-design/dist/font-${name}.css`)]) {
    let found = true;
    try {
      resolve(request);
    } catch {
      found = false;
    }
    expect(found, `${request} does not resolve through the package exports`);
  }

  /* ---- The core alone: no face, nothing fetched, the stack still falls back ---- */
  await open(["signal-core.css"], READING);
  expect((await faceRules()).length === 0, `signal-core.css declares a face: ${(await faceRules()).join(", ")}`);
  expect(files().length === 0, `the core alone fetched font files: ${files().join(", ")}`);
  expect((await family("#page")).startsWith("Literata, Iowan Old Style"), `the reading token lost its stack: ${await family("#page")}`);
  expect((await family("#code")).includes("monospace"), `code has no monospace fallback: ${await family("#code")}`);

  /* ---- The core plus Literata: only Literata is declared and fetched ---- */
  await open(["signal-core.css", "font-literata.css"], READING);
  const declared = [...new Set(await faceRules())];
  expect(declared.join() === "Literata", `core plus Literata declares ${declared.join(", ")}`);
  expect(files().join() === "literata-italic-latin.woff2,literata-latin.woff2", `plain Latin text fetches the two Latin files, got ${files().join(", ")}`);
  expect(await page.evaluate(() => document.fonts.check('400 1em Literata') && document.fonts.check('italic 400 1em Literata')), "Literata did not load");
  expect(await page.evaluate(() => getComputedStyle(document.getElementById("strong")).fontWeight) === "600", "strong in the reading face is not semibold");
  await page.evaluate(() => {
    document.getElementById("more").textContent = "ŝ";
  });
  for (let i = 0; i < 40 && !files().includes("literata-latin-ext.woff2"); i++) await page.waitForTimeout(100);
  expect(files().includes("literata-latin-ext.woff2"), `a Latin Extended character did not fetch its file, got ${files().join(", ")}`);

  /* ---- The default stylesheet declares every face and still fetches by use ---- */
  await open(["signal.css"], READING);
  expect(new Set(await faceRules()).size === 4, `signal.css declares ${[...new Set(await faceRules())].join(", ")}`);
  const used = files();
  expect(used.includes("literata-latin.woff2") && used.includes("source-code-pro-400.woff2"), `the default stylesheet did not fetch the faces the text uses, got ${used.join(", ")}`);
  expect(!used.some((name) => name.startsWith("leon-sans")), `the default stylesheet fetched Leon Sans without data-font, got ${used.join(", ")}`);

  await page.unroute(`${origin}/**`);
  return { errors, passed };
}
