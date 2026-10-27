/**
 * Scores every library block and every showcase page, then ranks them.
 *
 *   node scripts/score.mjs [baseUrl] [--only lib-components,chat] [--json file] [--md file] [--skip interact,snippets]
 *
 * A block is one `.demo-block` on a library page (the same ids as
 * ai/components.json). A page is every page in showcase/pages.js, scored on
 * what lies outside its blocks: the library chrome, or the whole example app,
 * which is where parts are composed into a product.
 *
 * Each finding has a weight (critical 10, major 5, minor 1). A finding seen in
 * several themes or widths counts once. An item's score is 100 minus its
 * weight, floored at 0; the headline number is the total weight, lower is
 * better. The checks are the ones CI does not already enforce, so a clean CI
 * run can still score low:
 *
 *   focus      a control whose pixels do not change when it takes keyboard focus
 *   hover      a button or link whose pixels do not change under the pointer
 *   target     a control under 24px with a neighbour inside its 24px circle (WCAG 2.5.8)
 *   touch      a control under 40px tall at phone width
 *   boundary   a text field, select or checkbox whose edge is under 3:1 (WCAG 1.4.11)
 *   text       visible text under 12px
 *   clip       text cut off without an ellipsis
 *   overflow   a part sticking out of its block, or the page scrolling sideways
 *   rules      a rounded corner, blurred shadow or gradient (the hard rules)
 *   axe        an axe-core WCAG 2.2 AA violation
 *   snippet    the copyable HTML renders differently on a bare Tailwind + Signal page
 *   class      a class in the copyable HTML that no stylesheet styles
 *   console    a console error
 *   docs       no usage note, or behavior that no check exercises
 *   composed   a part that no example app uses
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ALL, EXAMPLES, LIBRARY, keyOf } from "../showcase/pages.js";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\\/g, "/");
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const args = process.argv.slice(2);
const flag = (name) => {
  const at = args.indexOf(name);
  return at < 0 ? null : args.splice(at, 2)[1];
};
const only = flag("--only")?.split(",");
const jsonOut = flag("--json");
const mdOut = flag("--md");
const skip = new Set(flag("--skip")?.split(",") ?? []);
const base = (args[0] || "http://localhost:5178/").replace(/\/?$/, "/");

const WEIGHT = { critical: 10, major: 5, minor: 1 };
const THEMES = ["ink", "graphite", "paper"];
const WIDTHS = [1280, 768, 375];

/* ---- in-page probe: DOM measurements for one root, one theme, one width -- */

