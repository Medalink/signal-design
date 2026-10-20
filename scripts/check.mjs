/**
 * Hard-rule sweep of the showcase pages in Chromium and WebKit.
 *
 *   node scripts/check.mjs [baseUrl] [screenshotDir]
 *
 * Pages: every page in showcase/pages.js (the overview, the library pages and
 * the example apps), and the prebuilt dist/signal.css loaded without Tailwind
 * (scripts/standalone.html).
 * Fails on: console errors, a font face that did not load, any rounded
 * corner, any blurred shadow (glow), any gradient, horizontal scroll at
 * phone width, and broken JS behaviors.
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";
import { sweep as rulesSweep } from "../bin/rules.mjs";
import { checkLivingTable, checkLivingTableTypes } from "./check-living-table.mjs";
import { checkSidebarResize } from "./check-sidebar-resize.mjs";
import { checkHashRedirects, checkShowcasePages } from "./check-showcase-pages.mjs";
import { checkShowcaseBar } from "./check-showcase-bar.mjs";
import { ALL, LIBRARY, byId, keyOf } from "../showcase/pages.js";

// One file per component in scripts/checks/, each exporting
// `default async (page, where, fail)` and `page`, the id of the library page
// (showcase/pages.js) whose blocks it tests. They run on that page once per
// engine, at 1280px in ink. A new check is a new file, not an edit here.
const checksDir = new URL("./checks/", import.meta.url);
const componentChecks = await Promise.all(
  readdirSync(checksDir).filter((f) => f.endsWith(".mjs")).sort().map(async (f) => {
    const mod = await import(new URL(f, checksDir).href);
    if (typeof mod.default !== "function" || !byId(mod.page)) {
      console.log(`FAIL scripts/checks/${f}: needs a default function and \`export const page = "<id>"\` naming a library page (${LIBRARY.map((p) => p.id).join(", ")}); got ${JSON.stringify(mod.page)}`);
      process.exit(1);
    }
    return { file: f, page: mod.page, run: mod.default };
  }),
);

const base = (process.argv[2] || "http://localhost:5178/").replace(/\/?$/, "/");
const apiUrl = `${base}@fs/${fileURLToPath(new URL("../src/js/index.js", import.meta.url)).replace(/\\/g, "/")}`;
const pageUrl = (page) => `${base}${page.file}`;
const pages = {
  ...Object.fromEntries(ALL.map((p) => [keyOf(p), pageUrl(p)])),
  standalone: new URL("./standalone.html", import.meta.url).href,
};
// The behavior tests that build their own elements need only a page that runs init().
const jsPage = pageUrl(byId("js"));
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

try {
  checkLivingTableTypes();
  console.log("ok   living table types 1 strict consumer compilation");
} catch (error) { fail("living table types", error.message); }

async function checkCopy(page, name) {
  await page.goto(jsPage);
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

async function checkCountdown(page, name) {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto(jsPage);
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  let assertions = 0;
  let failed = false;
  const assert = (ok, message) => { assertions++; if (!ok) { failed = true; fail(`${name} countdown`, message); } };
  await page.evaluate(async (apiUrl) => {
    const { mountCountdown } = await import(apiUrl);
    const root = document.createElement("div");
    root.dataset.sdCountdown = "";
    root.innerHTML = '<span data-sd-countdown-value></span><div class="sd-progress" role="progressbar" aria-label="Elapsed time"></div>';
    document.body.append(root);
    const events = [];
    root.addEventListener("sd:countdown", ({ detail }) => events.push(detail));
    window.countdownProbe = { root, events, timer: mountCountdown(root) };
  }, apiUrl);
  const set = (remainingMs, running) => page.evaluate((value) => window.countdownProbe.timer.set(value), { remainingMs, running });
  const read = () => page.evaluate(() => {
    const { root, events } = window.countdownProbe;
    const bar = root.querySelector('[role="progressbar"]');
    return { state: root.dataset.state, value: root.querySelector("[data-sd-countdown-value]").textContent,
      min: bar.getAttribute("aria-valuemin"), max: bar.getAttribute("aria-valuemax"), now: bar.getAttribute("aria-valuenow"),
      text: bar.getAttribute("aria-valuetext"), fill: bar.style.getPropertyValue("--value"), events: events.map((event) => event.state) };
  });
  await set(3000, false);
  let state = await read();
  assert(state.state === "paused" && state.value === "3", "initial paused seconds");
  assert(state.min === "0" && state.max === "100" && state.now === "0" && state.fill === "0", "initial numeric progress");
  await page.clock.runFor(1000);
  assert(JSON.stringify(await read()) === JSON.stringify(state), "paused timer changed");
  await set(1500, true);
  await page.evaluate(() => {
    const probe = window.countdownProbe;
    probe.attributes = [];
    probe.observer = new MutationObserver((records) => probe.attributes.push(...records.map((record) => record.attributeName)));
    probe.observer.observe(probe.root, { subtree: true, attributes: true,
      attributeFilter: ["data-state", "aria-valuemin", "aria-valuemax", "aria-valuetext"] });
  });
  await page.clock.runFor(600);
  state = await read();
  assert(state.state === "running" && state.value === "1" && state.now === "70" && state.fill === "70", "running deadline/progress");
  assert(state.text === "1 second remaining, running", "accessible remaining time");
  assert(state.events.join(",") === "paused,running", "ticks emitted state changes");
  const attributes = await page.evaluate(() => {
    window.countdownProbe.observer.disconnect();
    return window.countdownProbe.attributes;
  });
  assert(attributes.join(",") === "aria-valuetext", "unchanged state or ARIA produced duplicate mutations");
  await set(900, false);
  state = await read();
  await page.clock.runFor(2000);
  assert(JSON.stringify(await read()) === JSON.stringify(state), "pause lost supplied remaining time");
  await set(900, true);
  await page.clock.runFor(500);
  assert((await read()).now === "87", "resume did not retain elapsed progress");
  await set(4000, true);
  state = await read();
  assert(state.now === "0" && state.value === "4", "authoritative extension did not resync");
  await page.clock.runFor(1000);
  assert((await read()).now === "25" && (await read()).value === "3", "resynced deadline did not run");
  await page.clock.fastForward(5000);
  state = await read();
  assert(state.state === "complete" && state.value === "0" && state.now === "100" && state.fill === "100", "delayed tick did not complete at deadline");
  assert(state.events.filter((event) => event === "complete").length === 1, "completion emitted more than once");
  await set(-100, true);
  assert((await read()).state === "complete" && (await read()).value === "0", "negative time was not clamped");
  await set(2000, true);
  assert((await read()).now === "0" && (await read()).state === "running", "new countdown after completion did not reset duration");
  await page.evaluate(() => window.countdownProbe.timer.dispose());
  state = await read();
  await page.clock.runFor(5000);
  await set(1000, true);
  assert(JSON.stringify(await read()) === JSON.stringify(state), "dispose left updates or events active");
  await page.evaluate(() => { window.countdownProbe.root.remove(); delete window.countdownProbe; });
  if (!failed) console.log(`ok   ${name} countdown ${assertions} behavioral assertions`);
}
function checkFeedTypes() {
  const dir = mkdtempSync(join(tmpdir(), "signal-feed-types-"));
  const fixture = join(dir, "feed.mts");
  const module = fileURLToPath(new URL("../src/js/index.js", import.meta.url)).replace(/\\/g, "/");
  writeFileSync(fixture, `import { mountFeed, type FeedState } from ${JSON.stringify(module)};
const root = document.createElement("div");
root.addEventListener("sd:feed", (event) => {
  const state: FeedState = event.detail;
  console.log(state.activeId, state.aboveCount);
  // @ts-expect-error FeedState does not include arbitrary properties.
  console.log(event.detail.missing);
});
document.addEventListener("sd:feed", (event) => {
  const state: FeedState = event.detail;
  console.log(state.activeId);
});
mountFeed(root);
`);
  try {
    const program = ts.createProgram([fixture], {
      strict: true, noEmit: true, target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length) fail("feed types", ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (file) => file, getCurrentDirectory: () => dir, getNewLine: () => "\n",
    }));
    else console.log("ok   feed types 1 strict consumer compilation");
    return diagnostics.length === 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}


async function checkLegacyRepeat(page, name) {
  const before = failures;
  await page.goto(pages.shell);
  await page.keyboard.down("j");
  await page.keyboard.down("j");
  await page.keyboard.down("j");
  await page.keyboard.up("j");
  const afterNext = await page.locator('[data-feed] [aria-current="true"]').getAttribute("data-n");
  if (afterNext !== "18") fail(name, `holding j should reach row 18, got ${afterNext}`);
  await page.locator('[data-feed] [data-n="18"]').click({ position: { x: 10, y: 10 } });
  const startPrevious = await page.locator('[data-feed] [aria-current="true"]').getAttribute("data-n");
  if (startPrevious !== "18") fail(name, `holding k should start from row 18, got ${startPrevious}`);
  for (const expected of ["19", "20", "21"]) {
    await page.keyboard.down("k");
    const afterPrevious = await page.locator('[data-feed] [aria-current="true"]').getAttribute("data-n");
    if (afterPrevious !== expected) fail(name, `holding k should reach row ${expected}, got ${afterPrevious}`);
  }
  await page.keyboard.up("k");
  await page.goto(jsPage);
  await page.evaluate(async (apiUrl) => {
    const { hotkeys } = await import(apiUrl);
    window.repeatProbe = { calls: 0, repeatedCalls: 0 };
    window.repeatProbe.off = hotkeys({ x: () => window.repeatProbe.calls++ }, { repeat: false });
    window.repeatProbe.offRepeated = hotkeys({ y: () => window.repeatProbe.repeatedCalls++ });
  }, apiUrl);
  await page.keyboard.down("x");
  await page.keyboard.down("x");
  await page.keyboard.up("x");
  await page.keyboard.down("y");
  await page.keyboard.down("y");
  await page.keyboard.up("y");
  const { calls, repeatedCalls } = await page.evaluate(() => {
    const { calls, repeatedCalls, off, offRepeated } = window.repeatProbe;
    off();
    offRepeated();
    delete window.repeatProbe;
    return { calls, repeatedCalls };
  });
  if (calls !== 1) fail(name, `repeat-disabled action should run once, got ${calls}`);
  if (repeatedCalls !== 2) fail(name, `default-repeat action should run twice, got ${repeatedCalls}`);
  if (failures === before) console.log(`ok   ${name} legacy repeat 7 behavioral assertions`);
}


async function checkModifiedSequence(page, name) {
  await page.goto(jsPage);
  await page.evaluate(async (apiUrl) => {
    const { hotkeys } = await import(apiUrl);
    const root = document.createElement("div");
    root.tabIndex = 0;
    document.body.append(root);
    const calls = [];
    const off = hotkeys({
      "g shift+n": () => calls.push("shift"),
      "g mod+n": () => calls.push("mod"),
      "g alt+n": () => calls.push("alt"),
      "g mod+shift+n": () => calls.push("mod-shift"),
    }, { target: root, sequenceTimeout: 10000 });
    window.modifiedProbe = { root, off, calls };
    root.focus();
  }, apiUrl);
  const mod = await page.evaluate(() => /Mac|iPhone|iPad/.test(navigator.platform) ? "Meta" : "Control");
  for (const [keys, expected] of [["Shift+n", "shift"], [mod + "+n", "mod"], ["Alt+n", "alt"], [mod + "+Shift+n", "mod-shift"]]) {
    await page.keyboard.press("g");
    await page.keyboard.press(keys);
    const calls = await page.evaluate(() => window.modifiedProbe.calls.splice(0));
    if (calls.length !== 1 || calls[0] !== expected) fail(name, `sequence g ${keys} should run ${expected}, got ${JSON.stringify(calls)}`);
  }
  await page.evaluate(() => {
    const { root, off } = window.modifiedProbe;
    off();
    root.remove();
    delete window.modifiedProbe;
  });
  console.log(`ok   ${name} modified sequences 4 behavioral assertions`);
}


async function checkFeedAndHotkeys(page, name) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(jsPage);
  const result = await page.evaluate(async (apiUrl) => {
    const { mountFeed, hotkeys } = await import(apiUrl);
    const errors = [];
    let assertions = 0;
    const assert = (ok, message) => { assertions++; if (!ok) errors.push(message); };
    const wait = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
    const root = document.createElement("div");
    root.dataset.sdFeed = "";
    root.tabIndex = 0;
    root.style.cssText = "position:fixed;top:0;left:0;width:400px;height:200px;overflow:auto;z-index:9999";
    const markup = (i) => `<article class="sd-row" data-id="row-${i}" data-order="${i}" style="height:80px;min-height:80px">Row ${i}</article>`;
    root.innerHTML = Array.from({ length: 12 }, (_, i) => markup(12 - i)).join("");
    document.body.append(root);
    let detail;
    let blocked = false;
    root.addEventListener("sd:feed", (event) => { detail = event.detail; });
    const feed = mountFeed(root, { activeId: "row-7", idleMs: 40, returnDistance: 20,
      returnTarget: () => "row-7", canReturn: () => !blocked });
    const current = () => root.querySelector('[aria-current="true"]')?.dataset.id;
    feed.select("row-7");
    await wait();
    const anchor = () => root.querySelector('[data-id="row-7"]').getBoundingClientRect().top - root.getBoundingClientRect().top;
    const top = anchor();
    feed.beforeUpdate();
    root.innerHTML = markup(13) + root.innerHTML;
    feed.afterUpdate();
    await wait();
    assert(Math.abs(anchor() - top) <= 1 && current() === "row-7", "feed insertion lost stable active anchor");
    assert(detail.aboveCount === 4, `feed above count ${detail.aboveCount}, expected 4`);
    const fallbackTop = root.querySelector('[data-id="row-9"]').getBoundingClientRect().top;
    feed.beforeUpdate();
    root.querySelector('[data-id="row-7"]').remove();
    const fallback = root.querySelector('[data-id="row-9"]');
    feed.afterUpdate();
    assert(Math.abs(fallback.getBoundingClientRect().top - fallbackTop) <= 1 && current() === "row-9", "feed removal lost visible fallback anchor or selection");
    feed.newest();
    assert(current() === "row-13", "feed newest did not use numeric order");
    feed.oldest();
    assert(current() === "row-1", "feed oldest did not use numeric order");
    feed.move(-1);
    assert(current() === "row-2", "feed movement did not follow DOM order");
    feed.select("missing");
    assert(current() === "row-2", "missing feed ID changed selection");
    feed.select("row-5");
    await wait();
    const jumped = root.scrollTop;
    await wait(100);
    assert(root.scrollTop === jumped && !detail.returnPending, "explicit jump armed idle return");
    root.querySelector('[data-id="row-6"]').insertAdjacentHTML("beforebegin", markup(7));
    feed.refresh();
    root.dispatchEvent(new WheelEvent("wheel"));
    root.scrollTop = 0;
    root.dispatchEvent(new Event("scroll"));
    assert(detail.returnPending, "user scroll did not announce idle return");
    blocked = true;
    await wait(100);
    assert(root.scrollTop === 0 && !detail.returnPending, "detail did not suppress pending return");
    blocked = false;
    root.dispatchEvent(new Event("scroll"));
    await wait(100);
    assert(root.scrollTop > 0, "idle return did not center consumer target");
    root.dispatchEvent(new WheelEvent("wheel"));
    root.scrollTop = 0;
    root.dispatchEvent(new Event("scroll"));
    feed.suspend();
    await wait(100);
    assert(root.scrollTop === 0 && !detail.returnPending, "suspend left idle return active");
    feed.suspend(false);
    root.dispatchEvent(new Event("scroll"));
    feed.dispose();
    const state = JSON.stringify(detail);
    await wait(100);
    feed.newest();
    assert(root.scrollTop === 0 && state === JSON.stringify(detail) && root.style.overflowAnchor === "", "feed dispose left work or changed original style");
    root.replaceChildren();
    root.removeAttribute("data-sd-feed");
    const empty = mountFeed(root);
    assert(root.hasAttribute("data-sd-feed"), "explicit mount did not mark its root");
    empty.move(1); empty.oldest(); empty.newest(); empty.beforeUpdate(); empty.afterUpdate();
    assert(detail.activeId === null && detail.aboveCount === 0, "empty feed state is invalid");
    empty.dispose();
    assert(!root.hasAttribute("data-sd-feed"), "dispose did not restore unmarked root");

    root.innerHTML = markup(3) + '<div style="height:800px">Long detail</div>' + markup(2) + markup(1);
    const expanded = mountFeed(root, { activeId: "row-3" });
    root.scrollTop = 300;
    await wait();
    expanded.beforeUpdate();
    root.innerHTML = markup(4) + root.innerHTML;
    expanded.afterUpdate();
    await wait();
    assert(root.scrollTop === 380, "update moved reading position inside tall detail");
    expanded.dispose();
    root.innerHTML = Array.from({ length: 12 }, (_, i) => markup(12 - i)).join("");
    const live = mountFeed(root, { idleMs: 80, returnDistance: 20, returnTarget: () => "row-7" });
    root.scrollTop = 160;
    root.dispatchEvent(new WheelEvent("wheel"));
    root.dispatchEvent(new Event("scroll"));
    assert(detail.returnPending, "live-update fixture did not arm return");
    const pendingStates = [];
    const onPending = ({ detail }) => pendingStates.push(detail.returnPending);
    root.addEventListener("sd:feed", onPending);
    root.dispatchEvent(new Event("scroll"));
    assert(pendingStates.length === 0, "scroll flapped unchanged pending state");
    live.beforeUpdate();
    root.innerHTML = markup(13) + root.innerHTML;
    live.afterUpdate();
    assert(pendingStates.every(Boolean), "update flapped pending state");
    root.removeEventListener("sd:feed", onPending);
    await wait(140);
    assert(root.scrollTop === 390 && !detail.returnPending, "live update canceled an armed idle return");
    root.insertAdjacentHTML("beforeend", '<button aria-expanded="true">Details</button>');
    root.dispatchEvent(new WheelEvent("wheel"));
    root.scrollTop = 0;
    root.dispatchEvent(new Event("scroll"));
    await wait(140);
    assert(root.scrollTop === 0 && !detail.returnPending, "expanded detail did not block default idle return");
    root.querySelector("button").remove();
    live.select("row-5");
    await wait();
    root.scrollTop = 0;
    root.dispatchEvent(new Event("scroll"));
    assert(detail.returnPending, "scrollbar-style scroll after a jump did not rearm return");
    await wait(140);
    assert(root.scrollTop === 390, "scrollbar-style scroll did not return");
    live.dispose();
    root.replaceChildren();

    let sequence = 0;
    let single = 0;
    let native = 0;
    let enabled = true;
    const off = hotkeys({ "g t": () => sequence++, t: () => single++, enter: () => native++, space: () => native++, "mod+x": () => single++ },
      { target: root, sequenceTimeout: 40, enabled: () => enabled });
    const key = (value, target = root, extra = {}) => {
      const event = new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...extra });
      target.dispatchEvent(event);
      return event;
    };
    root.focus();
    key("g"); key("t");
    assert(sequence === 1 && single === 0, "sequence also invoked final single key");
    key("g"); await wait(70); key("t");
    assert(sequence === 1 && single === 1, "sequence timeout did not fall back to single");
    key("g"); enabled = false; key("t"); enabled = true; key("t");
    assert(sequence === 1 && single === 2, "disabled context retained pending prefix");
    key("g"); key("t", root, { repeat: true });
    const handled = new KeyboardEvent("keydown", { key: "t", bubbles: true, cancelable: true });
    handled.preventDefault(); root.dispatchEvent(handled);
    assert(sequence === 1 && single === 2, "repeat or handled event triggered hotkey");
    const input = document.createElement("input");
    root.append(input); input.focus(); key("g", input); key("t", input);
    assert(sequence === 1 && single === 2, "typing invoked shortcuts");
    key("x", input, { ctrlKey: !/Mac|iPhone|iPad/.test(navigator.platform), metaKey: /Mac|iPhone|iPad/.test(navigator.platform) });
    assert(single === 3, "typing blocked the existing mod shortcut behavior");
    const button = document.createElement("button"); root.append(button); button.focus();
    assert(!key("Enter", button).defaultPrevented && !key(" ", button).defaultPrevented && native === 0, "native Enter or Space was intercepted");
    root.focus(); key("g"); input.focus(); root.focus(); key("t");
    assert(sequence === 1 && single === 4, "focus change retained pending sequence");
    const dialog = document.createElement("dialog"); dialog.innerHTML = "<button>Close</button>"; document.body.append(dialog);
    let global = 0;
    const offGlobal = hotkeys({ x: () => global++ });
    const offDialog = hotkeys({ x: () => single++ }, { target: dialog });
    dialog.showModal(); key("x", dialog.querySelector("button"));
    assert(global === 0 && single === 5, "modal shortcut escaped its context");
    dialog.close(); dialog.remove(); offDialog(); offGlobal();
    const lower = document.createElement("dialog");
    const upper = document.createElement("dialog");
    upper.innerHTML = "<button>Top modal</button>";
    document.body.append(upper, lower);
    let stacked = 0;
    const offUpper = hotkeys({ x: () => stacked++ }, { target: upper });
    lower.showModal(); upper.showModal();
    key("x", upper.querySelector("button"));
    assert(stacked === 1, "stacked modal used DOM order instead of event context");
    upper.close(); lower.close(); offUpper(); upper.remove(); lower.remove();
    key("g"); off(); key("t");
    assert(sequence === 1 && single === 5, "hotkey dispose left sequence or listeners");
    root.remove();
    return { errors, assertions };
  }, apiUrl);
  for (const error of result.errors) fail(`${name} feed/hotkeys`, error);
  if (!result.errors.length) console.log(`ok   ${name} feed/hotkeys ${result.assertions} behavioral assertions`);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await page.evaluate(async (apiUrl) => {
    const { mountFeed } = await import(apiUrl);
    const root = document.createElement("div");
    root.style.cssText = "position:fixed;top:0;left:0;width:400px;height:200px;overflow:auto";
    root.innerHTML = Array.from({ length: 12 }, (_, i) => `<article class="sd-row" data-id="motion-${i}" data-order="${i}" style="height:80px;min-height:80px">Row ${i}</article>`).join("");
    document.body.append(root);
    let state;
    root.addEventListener("sd:feed", ({ detail }) => { state = detail; });
    const feed = mountFeed(root, { returnTarget: () => "motion-5", idleMs: 40, returnDistance: 20 });
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    feed.select("motion-11", { behavior: "smooth" });
    await wait(300);
    const jump = root.scrollTop === 760 && !state.returnPending;
    root.scrollTop = 0;
    await wait(350);
    const returned = Math.abs(root.scrollTop - 310) <= 1 && !state.returnPending;
    feed.select("motion-11", { behavior: "smooth" });
    await wait(50);
    feed.dispose();
    const at = root.scrollTop;
    await wait(250);
    const disposed = at === root.scrollTop;
    root.remove();
    return { jump, returned, disposed };
  }, apiUrl);
  for (const [key, passed] of Object.entries(motion)) if (!passed) fail(`${name} feed motion`, key);
  if (Object.values(motion).every(Boolean)) console.log(`ok   ${name} feed motion 3 behavioral assertions`);
}

if (!checkFeedTypes()) process.exit(1);

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

      const library = LIBRARY.find((p) => keyOf(p) === pageName);
      if (library && width === 1280 && theme === "ink") {
        // Every block flips between preview and code in place.
        const flips = await page.evaluate(() => {
          const blocks = [...document.querySelectorAll(".demo-block")];
          return { blocks: blocks.length, toggles: blocks.filter((b) => b.querySelector(":scope > .demo-head [data-view='code']")).length };
        });
        if (!flips.blocks || flips.toggles !== flips.blocks) fail(where, `code toggles ${flips.toggles} of ${flips.blocks} blocks`);
        if (library.id === "components") {
          const buttons = page.locator("#components-buttons");
          await buttons.locator(".demo-head [data-view='code']").click();
          const view = await buttons.evaluate((b) => ({
            code: b.querySelector(".demo-code pre")?.textContent ?? "",
            preview: getComputedStyle(b.querySelector(".sd-actions")).display,
          }));
          if (!view.code.startsWith('<div class="sd-actions">') || view.preview !== "none") fail(where, `code view ${JSON.stringify({ start: view.code.slice(0, 30), preview: view.preview })}`);
          await buttons.locator(".demo-head [data-view='preview']").click();
        }

        await checkShowcasePages(page, where, fail, library);
        for (const check of componentChecks.filter((c) => c.page === library.id)) await check.run(page, where, fail);
      }

      if (library?.id === "components" && width === 1280 && theme === "ink") {
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
      }

      if (library?.id === "inputs-more" && width === 1280 && theme === "ink") {
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
        // Palette: Ctrl K opens, typing filters, Escape closes. Click clear of the page chrome first.
        await page.locator("#inputs-more h2").click();
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
      }

      if (library?.id === "tokens" && width === 1280 && theme === "ink") {
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

  await checkLegacyRepeat(behaviorPage, name);
  await checkModifiedSequence(behaviorPage, name);
  await checkFeedAndHotkeys(behaviorPage, name);
  await checkCountdown(behaviorPage, name);
  await behaviorPage.close();
  const livingPage = await browser.newPage();
  const living = await checkLivingTable(livingPage, base, name);
  for (const error of living.errors) fail("living tables", error);
  console.log(`ok   ${name} living tables ${living.passed} behavior checks`);
  await livingPage.close();
  const resizePage = await browser.newPage();
  const resize = await checkSidebarResize(resizePage, base, apiUrl);
  for (const error of resize.errors) fail(`${name} sidebar resize`, error);
  if (!resize.errors.length) console.log(`ok   ${name} sidebar resize ${resize.passed} behavior checks`);
  await resizePage.close();
  const redirectPage = await browser.newPage();
  const redirects = await checkHashRedirects(redirectPage, base);
  for (const error of redirects.errors) fail(`${name} old links`, error);
  if (!redirects.errors.length) console.log(`ok   ${name} old links ${redirects.passed} hash redirects`);
  await redirectPage.close();
  const bars = await checkShowcaseBar(browser, base, name);
  for (const error of bars.errors) fail(`${name} showcase bar`, error);
  if (!bars.errors.length) console.log(`ok   ${name} showcase bar ${bars.passed} behavior checks`);
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
