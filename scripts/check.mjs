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

const base = (process.argv[2] || "http://localhost:5178/").replace(/\/?$/, "/");
const pages = {
  components: base,
  shell: `${base}shell.html`,
  chat: `${base}chat.html`,
  form: `${base}form.html`,
  landing: `${base}landing.html`,
  standalone: new URL("./standalone.html", import.meta.url).href,
};
if (!existsSync(new URL("../dist/signal.css", import.meta.url))) {
  console.log("FAIL dist/signal.css missing: run pnpm build:css first");
  process.exit(1);
}
const shots = process.argv[3];
const engines = { chromium, webkit };
const themes = ["ink", "graphite", "light"];
const widths = [1280, 375];
let failures = 0;

function fail(where, msg) {
  failures++;
  console.log(`FAIL ${where}: ${msg}`);
}

const sweep = () => {
  const bad = [];
  const describe = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).join(".")}` : "");
  for (const el of document.querySelectorAll("body *")) {
    for (const pseudo of [null, "::before", "::after"]) {
      const s = getComputedStyle(el, pseudo);
      if (pseudo && (s.content === "none" || s.content === "normal")) continue;
      const where = describe(el) + (pseudo || "");
      for (const corner of ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"]) {
        if (s[corner] !== "0px") bad.push(`${where} radius ${s[corner]}`);
      }
      if (s.boxShadow !== "none") {
        // Allowed: hairlines drawn as inset or spread-only shadows with zero blur.
        for (const part of s.boxShadow.split(/,(?![^(]*\))/)) {
          const nums = part.replace(/rgba?\([^)]*\)|#[0-9a-f]+/gi, "").match(/-?[\d.]+px/g) || [];
          const [, , blur = "0px"] = nums;
          if (parseFloat(blur) > 0) bad.push(`${where} shadow blur ${part.trim()}`);
        }
      }
      // CSS gradients only: an SVG image may mention gradients inside its url().
      if (/(^|[\s,])(repeating-)?(linear|radial|conic)-gradient\(/.test(s.backgroundImage.replace(/url\([^)]*\)/g, ""))) bad.push(`${where} gradient`);
    }
  }
  return bad;
};

for (const [name, engine] of Object.entries(engines)) {
  const browser = await engine.launch();
  for (const [pageName, url] of Object.entries(pages)) {
  for (const width of widths) {
    for (const theme of themes) {
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

        await page.click('[data-sd-theme="light"]');
        if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== "light") fail(where, "theme button failed");
      }
      await page.close();
      console.log(`ok   ${where}`);
    }
  }
  }
  await browser.close();
}

console.log(failures ? `\n${failures} failure(s)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