function probe({ scope, exclude, width }) {
  const out = [];
  const add = (check, severity, el, detail) => out.push({ check, severity, el: sig(el), detail });
  function sig(el) {
    if (!el || el.nodeType !== 1) return String(el);
    const parts = [];
    for (let n = el; n && n !== document.body && parts.length < 3; n = n.parentElement) {
      const cls = [...n.classList].filter((c) => c.startsWith("sd-")).slice(0, 2).join(".");
      parts.unshift(n.tagName.toLowerCase() + (n.matches("input") ? `[${n.type}]` : "") + (n.id ? `#${n.id}` : "") + (cls ? `.${cls}` : ""));
      if (n.id) break;
    }
    const label = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
    return parts.join(">") + (label ? ` "${label}"` : "");
  }
  const roots = scope ? [...document.querySelectorAll(scope)] : [document.body];
  const excluded = (el) => exclude && el.closest(exclude);
  const all = roots.flatMap((r) => [r, ...r.querySelectorAll("*")]).filter((el) => !excluded(el));
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none" && el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) !== false;
  };

  // Colors through a canvas, so oklch(), color-mix() and named colors all resolve.
  const ctx = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
  const rgba = (c) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const over = (top, bottom) => top.slice(0, 3).map((v, i) => v * top[3] + bottom[i] * (1 - top[3])).concat(1);
  const backdrop = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    return layers.reduceRight((acc, c) => over(c, acc), rgba(getComputedStyle(document.documentElement).backgroundColor));
  };
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  // Hard rules, scoped.
  for (const el of all) {
    if (!visible(el)) continue;
    for (const pseudo of [null, "::before", "::after"]) {
      const s = getComputedStyle(el, pseudo);
      if (pseudo && (s.content === "none" || s.content === "normal")) continue;
      if (["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"].some((c) => s[c] !== "0px")) add("rules", "critical", el, `rounded ${pseudo ?? ""}`);
      for (const part of s.boxShadow === "none" ? [] : s.boxShadow.split(/,(?![^(]*\))/)) {
        const nums = part.replace(/rgba?\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]+/gi, "").match(/-?[\d.]+px/g) || [];
        if (parseFloat(nums[2] ?? "0") > 0) add("rules", "critical", el, `blurred shadow ${pseudo ?? ""}`);
      }
      if (/(^|[\s,])(repeating-)?(linear|radial|conic)-gradient\(/.test(s.backgroundImage.replace(/url\([^)]*\)/g, ""))) add("rules", "critical", el, `gradient ${pseudo ?? ""}`);
    }
  }

  // Overflow: a part sticking out of its root, not inside a scroller of its own.
  const vw = document.documentElement.clientWidth;
  if (!scope && document.documentElement.scrollWidth > vw + 1) add("overflow", "critical", document.documentElement, `page scrolls sideways by ${document.documentElement.scrollWidth - vw}px`);
  for (const r of roots) {
    const edge = Math.min(r.getBoundingClientRect().right, vw);
    for (const el of r.querySelectorAll("*")) {
      if (excluded(el) || !visible(el)) continue;
      let clipped = false;
      for (let n = el.parentElement; n && n !== r.parentElement; n = n.parentElement) {
        const ox = getComputedStyle(n).overflowX;
        if (ox !== "visible") { clipped = true; break; }
      }
      if (clipped) continue;
      const past = el.getBoundingClientRect().right - edge;
      if (past > 2) {
        add("overflow", "critical", el, `sticks out ${Math.round(past)}px at ${width}px`);
        break;
      }
    }
  }

  // Targets.
  const CONTROL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [role=menuitem], [role=menuitemcheckbox], [role=option], [role=slider], [role=treeitem], [tabindex]:not([tabindex="-1"])';
  const controls = all.filter((el) => el.matches(CONTROL) && !el.disabled && visible(el) && !el.closest("[inert], [aria-hidden=true]"));
  const inlineLink = (el) => el.matches("a") && getComputedStyle(el).display === "inline" && /\S/.test((el.parentElement?.textContent ?? "").replace(el.textContent, ""));
  const rects = controls.map((el) => el.getBoundingClientRect());
  controls.forEach((el, i) => {
    if (inlineLink(el)) return;
    // A label wrapping a small checkbox makes the whole label the target.
    const label = el.closest("label") ?? (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`));
    const r = label && el.matches("input[type=checkbox], input[type=radio]") ? label.getBoundingClientRect() : rects[i];
    if (r.width < 24 || r.height < 24) {
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const crowded = rects.some((o, j) => {
        if (j === i || controls[j].contains(el) || el.contains(controls[j])) return false;
        const dx = Math.max(o.left - cx, 0, cx - o.right), dy = Math.max(o.top - cy, 0, cy - o.bottom);
        return Math.hypot(dx, dy) < 12;
      });
      if (crowded) add("target", "major", el, `${Math.round(r.width)}x${Math.round(r.height)} with a neighbour inside 24px`);
    }
    if (width <= 400 && r.height < 40 && !el.matches("input[type=checkbox], input[type=radio], [role=switch]")) add("touch", "minor", el, `${Math.round(r.height)}px tall on a phone`);
  });

  // Field boundaries (WCAG 1.4.11).
  const edgeOf = (el) => {
    const s = getComputedStyle(el);
    const behind = backdrop(el.parentElement);
    const fill = over(rgba(s.backgroundColor), behind);
    const edges = ["Top", "Right", "Bottom", "Left"].filter((side) => parseFloat(s[`border${side}Width`]) > 0).map((side) => over(rgba(s[`border${side}Color`]), behind));
    return { drawn: edges.length > 0 || fill.some((v, i) => Math.abs(v - behind[i]) > 2), ratio: Math.max(contrast(fill, behind), ...edges.map((e) => contrast(e, behind))) };
  };
  for (const el of controls) {
    if (!el.matches('input:not([type=range], [type=color], [type=file], [type=submit], [type=reset], [type=button], [type=image]), select, textarea, [role=checkbox], [role=switch]')) continue;
    // A field with no edge of its own (the textarea in a composer, the input
    // in a tag list) is bounded by the nearest wrapper that draws one.
    let box = edgeOf(el);
    for (let n = el.parentElement, i = 0; !box.drawn && n && i < 3; n = n.parentElement, i++) box = edgeOf(n);
    if (box.ratio < 3) add("boundary", "major", el, `edge ${box.ratio.toFixed(2)}:1`);
  }

  // Text size and clipping.
  for (const el of all) {
    // A stream scene is a 1920px canvas scaled to fit; OBS shows it full size.
    // Superscripts and subscripts are smaller than their line by design.
    if (!visible(el) || el.closest("svg, canvas, .sd-ascii, [aria-hidden=true], .sd-rain, kbd, .sd-scene, sub, sup")) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const s = getComputedStyle(el);
    const size = parseFloat(s.fontSize);
    if (size > 0 && size < 12) add("text", size < 11 ? "major" : "minor", el, `${size}px text`);
    // Visually hidden text (a screen-reader box, a collapsed column) is clipped on purpose.
    if (s.clipPath === "none" && s.clip === "auto" && el.scrollWidth > el.clientWidth + 1 && s.overflowX === "hidden" && s.textOverflow !== "ellipsis" && s.whiteSpace === "nowrap") add("clip", "minor", el, "text cut without an ellipsis");
  }
  return out;
}

/* ---- pixel checks: focus, hover and snippet drift ----------------------- */

async function pixels(page, clip) {
  return page.screenshot({ clip, animations: "disabled", caret: "hide" }).then((b) => b.toString("base64"));
}

/** Fraction of pixels that differ, and the larger size when the sizes differ. */
async function diff(helper, a, b, relative = false) {
  return helper.evaluate(async ([a, b, relative]) => {
    const load = async (s) => createImageBitmap(await (await fetch(`data:image/png;base64,${s}`)).blob());
    const [x, y] = await Promise.all([load(a), load(b)]);
    const w = Math.max(x.width, y.width), h = Math.max(x.height, y.height);
    const read = (img) => {
      const c = new OffscreenCanvas(w, h).getContext("2d");
      c.drawImage(img, 0, 0);
      return c.getImageData(0, 0, w, h).data;
    };
    const p = read(x), q = read(y);
    const far = (u, i, v, j) => Math.abs(u[i] - v[j]) + Math.abs(u[i + 1] - v[j + 1]) + Math.abs(u[i + 2] - v[j + 2]) > 48;
    // Relative: each image's most common color is its backdrop, so a part on
    // a slightly different panel still matches when everything on it does.
    const mode = (d) => {
      const n = new Map();
      for (let i = 0; i < d.length; i += 4) { const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; n.set(k, (n.get(k) ?? 0) + 1); }
      const k = [...n].sort((a, b) => b[1] - a[1])[0][0];
      return [k >> 16, (k >> 8) & 255, k & 255];
    };
    const [bp, bq] = relative ? [mode(p), mode(q)] : [null, null];
    // Subpixel layout can move a whole part by a pixel; take the best of the nine one-pixel shifts.
    let changed = Infinity;
    for (const [dx, dy] of relative ? [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]] : [[0, 0]]) {
      const hit = new Uint8Array(w * h);
      for (let yy = 0; yy < h; yy++) {
        const sy = Math.min(h - 1, Math.max(0, yy + dy));
        for (let xx = 0; xx < w; xx++) {
          const i = (yy * w + xx) * 4, j = (sy * w + Math.min(w - 1, Math.max(0, xx + dx))) * 4;
          if (relative && !far(p, i, bp, 0) && !far(q, j, bq, 0)) continue;
          if (far(p, i, q, j)) hit[yy * w + xx] = 1;
        }
      }
      // Antialiased glyph edges differ in scattered pixels; missing or moved
      // content differs in solid areas. Relative mode counts only 2x2 blocks.
      let n = 0;
      for (let k = 0; k < hit.length; k++) if (hit[k] && (!relative || (hit[k + 1] && hit[k + w] && hit[k + w + 1]))) n++;
      changed = Math.min(changed, n);
    }
    return { changed, total: w * h, sameSize: x.width === y.width && x.height === y.height, a: [x.width, x.height], b: [y.width, y.height] };
  }, [a, b, relative]);
}

const CONTROL_SEL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [role=menuitem], [role=option], [role=slider], [role=treeitem], [tabindex]:not([tabindex="-1"])';

/** Focus and hover deltas for every control under `scope` (or the page minus `exclude`). */
async function interact(page, helper, { scope, exclude }) {
  const findings = [];
  const handles = await page.$$(scope ? `${scope} :is(${CONTROL_SEL})` : CONTROL_SEL);
  for (const h of handles) {
    const info = await h.evaluate((el, exclude) => {
      if (exclude && el.closest(exclude)) return null;
      if (el.disabled || el.closest("[inert], [aria-hidden=true], dialog:not([open]), [popover]:not(:popover-open)")) return null;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || getComputedStyle(el).visibility === "hidden") return null;
      const cls = [...el.classList].filter((c) => c.startsWith("sd-")).slice(0, 2).join(".");
      const label = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 24);
      const type = el.matches("input") ? `[${el.type}]` : "";
      return { sig: `${el.closest("[id]")?.id ?? ""}>${el.tagName.toLowerCase()}${type}${cls ? `.${cls}` : ""}${label ? ` "${label}"` : ""}`, text: el.matches("textarea, input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=button]):not([type=submit]), [contenteditable]"), hoverable: el.matches("a[href], button, summary, [role=button], [role=tab], [role=menuitem], [role=option], [role=treeitem]") };
    }, exclude);
    if (!info) continue;
    await h.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
    const box = await h.boundingBox();
    if (!box || box.width < 2) continue;
    // A field inside a wrapper (composer, tags, combobox) may show focus on
    // the wrapper's edge, so the picture takes in a snug wrapper too: an
    // ancestor up to three levels up whose box is at most four times larger.
    const area = await h.evaluate((el) => {
      const r = el.getBoundingClientRect();
      let best = r;
      for (let n = el.parentElement, i = 0; n && i < 3; n = n.parentElement, i++) {
        const p = n.getBoundingClientRect();
        if (p.width * p.height <= 4 * r.width * r.height) best = p;
      }
      return { x: best.left, y: best.top, width: best.width, height: best.height };
    });
    const vp = page.viewportSize();
    const pad = 6;
    const clip = { x: Math.max(0, area.x - pad), y: Math.max(0, area.y - pad), width: Math.min(area.width + pad * 2, vp.width - Math.max(0, area.x - pad)), height: Math.min(area.height + pad * 2, vp.height - Math.max(0, area.y - pad)) };
    if (clip.width < 2 || clip.height < 2) continue;
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.activeElement?.blur());
    const rest = await pixels(page, clip);
    // A Tab press from the element before it gives real keyboard focus (:focus-visible).
    await h.evaluate((el) => {
      const before = document.createElement("span");
      before.tabIndex = 0;
      before.dataset.scoreProbe = "";
      el.before(before);
      before.focus();
    });
    await page.keyboard.press("Tab");
    // Focus can land on a descendant (a toolbar hands it to its first button);
    // the ring is then judged by the size of what holds focus.
    const focused = await h.evaluate((el) => {
      document.querySelector("[data-score-probe]")?.remove();
      const a = document.activeElement;
      if (a !== el && !el.contains(a)) return null;
      const r = a.getBoundingClientRect();
      // A ring around a 16px square (a range thumb) is plainly visible, so
      // no control needs more than 64 changed pixels.
      return Math.min(r.width + r.height, 64);
    });
    if (focused) {
      const shot = await pixels(page, clip);
      const d = await diff(helper, rest, shot);
      // A visible ring changes at least half of a 1px outline around the focused box.
      if (process.env.SCORE_DEBUG && d.changed < focused) {
        const name = info.sig.replace(/[^a-z0-9]+/gi, "-").slice(0, 60);
        writeFileSync(`.audit/shots/focus-${name}-rest.png`, Buffer.from(rest, "base64"));
        writeFileSync(`.audit/shots/focus-${name}-focus.png`, Buffer.from(shot, "base64"));
      }
      if (d.changed < focused) findings.push({ check: "focus", severity: info.text ? "major" : "critical", el: info.sig, detail: `${d.changed} px change on focus` });
    }
    await page.evaluate(() => document.activeElement?.blur());
    // A control parked off screen until it takes focus (a skip link) has no hover.
    if (info.hoverable && box.y + box.height > 0 && box.x + box.width > 0) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const shot = await pixels(page, clip);
      const d = await diff(helper, rest, shot);
      if (d.changed < 4) findings.push({ check: "hover", severity: "minor", el: info.sig, detail: "no change under the pointer" });
      await page.mouse.move(0, 0);
    }
    // Interactions can open overlays; close them so the next control is reachable.
    await page.keyboard.press("Escape").catch(() => {});
  }
  return findings;
}

/* ---- running pages ------------------------------------------------------ */

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const finite = document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity);
    await Promise.race([Promise.all(finite.map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 2500))]);
  });
}

async function open(browser, url, theme, width) {
  // Phone width is a phone: touch and a coarse pointer, so (pointer: coarse) rules apply.
  const phone = width <= 400;
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce", hasTouch: phone, isMobile: phone });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  await page.addInitScript((t) => localStorage.setItem("sd-theme", t), theme);
  await page.goto(url, { waitUntil: "load" });
  await page.addStyleTag({ content: "*{content-visibility:visible!important}" });
  await settle(page);
  return { page, errors };
}

async function axe(page, include, exclude) {
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: axeSource });
  return page.evaluate(
    async ([include, exclude]) => {
      const r = await window.axe.run({ include: include ?? [["body"]], exclude: exclude ?? [] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      return r.violations.flatMap((v) => v.nodes.map((n) => ({ check: "axe", severity: v.impact === "critical" || v.impact === "serious" ? "critical" : "major", el: n.target.join(" ").slice(0, 80), detail: v.id })));
    },
    [include, exclude],
  );
}

/* ---- the run ------------------------------------------------------------ */

const items = new Map();
const item = (id, kind, meta = {}) => {
  if (!items.has(id)) items.set(id, { id, kind, ...meta, findings: new Map() });
  return items.get(id);
};
const record = (it, f, where) => {
  const key = `${f.check}|${f.el}|${f.detail.replace(/\d+/g, "#")}`;
  if (!it.findings.has(key)) it.findings.set(key, { ...f, where: [] });
  it.findings.get(key).where.push(where);
};
const progress = (label) => process.stdout.write(`\r${label} ${Math.round((performance.now() - t0) / 1000)}s          `);
const BLOCK_PARTS = (id) => `#${id} > :not(.demo-head):not(.demo-code):not(.demo-usage):not(script)`;

const components = JSON.parse(readFileSync(new URL("../ai/components.json", import.meta.url), "utf8")).components;
const meta = new Map(components.map((c) => [c.id, c]));
const libPages = LIBRARY.filter((p) => !only || only.includes(keyOf(p)));
const allPages = ALL.filter((p) => !only || only.includes(keyOf(p)));
const t0 = performance.now();
const browser = await chromium.launch();
const helper = await browser.newPage();

// DOM probes and axe, every page in every theme at every width.
const jobs = allPages.flatMap((p) => THEMES.flatMap((theme) => WIDTHS.map((width) => ({ p, theme, width }))));
let done = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (jobs.length) {
      const { p, theme, width } = jobs.shift();
      const where = `${theme}@${width}`;
      const lib = LIBRARY.includes(p);
      const { page, errors } = await open(browser, base + p.file, theme, width);
      const pageItem = item(`page:${keyOf(p)}`, lib || p === ALL[0] ? "chrome" : "app", { title: p.title });
      if (lib) {
        for (const id of await page.$$eval(".demo-block[id]", (bs) => bs.map((b) => b.id))) {
          const it = item(id, "block", { title: meta.get(id)?.title ?? id, section: meta.get(id)?.section ?? p.title });
          for (const f of await page.evaluate(probe, { scope: BLOCK_PARTS(id), width })) record(it, f, where);
          for (const f of await axe(page, [[BLOCK_PARTS(id)]])) record(it, f, where);
        }
      }
      for (const f of await page.evaluate(probe, { exclude: lib ? ".demo-block" : null, width })) record(pageItem, f, where);
      for (const f of await axe(page, null, lib ? [[".demo-block"]] : null)) record(pageItem, f, where);
      for (const e of errors) record(pageItem, { check: "console", severity: "critical", el: "console", detail: e }, where);
      await page.close();
      progress(`${++done} page runs`);
    }
  }),
);
process.stdout.write("\n");

