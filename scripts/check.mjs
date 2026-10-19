/**
 * Hard-rule sweep of the showcase pages in Chromium and WebKit.
 *
 *   node scripts/check.mjs [baseUrl] [screenshotDir]
 *
 * Pages: the components page, the Signal App Shell, and the prebuilt
 * dist/signal.css loaded without Tailwind (scripts/standalone.html).
 * Fails on: console errors, a font face that did not load, any rounded
 * corner, any blurred shadow (glow), any gradient, horizontal scroll at
 * phone width, and broken JS behaviors.
 */
import { existsSync, readFileSync } from "node:fs";
import { chromium, webkit } from "playwright";
import { sweep as rulesSweep } from "../bin/rules.mjs";

const base = (process.argv[2] || "http://localhost:5178/").replace(/\/?$/, "/");
const pages = {
  components: base,
  shell: `${base}shell.html`,
  chat: `${base}chat.html`,
  form: `${base}form.html`,
  landing: `${base}landing.html`,
  charts: `${base}charts.html`,
  standalone: new URL("./standalone.html", import.meta.url).href,
};
if (!existsSync(new URL("../dist/signal.css", import.meta.url))) {
  console.log("FAIL dist/signal.css missing: run pnpm build:css first");
  process.exit(1);
}
const shots = process.argv[3];
const engines = { chromium, webkit };
const themes = ["ink", "graphite", "paper"];
// Desktop, small laptop, tablet, phone. The in-between widths run in ink only.
const widths = [1280, 1024, 768, 375];
let failures = 0;

function fail(where, msg) {
  failures++;
  console.log(`FAIL ${where}: ${msg}`);
}

// The hard-rule sweep is shared with the `signal-design check` CLI.
const sweep = rulesSweep;

async function checkCopy(page, name) {
  await page.goto(base);
  const result = await page.evaluate(async () => {
    const errors = [];
    let assertions = 0;
    const assert = (ok, message) => { assertions++; if (!ok) errors.push(message); };
    const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    const root = document.createElement("div");
    root.innerHTML = '<pre id="copy-behavior-line" tabindex="0"><code>npm test</code></pre><button data-sd-copy="#copy-behavior-line">Copy</button>';
    document.body.append(root);
    const written = [];
    const profiles = [
      { name: "absent", clipboard: undefined, message: "Copy unavailable. Select the line instead.", tone: "danger" },
      { name: "rejected", clipboard: { writeText: () => Promise.reject(new DOMException("Denied", "NotAllowedError")) }, message: "Copy unavailable. Select the line instead.", tone: "danger" },
      { name: "success", clipboard: { writeText: async (text) => { written.push(text); } }, message: "Copied", tone: "success" },
    ];
    try {
      for (const profile of profiles) {
        document.querySelector(".sd-toaster")?.replaceChildren();
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: profile.clipboard });
        root.querySelector("button").click();
        await Promise.resolve();
        await Promise.resolve();
        const toasts = [...document.querySelectorAll(".sd-toaster .sd-toast")];
        assert(toasts.length === 1, `${profile.name}: expected one copy toast, got ${toasts.length}`);
        assert(toasts[0]?.textContent === profile.message, `${profile.name}: copy feedback text ${toasts[0]?.textContent}`);
        assert(toasts[0]?.dataset.tone === profile.tone, `${profile.name}: copy feedback tone ${toasts[0]?.dataset.tone}`);
      }
      assert(written.join("|") === "npm test", `success: clipboard payload ${written.join("|")}`);
    } finally {
      if (original) Object.defineProperty(navigator, "clipboard", original);
      else delete navigator.clipboard;
      root.remove();
      document.querySelector(".sd-toaster")?.replaceChildren();
    }
    return { errors, assertions };
  });
  for (const error of result.errors) fail(`${name} copy`, error);
  if (!result.errors.length) console.log(`ok   ${name} copy ${result.assertions} behavioral assertions`);
}

