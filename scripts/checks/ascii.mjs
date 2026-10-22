import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const page = "ascii";

const piece = (slug) => createRequire(import.meta.url).resolve(`ascii-magic-art/pieces/${slug}.js`);
const fsUrl = (base, file) => `${base}@fs/${file.replace(/\\/g, "/")}`;

/** ascii: still until busy, plays on aria-busy or busy(true), holds when it stops, greys only, tone, boxed glyphs. */
export default async function checkAscii(page, where, fail) {
  const base = new URL("/", page.url()).href;
  const urls = {
    module: fsUrl(base, fileURLToPath(new URL("../../src/js/ascii/index.js", import.meta.url))),
    torus: fsUrl(base, piece("spinning-torus")),
    terminal: fsUrl(base, piece("terminal-session")),
    spinners: fsUrl(base, piece("spinner-set")),
  };
  const bad = (key) => fail(`${where} ascii`, key);

  await page.evaluate(async (urls) => {
    const { mountAscii } = await import(/* @vite-ignore */ urls.module);
    const host = document.createElement("section");
    host.id = "ascii-check";
    host.style.cssText = "position:fixed;top:0;left:0;width:320px;z-index:9";
    host.innerHTML = '<div class="sd-ascii torus"></div><div class="sd-ascii colored" data-tone="danger"></div><div class="sd-ascii braille"></div>';
    document.body.append(host);
    const q = (s) => host.querySelector(s);
    const torus = await import(/* @vite-ignore */ urls.torus);
    const terminal = await import(/* @vite-ignore */ urls.terminal);
    const spinners = await import(/* @vite-ignore */ urls.spinners);
    window.__ascii = {
      host,
      mountAscii,
      torus,
      art: mountAscii(q(".torus"), torus, { at: 1 }),
      colored: mountAscii(q(".colored"), terminal, { at: 8 }),
      braille: mountAscii(q(".braille"), spinners, { at: 3 }),
      text: () => q(".torus pre").textContent,
      until: (cond, ms = 3000) =>
        new Promise((resolve) => {
          const end = performance.now() + ms;
          const poll = () => (cond() ? resolve(true) : performance.now() > end ? resolve(false) : setTimeout(poll, 20));
          poll();
        }),
      settle: () => new Promise((resolve) => setTimeout(resolve, 150)),
    };
  }, urls);

  const got = {};
  const still = (ms = 400) =>
    page.evaluate(async (ms) => {
      const a = window.__ascii;
      const before = a.text();
      await new Promise((resolve) => setTimeout(resolve, ms));
      return a.text() === before;
    }, ms);
  const plays = () =>
    page.evaluate(() => {
      const a = window.__ascii;
      const before = a.text();
      return a.until(() => a.text() !== before);
    });
  const freezes = async () => {
    await page.evaluate(() => window.__ascii.settle());
    return still();
  };

  got.stillByDefault = await still();
  await page.evaluate(() => window.__ascii.host.setAttribute("aria-busy", "true"));
  got.playsWhenBusy = await plays();
  await page.evaluate(() => window.__ascii.host.removeAttribute("aria-busy"));
  got.holdsWhenIdle = await freezes();

  await page.evaluate(() => window.__ascii.host.setAttribute("aria-busy", "false"));
  await page.evaluate(() => window.__ascii.art.busy(true));
  got.busyCallPlaysThroughFalse = await plays();
  await page.evaluate(() => window.__ascii.art.busy());
  got.busyResetFollowsAttribute = await freezes();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => window.__ascii.host.setAttribute("aria-busy", "true"));
  got.reducedMotionStaysStill = await still();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  got.reducedMotionEndResumes = await plays();
  await page.evaluate(() => window.__ascii.host.removeAttribute("aria-busy"));
  await freezes();

  got.paintsGreysOnly = await page.evaluate(() => {
    const a = window.__ascii;
    const html = a.host.querySelector(".colored pre").innerHTML;
    const probe = document.createElement("i");
    document.body.append(probe);
    const tokens = (names) => names.map((name) => ((probe.style.color = `var(${name})`), getComputedStyle(probe).color));
    const [fg, danger] = tokens(["--sd-fg", "--sd-danger"]);
    probe.remove();
    const spans = [...a.host.querySelectorAll(".colored pre span")];
    const painted = new Set(spans.map((s) => getComputedStyle(s).color));
    return {
      noInlineColor: !/style=|#[0-9a-f]{3,6}\b/i.test(html),
      levelsOnly: spans.length > 0 && spans.every((s) => /^sd-ascii-(hi|lo)$/.test(s.className)),
      toneOnBrightest: painted.has(danger) && !painted.has(fg),
    };
  });
  for (const [key, ok] of Object.entries(got.paintsGreysOnly)) if (!ok) bad(`paints greys only: ${key}`);
  delete got.paintsGreysOnly;

  got.boxedGlyphsAreOneColumn = await page.evaluate(() => {
    const pre = window.__ascii.host.querySelector(".braille pre");
    const boxed = [...pre.querySelectorAll("i")];
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font:inherit";
    probe.textContent = "0";
    pre.append(probe);
    const column = probe.getBoundingClientRect().width;
    probe.remove();
    return boxed.length > 0 && boxed.every((i) => Math.abs(i.getBoundingClientRect().width - column) < 0.6);
  });

  got.fitsItsBox = await page.evaluate(() => {
    const { host } = window.__ascii;
    return [...host.querySelectorAll("pre")].every((pre) => pre.scrollWidth <= pre.clientWidth + 1 && pre.getBoundingClientRect().right <= host.getBoundingClientRect().right + 1);
  });

  await page.evaluate(() => window.__ascii.host.setAttribute("aria-busy", "true"));
  await page.evaluate(() => window.__ascii.art.destroy());
  await page.evaluate(() => window.__ascii.settle());
  await page.evaluate(() => {
    const { host } = window.__ascii;
    host.removeAttribute("aria-busy");
    return Promise.resolve().then(() => host.setAttribute("aria-busy", "true"));
  });
  got.destroyStops = await still(500);
  got.destroyedBusyIsSafe = await page.evaluate(() => {
    try {
      window.__ascii.art.busy(true);
      window.__ascii.art.destroy();
      return true;
    } catch {
      return false;
    }
  });
  got.otherMountsKeepPlayingAfterDestroy = await page.evaluate(() => {
    const a = window.__ascii;
    const before = a.host.querySelector(".colored pre").textContent;
    return a.until(() => a.host.querySelector(".colored pre").textContent !== before, 3000);
  });

  await page.evaluate(() => {
    const a = window.__ascii;
    a.colored.destroy();
    a.braille.destroy();
    a.host.remove();
    delete window.__ascii;
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) bad(key);
}