// Focus and hover, in ink at 1280: the deltas do not change with the theme.
if (!skip.has("interact")) {
  for (const p of allPages) {
    const lib = LIBRARY.includes(p);
    const { page } = await open(browser, base + p.file, "ink", 1280);
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation-play-state:paused!important}" });
    if (lib) {
      for (const id of await page.$$eval(".demo-block[id]", (bs) => bs.map((b) => b.id))) {
        for (const f of await interact(page, helper, { scope: BLOCK_PARTS(id) })) record(item(id, "block"), f, "ink@1280");
      }
    }
    for (const f of await interact(page, helper, { exclude: lib ? ".demo-block" : null })) record(item(`page:${keyOf(p)}`, "chrome"), f, "ink@1280");
    await page.close();
    progress(`interaction ${keyOf(p)}`);
  }
  process.stdout.write("\n");
}

// Snippet drift: each block's copyable HTML on one bare Tailwind + Signal page
// at the same width, compared element by element with the showcase preview:
// the same elements, the same boxes within 3px, the same colors and sizes.
// A difference means the preview leans on showcase CSS or script.
if (!skip.has("snippets")) {
  const sandboxUrl = `${base}__score-sandbox.html`;
  const bare = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await bare.addInitScript(() => localStorage.setItem("sd-theme", "ink"));
  await bare.route(sandboxUrl, (r) =>
    r.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en" data-theme="ink"><head><meta charset="utf-8"><script type="module">import "${base}@fs/${root}scripts/score-sandbox.css"; import { init } from "${base}@fs/${root}src/js/index.js"; init(); document.documentElement.dataset.ready = "";</script></head><body><main style="padding:40px"><div id="host"></div></main></body></html>`,
    }),
  );
  await bare.goto(sandboxUrl);
  await bare.waitForSelector("html[data-ready]", { timeout: 15000 });
  await bare.addStyleTag({ content: "*{content-visibility:visible!important}" });
  const shape = (parts) =>
    parts.map((part) => {
      const o = part.getBoundingClientRect();
      return [part, ...part.querySelectorAll("*")]
        .filter((el) => !el.closest("svg") || el.matches("svg"))
        .map((el) => {
          const r = el.getBoundingClientRect(), s = getComputedStyle(el);
          const cls = [...el.classList].filter((c) => c.startsWith("sd-")).join(".");
          return { tag: el.tagName.toLowerCase() + (cls ? `.${cls}` : ""), box: [r.left - o.left, r.top - o.top, r.width, r.height].map(Math.round), style: [s.display, s.color, s.backgroundColor, s.borderTopColor, s.borderTopWidth, s.fontSize, s.fontWeight].join(" ") };
        });
    });
  for (const p of libPages) {
    const { page } = await open(browser, base + p.file, "ink", 1280);
    const blocks = await page.$$eval(".demo-block[id]", (bs) =>
      bs.map((b) => {
        const r = b.getBoundingClientRect(), s = getComputedStyle(b);
        return { id: b.id, width: Math.round(r.width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)), gap: s.rowGap, live: !!b.querySelector("canvas, .sd-ascii, .sd-rain, .sd-countdown, [data-sd-feed]") };
      }),
    );
    for (const b of blocks) {
      const c = meta.get(b.id);
      // Token blocks draw their swatches from script, so their HTML is a skeleton;
      // live blocks (charts, rain, feeds) change on every frame.
      if (!c?.html || b.live || c.script || c.section === "Tokens") continue;
      const sel = BLOCK_PARTS(b.id);
      const a = await page.$$eval(sel, (parts, fn) => new Function(`return (${fn})`)()(parts), shape.toString());
      await bare.evaluate(({ html, width, gap }) => {
        const host = document.getElementById("host");
        Object.assign(host.style, { width: `${width}px`, display: "grid", rowGap: gap });
        host.innerHTML = html;
      }, { ...b, html: c.html });
      await settle(bare);
      const z = await bare.$$eval("#host > *", (parts, fn) => new Function(`return (${fn})`)()(parts), shape.toString());
      const it = item(b.id, "block");
      for (let i = 0; i < a.length; i++) {
        const x = a[i], y = z[i] ?? [];
        if (x.length !== y.length) {
          const tags = (l) => l.reduce((m, e) => m.set(e.tag, (m.get(e.tag) ?? 0) + 1), new Map());
          const [ta, tz] = [tags(x), tags(y)];
          const gone = [...ta].filter(([t, n]) => (tz.get(t) ?? 0) < n).map(([t, n]) => `${t} ×${n - (tz.get(t) ?? 0)}`).slice(0, 3).join(", ");
          record(it, { check: "snippet", severity: "major", el: `part ${i + 1}`, detail: `${x.length} elements in the showcase, ${y.length} bare${gone ? `; missing ${gone}` : ""}` }, "ink@1280");
          continue;
        }
        const off = x.map((e, k) => [e, y[k]]).filter(([e, f]) => e.style !== f.style || (e.box[2] + e.box[3] + f.box[2] + f.box[3] > 0 && e.box.some((v, n) => Math.abs(v - f.box[n]) > 3)));
        if (off.length) {
          const [e, f] = off[0];
          record(it, { check: "snippet", severity: off.length > 3 ? "major" : "minor", el: `part ${i + 1} ${e.tag}`, detail: `${off.length} elements differ bare, first ${e.style === f.style ? `box ${e.box.join(",")} vs ${f.box.join(",")}` : `style ${e.style} vs ${f.style}`}` }, "ink@1280");
        }
      }
    }
    await page.close();
    progress(`snippets ${keyOf(p)}`);
  }
  await bare.close();
  process.stdout.write("\n");
}
await browser.close();