for (const [name, engine] of Object.entries(engines)) {
  const browser = await engine.launch();
  for (const [pageName, url] of Object.entries(pages)) {
  for (const width of widths) {
    for (const theme of themes) {
      if ((width === 1024 || width === 768) && theme !== "ink") continue;
      const where = `${name} ${pageName} ${width}px ${theme}`;
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript((t) => {
        try { localStorage.setItem("sd-theme", t); localStorage.removeItem("sd-shell-sidebar"); } catch {}
      }, theme);
      await page.goto(url, { waitUntil: "networkidle" });
      if (pageName === "standalone") await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      await page.evaluate(() => document.fonts.ready);

      for (const e of errors) fail(where, `console: ${e}`);
      const actual = await page.evaluate(() => document.documentElement.dataset.theme);
      if (actual !== theme) fail(where, `theme is ${actual}`);
      const faces = await page.evaluate(async () => {
        await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
        return [...document.fonts].filter((f) => f.family.includes("Source Code Pro")).map((f) => `${f.weight}:${f.status}`);
      });
      if (faces.length < 2 || faces.some((f) => !f.endsWith("loaded"))) fail(where, `fonts ${faces.join(" ") || "none"}`);

      for (const b of (await page.evaluate(sweep)).slice(0, 15)) fail(where, b);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0) {
        const culprits = await page.evaluate(() =>
          [...document.querySelectorAll("body *")]
            .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
            .slice(0, 5)
            .map((el) => el.outerHTML.slice(0, 90)),
        );
        fail(where, `horizontal overflow ${overflow}px: ${culprits.join(" | ")}`);
      }

      if (shots && theme !== "graphite") {
        await page.screenshot({ path: `${shots}/${name}-${pageName}-${width}-${theme}.png`, fullPage: pageName !== "shell" });
      }

      if (pageName === "standalone" && theme === "ink" && width === 1280) {
        const probe = await page.evaluate(() => ({
          btn: getComputedStyle(document.querySelector(".sd-btn-primary")).backgroundColor,
          primary: (() => {
            const probe = document.createElement("span");
            probe.style.color = "var(--sd-primary)";
            document.body.append(probe);
            const c = getComputedStyle(probe).color;
            probe.remove();
            return c;
          })(),
          h2: getComputedStyle(document.querySelector("h2")).fontSize,
        }));
        if (probe.btn !== probe.primary) fail(where, `primary button background ${probe.btn}, token ${probe.primary}`);
        if (probe.h2 !== "28px") fail(where, `h2 font-size ${probe.h2}`);
        const dist = readFileSync(new URL("../dist/signal.css", import.meta.url), "utf8");
        for (const k of ["sd-rise-in", "sd-fade-in", "sd-slide-in", "sd-peek-in"]) if (!dist.includes(`@keyframes ${k}`)) fail(where, `keyframes ${k} missing from dist`);
      }

      if (pageName === "shell") {
        const state = () => page.evaluate(() => ({ ...document.getElementById("shell").dataset, mainInert: document.getElementById("main").inert }));
        if (width === 1280 && theme === "ink") {
          await page.keyboard.press("]");
          if ((await state()).aside !== "open") fail(where, "] did not open the aside");
          await page.keyboard.press("]");
          await page.keyboard.press("[");
          if ((await state()).sidebar !== "collapsed") fail(where, "[ did not collapse the sidebar");
          await page.click('.sd-rail-item[data-sd-section="teams"]');
          const peek = await page.evaluate(() => ({ peek: "peek" in document.getElementById("shell").dataset, visible: !!document.querySelector('.sd-sidebar-panel[data-section="teams"]').offsetParent }));
          if (!peek.peek || !peek.visible) fail(where, `rail click did not peek the teams panel ${JSON.stringify(peek)}`);
          await page.keyboard.press("Escape");
          if ("peek" in (await state())) fail(where, "Escape did not close the peek");
          await page.click('.sd-rail-item[data-sd-section="projects"]');
          await page.keyboard.press("Escape");
          await page.keyboard.press("[");
          if ((await state()).sidebar === "collapsed") fail(where, "[ did not pin the sidebar again");
          await page.keyboard.press("Control+k");
          if (!(await page.evaluate(() => document.getElementById("palette").open))) fail(where, "Ctrl K did not open the palette");
          await page.keyboard.press("Escape");
          // WebKit returns focus from a closed modal a moment later; wait for it like a person would.
          await page.waitForFunction(() => !document.getElementById("palette").open && !document.getElementById("palette").contains(document.activeElement), null, { timeout: 1000 }).catch(() => {});
          await page.keyboard.press("a");
          const done = await page.evaluate(() => document.querySelector('.sd-row[data-n="21"]').hasAttribute("data-done"));
          if (!done) fail(where, "a did not approve the focused item");
        }
        if (width === 375 && theme === "ink") {
          await page.click('.sd-shell-topbar [data-sd-shell="drawer"]');
          const s = await state();
          if (!("drawer" in s) || !s.mainInert) fail(where, `drawer did not open with the page inert ${JSON.stringify(s)}`);
          await page.click(".sd-shell-scrim", { position: { x: 360, y: 400 } });
          if ("drawer" in (await state())) fail(where, "scrim click did not close the drawer");
        }
      }

      // A skip link comes first in tab order and shows when focused.
      if (width === 1280 && theme === "ink" && pageName !== "standalone") {
        const skip = await page.evaluate(() => {
          const focusable = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled && el.tabIndex >= 0);
          const link = document.querySelector(".sd-skip");
          if (!link) return "missing";
          if (focusable[0] !== link) return `first focusable is ${focusable[0]?.className || focusable[0]?.tagName}`;
          link.focus();
          const shown = link.getBoundingClientRect().top >= 0;
          link.blur();
          return shown ? "" : "not visible when focused";
        });
        if (skip) fail(where, `skip link: ${skip}`);
      }

      // Shift+T steps the theme on every page.
      if (width === 1280 && theme === "ink" && pageName !== "standalone") {
        await page.locator("body").press("Shift+T");
        const now = await page.evaluate(() => document.documentElement.dataset.theme);
        if (now !== "graphite") fail(where, `Shift+T gave theme ${now}`);
        await page.locator("body").press("Shift+T");
        await page.locator("body").press("Shift+T");
        await page.locator("body").press("Shift+T");
        if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== "ink") fail(where, "Shift+T did not come back to ink");
      }

      if (pageName === "chat" && width === 1280 && theme === "ink") {
        const box = page.locator("[data-composer] textarea");
        await box.click();
        await box.type("Hi @al");
        const shown = await page.evaluate(() => !document.getElementById("mentions").hidden && [...document.querySelectorAll('#mentions [role="option"]:not([hidden])')].map((o) => o.dataset.value).join(","));
        if (shown !== "Alex") fail(where, `mention suggestions showed ${shown}`);
        await page.keyboard.press("Enter");
        if (!(await box.inputValue()).startsWith("Hi @Alex ")) fail(where, `mention not inserted: ${await box.inputValue()}`);
        await page.keyboard.press("Enter");
        const sent = await page.evaluate(() => [...document.querySelectorAll("[data-feed] .sd-message-text")].at(-1).textContent.trim());
        if (sent !== "Hi @Alex") fail(where, `send appended "${sent}"`);
        const r = page.locator("[data-sd-reaction]").first();
        const before = await r.locator("b").textContent();
        await r.click();
        const after = await r.locator("b").textContent();
        if (Number(after) !== Number(before) - 1 || (await r.getAttribute("aria-pressed")) !== "false") fail(where, `reaction toggle ${before}->${after}`);
        await page.locator(".sd-poll-option").nth(1).click();
        const votes = await page.evaluate(() => [...document.querySelectorAll(".sd-poll-option")].map((o) => o.getAttribute("aria-pressed")).join(","));
        if (votes !== "false,true,false") fail(where, `poll votes ${votes}`);
        await page.locator(".sd-message").first().click({ button: "right" });
        if (!(await page.evaluate(() => document.getElementById("msg-menu").matches(":popover-open")))) fail(where, "context menu did not open");
        await page.keyboard.press("Escape");
        await page.locator(".sd-message").first().hover();
        await page.locator('.sd-message >> nth=0 >> [aria-label="React"]').click();
        await page.locator('[data-emoji] [role="option"]', { hasText: "🎉" }).click();
        const party = await page.evaluate(() => [...document.querySelectorAll(".sd-message")][0].querySelector(".sd-reactions").textContent.includes("🎉"));
        if (!party) fail(where, "emoji picker did not add a reaction");
      }

      if (pageName === "components" && width === 1280 && theme === "ink") {
        // Every block flips between preview and code in place.
        const flips = await page.evaluate(() => {
          const blocks = [...document.querySelectorAll(".demo-block")];
          return { blocks: blocks.length, toggles: blocks.filter((b) => b.querySelector(":scope > .demo-head [data-view='code']")).length };
        });
        if (!flips.blocks || flips.toggles !== flips.blocks) fail(where, `code toggles ${flips.toggles} of ${flips.blocks} blocks`);
        const buttons = page.locator("#components-buttons");
        await buttons.locator(".demo-head [data-view='code']").click();
        const view = await buttons.evaluate((b) => ({
          code: b.querySelector(".demo-code pre")?.textContent ?? "",
          preview: getComputedStyle(b.querySelector(".sd-actions")).display,
        }));
        if (!view.code.startsWith('<div class="sd-actions">') || view.preview !== "none") fail(where, `code view ${JSON.stringify({ start: view.code.slice(0, 30), preview: view.preview })}`);
        await buttons.locator(".demo-head [data-view='preview']").click();

        // Behaviors
        await page.click('[data-sd-open="demo-dialog"]');
        if (!(await page.evaluate(() => document.getElementById("demo-dialog").open))) fail(where, "dialog did not open");
        await page.click("#demo-dialog [data-sd-close]");
        if (await page.evaluate(() => document.getElementById("demo-dialog").open)) fail(where, "dialog did not close");

        await page.click('[popovertarget="row-menu"]');
        await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menuitem", null, { timeout: 1000 }).catch(() => {});
        const pos = await page.evaluate(() => {
          const p = document.getElementById("row-menu");
          const t = document.querySelector('[popovertarget="row-menu"]').getBoundingClientRect();
          const r = p.getBoundingClientRect();
          return { open: p.matches(":popover-open"), gap: Math.round(r.top - t.bottom), focused: document.activeElement?.getAttribute("role") };
        });
        if (!pos.open) fail(where, "popover did not open");
        if (pos.gap < 0 || pos.gap > 12) fail(where, `popover not anchored (gap ${pos.gap})`);
        if (pos.focused !== "menuitem") fail(where, `menu did not focus first item (${pos.focused})`);
        await page.keyboard.press("ArrowDown");
        const second = await page.evaluate(() => document.activeElement?.textContent.trim());
        if (!second?.startsWith("Copy link")) fail(where, `ArrowDown landed on "${second}"`);
        await page.keyboard.press("Escape");

        await page.click("#t-checks");
        const tabs = await page.evaluate(() => [document.getElementById("tab-checks").hidden, document.getElementById("tab-proof").hidden]);
        if (tabs[0] || !tabs[1]) fail(where, "tabs did not switch");

        await page.click('[data-sd-toggle="detail-21"]');
        await page.waitForTimeout(260);
        const h = await page.evaluate(() => document.getElementById("detail-21").getBoundingClientRect().height);
        if (h < 100) fail(where, `expand did not open (height ${h})`);

        await page.click('#components [data-sd-seg] button:nth-child(2)');
        const seg = await page.evaluate(() => document.querySelector("#components [data-sd-seg] button:nth-child(2)").getAttribute("aria-pressed"));
        if (seg !== "true") fail(where, "segmented did not select");

        // Combobox: filter, pick with the keyboard.
        await page.locator("#demo-combo").click();
        await page.keyboard.type("lis");
        await page.keyboard.press("Enter");
        if ((await page.locator("#demo-combo").inputValue()) !== "Lisbon") fail(where, `combobox picked ${await page.locator("#demo-combo").inputValue()}`);
        // Tags: add with Enter, remove with Backspace.
        await page.locator("#demo-tags").click();
        await page.keyboard.type("ux");
        await page.keyboard.press("Enter");
        let tags = await page.evaluate(() => [...document.querySelectorAll("[data-sd-tags] .sd-chip")].map((c) => c.dataset.value).join(","));
        if (!tags.endsWith("design,ux")) fail(where, `tags after add: ${tags}`);
        await page.keyboard.press("Backspace");
        tags = await page.evaluate(() => [...document.querySelectorAll("#inputs-more [data-sd-tags] .sd-chip")].map((c) => c.dataset.value).join(","));
        if (tags !== "design") fail(where, `tags after backspace: ${tags}`);
        // Number: stops at max.
        for (let i = 0; i < 8; i++) await page.locator('#inputs-more [data-step="1"]').click({ force: true });
        const n = await page.locator("#demo-number").inputValue();
        const plusDisabled = await page.locator('#inputs-more [data-step="1"]').isDisabled();
        if (n !== "9" || !plusDisabled) fail(where, `number ${n}, plus disabled ${plusDisabled}`);
        // Palette: Ctrl K opens, typing filters, Escape closes.
        await page.locator("body").click({ position: { x: 5, y: 5 } });
        await page.keyboard.press("Control+k");
        if (!(await page.evaluate(() => document.getElementById("demo-palette").open))) fail(where, "palette did not open");
        await page.keyboard.type("form");
        const shownOpts = await page.evaluate(() => [...document.querySelectorAll('#demo-palette [role="option"]:not([hidden])')].map((o) => o.textContent.trim()));
        if (shownOpts.length !== 1 || !shownOpts[0].startsWith("Form")) fail(where, `palette filter showed ${shownOpts.join(" | ")}`);
        await page.keyboard.press("Escape");
        // Shortcuts sheet opens on "?".
        await page.keyboard.press("Shift+Slash");
        if (!(await page.evaluate(() => document.getElementById("demo-shortcuts").open))) fail(where, "? did not open shortcuts");
        await page.keyboard.press("Escape");

        await page.click('[data-sd-theme="paper"]');
        if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== "paper") fail(where, "theme button failed");
        // "light" is the older name for paper: a light button still sets paper.
        await page.evaluate(() => {
          const b = document.createElement("button");
          b.dataset.sdTheme = "light";
          b.id = "alias-check";
          document.body.append(b);
          b.click();
          b.remove();
        });
        const aliased = await page.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem("sd-theme")].join(","));
        if (aliased !== "paper,paper") fail(where, `data-sd-theme="light" gave ${aliased}`);
      }
      if (pageName === "charts" && width === 1280 && theme === "ink") {
        const core = () => page.evaluate(() => {
          const c = document.querySelector("#core canvas").sdChart.chart;
          return {
            newest: c.$sd.newestX,
            yMax: c.scales.y.max,
            hidden: c.data.datasets.filter((_, i) => !c.isDatasetVisible(i)).map((d) => d.label),
            down: c.data.datasets.find((d) => d.label === "Core ↓")._color,
          };
        });
        // Drawn: the canvas has plenty of non-empty pixels.
        const inked = await page.evaluate(() => {
          const cv = document.querySelector("#core canvas");
          const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
          let n = 0;
          for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
          return n;
        });
        if (inked < 5000) fail(where, `core chart looks blank (${inked} pixels)`);
        // Mono keeps series grey.
        const mono = (await core()).down;
        if (Math.max(mono.r, mono.g, mono.b) - Math.min(mono.r, mono.g, mono.b) > 12) fail(where, `mono series is colored ${JSON.stringify(mono)}`);
        // Hover: the tooltip lists bandwidth and latency with units.
        await page.locator("#core canvas:not(.sd-chart-fx)").scrollIntoViewIfNeeded();
        const box = await page.locator("#core canvas:not(.sd-chart-fx)").boundingBox();
        await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
        await page.waitForTimeout(150);
        const tip = await page.evaluate(() => {
          const t = document.querySelector("#core canvas").sdChart.chart.tooltip;
          return t.opacity ? t.body.flatMap((b) => b.lines).join(" | ") : "";
        });
        if (!/bps/.test(tip) || !/ ms/.test(tip)) fail(where, `tooltip "${tip}"`);
        await page.mouse.move(5, 5);
        // Legend: clicking a key hides that series.
        const hit = await page.evaluate(() => {
          const c = document.querySelector("#core canvas").sdChart.chart;
          const i = c.legend.legendItems.findIndex((l) => l.text === "Core ↑");
          const h = c.legend.legendHitBoxes[i];
          return h && { x: h.left + h.width / 2, y: h.top + h.height / 2 };
        });
        if (!hit) fail(where, "legend has no Core ↑ key");
        else {
          // Chart.js handles pointer events on the next animation frame.
          await page.mouse.click(box.x + hit.x, box.y + hit.y);
          await page.waitForTimeout(100);
          if (!(await core()).hidden.includes("Core ↑")) fail(where, "legend click did not hide Core ↑");
          await page.mouse.click(box.x + hit.x, box.y + hit.y);
          await page.waitForTimeout(100);
        }
        // Scale modes change the axis and are remembered.
        await page.click('#core [data-sd-chart-scale] [data-value="p90"]');
        const p90Max = (await core()).yMax;
        await page.click('#core [data-sd-chart-scale] [data-value="linear"]');
        const linearMax = (await core()).yMax;
        if (!(linearMax > p90Max)) fail(where, `linear max ${linearMax} not above p90 max ${p90Max}`);
        await page.click('#core [data-sd-chart-scale] [data-value="log"]');
        const logType = await page.evaluate(() => document.querySelector("#core canvas").sdChart.chart.scales.y.type);
        if (logType !== "sdSymlog") fail(where, `log mode scale type ${logType}`);
        await page.click('#core [data-sd-chart-scale] [data-value="clamp"]');
        // Live: the feed appends a point every 2 seconds.
        const before = (await core()).newest;
        await page.waitForTimeout(2300);
        if (!((await core()).newest > before)) fail(where, "live feed did not move the newest point");
        // Gallery: every generic chart draws, and the square charts render.
        // Charts build as they come near the screen, so visit each one.
        for (const fig of await page.locator('[id^="g-"] canvas:not(.sd-chart-fx)').all()) {
          await fig.scrollIntoViewIfNeeded();
          await page.waitForTimeout(60);
        }
        await page.waitForTimeout(200);
        const blank = await page.evaluate(() =>
          [...document.querySelectorAll('[id^="g-"] canvas:not(.sd-chart-fx)')]
            .filter((cv) => {
              const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
              let n = 0;
              for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
              return n < 2000;
            })
            .map((cv) => cv.closest("figure").id),
        );
        if (blank.length) fail(where, `blank gallery charts: ${blank.join(", ")}`);
        const squares = await page.evaluate(() => ({
          heat: document.querySelectorAll("[data-heat] > i").length,
          waffle: document.querySelectorAll("[data-waffle] > i").length,
          waffleW: document.querySelector("[data-waffle]").getBoundingClientRect().width,
          uptime: document.querySelectorAll(".sd-uptime > i").length,
        }));
        if (squares.heat !== 168 || squares.waffle !== 100 || squares.waffleW < 150 || squares.uptime !== 360) fail(where, `square charts ${JSON.stringify(squares)}`);
        // Theme: spectrum colors the series.
        await page.click('#chart-theme [data-value="spectrum"]');
        await page.waitForTimeout(200);
        const spec = (await core()).down;
        if (!(spec.g > spec.r + 60)) fail(where, `spectrum download is not green ${JSON.stringify(spec)}`);
        await page.click('#chart-theme [data-value="mono"]');
      }
      await page.close();
      console.log(`ok   ${where}`);
    }
  }
  }
  const behaviorPage = await browser.newPage();
  await checkCopy(behaviorPage, name);
  await behaviorPage.close();
  await browser.close();
}

