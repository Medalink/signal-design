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

  got.squareCellPieceThrows = await page.evaluate(() => {
    const a = window.__ascii;
    const piece = { meta: { slug: "scene", cols: 2, rows: 1, fps: 1, cell: "square" }, default: () => () => "ab" };
    try {
      a.mountAscii(document.createElement("div"), piece);
      return false;
    } catch (error) {
      return error instanceof TypeError && error.message.includes("square-cell");
    }
  });

  got.offScreenBusyNeverPlays = await page.evaluate(async () => {
    const a = window.__ascii;
    const seen = [];
    const piece = { meta: { slug: "offscreen", cols: 2, rows: 1, fps: 60 }, default: () => (t) => (seen.push(t), "ab") };
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;top:-5000px;left:0;width:200px";
    el.setAttribute("aria-busy", "true");
    a.host.append(el);
    const art = a.mountAscii(el, piece);
    await new Promise((resolve) => setTimeout(resolve, 400));
    art.destroy();
    el.remove();
    return seen.length === 1;
  });

  got.flatAndOddPalettesStayMid = await page.evaluate(() => {
    const a = window.__ascii;
    const html = (palette, text, color) => {
      const el = document.createElement("div");
      a.host.append(el);
      const piece = { meta: { slug: "palette", cols: 3, rows: 1, fps: 1, palette, still: true }, default: () => () => ({ text, color }) };
      const art = a.mountAscii(el, piece);
      const out = el.querySelector("pre").innerHTML;
      art.destroy();
      el.remove();
      return out;
    };
    return (
      html({ a: "#808080", b: "#808080" }, "abb", "abb") === "abb" &&
      html({ a: "#808080" }, "aaa", "aaa") === "aaa" &&
      html({ a: "#000000", b: "#ffffff", c: "red" }, "acb", "acb") === '<span class="sd-ascii-lo">a</span>c<span class="sd-ascii-hi">b</span>'
    );
  });

  got.firstFrameNeverRunsBackwards = await page.evaluate(async () => {
    const a = window.__ascii;
    const real = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => real((ts) => cb(ts - 50));
    const seen = [];
    const piece = { meta: { slug: "clock", cols: 2, rows: 1, fps: 60 }, default: () => (t) => (seen.push(t), "ab") };
    const el = document.createElement("div");
    a.host.append(el);
    const art = a.mountAscii(el, piece);
    seen.length = 0;
    art.busy(true);
    await a.until(() => seen.length > 3);
    art.destroy();
    window.requestAnimationFrame = real;
    el.remove();
    return seen.length > 3 && seen[0] === 0 && seen.every((t) => t >= 0);
  });

  got.mountingTwiceKeepsTheSecond = await page.evaluate(() => {
    const a = window.__ascii;
    a.host.removeAttribute("aria-busy");
    const el = document.createElement("div");
    a.host.append(el);
    const first = a.mountAscii(el, a.torus, { at: 1 });
    a.twice = a.mountAscii(el, a.torus, { at: 1 });
    first.destroy();
    first.busy(false);
    const pre = el.querySelector("pre");
    const before = pre.textContent;
    a.host.setAttribute("aria-busy", "true");
    return a.until(() => pre.textContent !== before).then((played) => {
      a.twice.destroy();
      el.remove();
      return played;
    });
  });

  got.removedElementReleasesObservers = await page.evaluate(async () => {
    const a = window.__ascii;
    const proto = IntersectionObserver.prototype;
    const real = proto.disconnect;
    let calls = 0;
    proto.disconnect = function () {
      calls++;
      return real.call(this);
    };
    const el = document.createElement("div");
    a.host.append(el);
    a.mountAscii(el, a.torus);
    el.remove();
    a.colored.destroy();
    a.braille.destroy();
    const held = calls;
    document.documentElement.setAttribute("aria-busy", "false");
    document.documentElement.removeAttribute("aria-busy");
    await a.settle();
    proto.disconnect = real;
    return held === 0 && calls === 1;
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