/* ---- static: classes, docs, tests and composition ----------------------- */

const read = (dir, re) => readdirSync(new URL(dir, import.meta.url)).filter((f) => re.test(f)).map((f) => readFileSync(new URL(dir + f, import.meta.url), "utf8")).join("\n");
const styled = new Set((read("../src/", /\.css$/) + read("../src/components/", /\.css$/)).match(/\.sd-[a-z0-9-]+/g).map((c) => c.slice(1)));
const checks = read("./", /^check.*\.mjs$/) + read("./checks/", /\.mjs$/);
const apps = read("../showcase/", new RegExp(`^(${EXAMPLES.map((e) => keyOf(e)).join("|")})(-[a-z-]+)?\\.(html|js|jsx)$`)) + read("../src/react/", /\.jsx?$/);
for (const c of components) {
  const it = items.get(c.id);
  if (!it) continue;
  for (const k of c.classes.filter((k) => !styled.has(k))) record(it, { check: "class", severity: "major", el: k, detail: "in the copyable HTML, styled by no rule" }, "static");
  if (!c.usage) record(it, { check: "docs", severity: "minor", el: "usage", detail: "no usage note" }, "static");
  if (c.attributes.length && !c.attributes.some((a) => checks.includes(a)) && !c.classes.some((k) => checks.includes(k))) record(it, { check: "docs", severity: "major", el: "checks", detail: `behavior (${c.attributes.join(", ")}) that no check exercises` }, "static");
  if (c.classes.length && !c.classes.some((k) => apps.includes(k)) && c.section !== "Tokens") record(it, { check: "composed", severity: "minor", el: "apps", detail: "no example app uses it" }, "static");
}