// Chart formatting and scale maths, checked without a browser.
{
  const { formatValue } = await import("../src/js/charts/format.js");
  const { scaleBounds, smooth } = await import("../src/js/charts/data.js");
  const { symlogForward, symlogInverse } = await import("../src/js/charts/scales.js");
  const expect = { "1500|Mbps": "1.5 Gbps", "250000|Mbps": "250 Gbps", "0.5|Mbps": "500 Kbps", "1200000|Mbps": "1.20 Tbps", "12.3| ms": "12.3 ms", "0|Mbps": "0 Mbps" };
  for (const [k, want] of Object.entries(expect)) {
    const [v, unit] = k.split("|");
    const got = formatValue(Number(v), unit);
    if (got !== want) fail("format", `formatValue(${v}, "${unit}") = "${got}", want "${want}"`);
  }
  const t = 50;
  for (const v of [-900, 0, 3, 4999]) if (Math.abs(symlogInverse(symlogForward(v, t), t) - v) > 1e-6) fail("symlog", `round trip ${v}`);
  const b = scaleBounds([...Array(99).fill(100), 10000], "clamp");
  if (!(b.max < 10000 && b.ceiling === b.max)) fail("bounds", `clamp did not cut the spike: ${JSON.stringify(b)}`);
  if (smooth([{ x: 0, y: 1 }, { x: 1, y: null }, { x: 2, y: 5 }])[1].y !== null) fail("smooth", "a gap was filled");
}

console.log(failures ? `\n${failures} failure(s)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