/* ---- report ------------------------------------------------------------- */

const ranked = [...items.values()]
  .map((it) => {
    const findings = [...it.findings.values()];
    const weight = findings.reduce((n, f) => n + WEIGHT[f.severity], 0);
    const byCheck = {};
    for (const f of findings) byCheck[f.check] = (byCheck[f.check] ?? 0) + WEIGHT[f.severity];
    return { id: it.id, kind: it.kind, title: it.title ?? it.id, section: it.section, score: Math.max(0, 100 - weight), weight, byCheck, findings };
  })
  .sort((a, b) => a.score - b.score || b.weight - a.weight || a.id.localeCompare(b.id));
const total = ranked.reduce((n, r) => n + r.weight, 0);
const byCheck = {};
for (const r of ranked) for (const [k, v] of Object.entries(r.byCheck)) byCheck[k] = (byCheck[k] ?? 0) + v;
const checkList = Object.entries(byCheck).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
const summary = { total, items: ranked.length, mean: +(ranked.reduce((n, r) => n + r.score, 0) / ranked.length).toFixed(1), clean: ranked.filter((r) => r.weight === 0).length, byCheck, seconds: Math.round((performance.now() - t0) / 1000) };

console.log(`\nweighted defects ${total} · mean score ${summary.mean} · ${summary.clean}/${ranked.length} items clean · ${summary.seconds}s`);
console.log(checkList);
for (const r of ranked.slice(0, 25)) console.log(`${String(r.score).padStart(3)}  ${r.kind.padEnd(6)} ${r.id.padEnd(44)} ${Object.entries(r.byCheck).map(([k, v]) => `${k}:${v}`).join(" ")}`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ summary, ranked }, null, 1));
if (mdOut) {
  const cell = (s) => s.replace(/\|/g, "\\|");
  const rows = ranked.map((r, i) => `| ${i + 1} | ${r.score} | ${r.kind} | \`${r.id}\` | ${cell(r.title)} | ${Object.entries(r.byCheck).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ") || "clean"} |`);
  const worst = ranked
    .filter((r) => r.weight)
    .slice(0, 30)
    .map((r) => `### ${r.title} (\`${r.id}\`), ${r.score}\n\n${[...r.findings].sort((a, b) => WEIGHT[b.severity] - WEIGHT[a.severity]).slice(0, 12).map((f) => `- ${f.severity} \`${f.check}\` ${cell(f.el)}: ${cell(f.detail)} (${f.where.length === 1 ? f.where[0] : `${f.where.length} runs`})`).join("\n")}`);
  writeFileSync(
    mdOut,
    `# Signal scorecard\n\nGenerated by \`node scripts/score.mjs --md docs/scorecard.md\` against the dev showcase. An item scores 100 minus the weight of its findings (critical 10, major 5, minor 1); the total weight is the number to bring down. \`scripts/score.mjs\` describes every check.\n\n- Weighted defects: **${total}**\n- Mean score: **${summary.mean}**\n- Clean items: **${summary.clean} of ${ranked.length}**\n- By check: ${checkList}\n\n## Ranking\n\n| # | Score | Kind | Id | Title | Weight by check |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n\n## Worst items\n\n${worst.join("\n\n")}\n`,
  );
}
