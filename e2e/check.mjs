/**
 * End to end: the `signal-design check` CLI on sample pages, one per rule.
 *
 *   pnpm build:css && node e2e/check.mjs
 *
 * Each page holds markup that breaks its rule and markup that keeps it, every
 * element with an id. The real CLI loads the page in Chromium (Playwright),
 * and the findings for that rule must name exactly the elements that break
 * it. The pages load the prebuilt dist/signal.css over HTTP, as a project
 * without Tailwind does; one page loads it from a file: URL, which the page
 * cannot read. The CLI's flags (--skip) run on a page of their own.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = join(root, "bin", "signal-design.mjs");
const dist = join(root, "dist");
if (!existsSync(join(dist, "signal.css"))) {
  console.log("FAIL dist/signal.css missing: run pnpm build:css first");
  process.exit(1);
}

const page = ({ theme = "ink", head = "", body, script = "" }) => `<!doctype html>
<html lang="en" data-theme="${theme}">
<head><meta charset="utf-8"><title>Sample</title><link rel="stylesheet" href="/dist/signal.css">
<style>.box{width:20px;height:20px}</style>${head}</head>
<body>
${body}
<script>${script}</script>
</body>
</html>`;

// Reads a theme's --sd-* values in the page, from an element that sets it.
const themeValues = `const values = (theme) => {
  const el = document.createElement("div");
  el.dataset.theme = theme;
  document.body.append(el);
  const s = getComputedStyle(el);
  const found = Object.fromEntries([...s].filter((n) => n.startsWith("--sd-")).map((n) => [n, s.getPropertyValue(n).trim().toLowerCase()]));
  el.remove();
  return found;
};`;
const openPopovers = `for (const p of document.querySelectorAll("[popover]")) p.showPopover();`;
const primary = (label, extra = "") => `<button class="sd-btn sd-btn-primary"${extra}>${label}</button>`;

/**
 * Each sample: a page, the rule it is for, the ids that rule must name (and
 * no others), how often where it is not once, and text a finding must hold.
 */
const samples = [
  {
    name: "type",
    rule: "type",
    html: page({
      body: `<h2 id="bold" style="font-weight:700">text</h2>
<p id="semibold" style="font-weight:600">text</p>
<p id="family" style="font-family:Inter, sans-serif">text</p>
<input id="field" style="font-weight:700" aria-label="Field">
<button id="button" style="font-family:Courier">text</button>
<p id="both" style="font-weight:700;font-family:Inter, sans-serif">text</p>
<p id="regular" style="font-weight:400">text</p>
<p id="medium" style="font-weight:500">text</p>
<p id="sans" style="font-family:var(--sd-font-sans)">text</p>
<p id="mono" style="font-family:var(--sd-font-mono)">text</p>
<p id="reading" style="font-family:var(--sd-font-reading);font-weight:600">text</p>
<p id="reading-bold" style="font-family:var(--sd-font-reading);font-weight:700">text</p>
<div data-font="leon-sans"><p id="face" style="font-family:var(--sd-font-sans)">text</p></div>
<svg width="40" height="20"><text id="graphic" y="14" style="font-weight:700;font-family:Inter">s</text></svg>
<div data-sd-check-ignore="type"><p id="silent" style="font-weight:700;font-family:Inter">text</p></div>
<div data-sd-check-ignore="color"><p id="other-rule" style="font-weight:700">text</p></div>`,
    }),
    named: ["bold", "semibold", "family", "field", "button", "both", "reading-bold", "other-rule"],
    times: { both: 2 },
    says: {
      bold: "h2#bold: font-weight 700 (Signal uses 400 and 500)",
      semibold: "font-weight 600",
      family: 'font-family "Inter" (set it with font-sans or font-mono)',
      button: 'font-family "Courier"',
    },
  },
  {
    name: "color",
    rule: "color",
    html: page({
      body: `<div id="background" class="box" style="background:#3b82f6"></div>
<div id="oklch" class="box" style="background:oklch(0.6 0.2 30)"></div>
<p id="text" style="color:#ff00aa">text</p>
<div id="border" class="box" style="border:2px solid #ee9900"></div>
<div id="outline" class="box" style="outline:2px solid #00aa55"></div>
<div id="token" class="box" style="background:var(--sd-fg);border:1px solid var(--sd-line)"></div>
<div id="tint" class="box"></div>
<div id="tint-srgb" class="box"></div>
<div id="clear" class="box" style="background:transparent;border:2px solid transparent"></div>
<div id="no-border" class="box" style="border:0 solid #ee9900;outline:0 solid #00aa55;outline-style:none"></div>
<p id="who" style="--who:#12ab34;color:var(--who)">name</p>
<div id="edge" class="box" style="--edge:#ab12cd;border-left:2px solid var(--edge)"></div>
<div data-theme="paper"><div id="themed" class="box" style="background:#3b82f6"></div><div id="themed-token" class="box" style="background:var(--sd-fg);border:1px solid var(--sd-line)"></div></div>
<div data-theme="ink"><div><div id="app-root" class="box" style="background:#3b82f6"></div></div></div>
<div id="parent" style="color:#ff00aa"><p id="child-one">one</p><p id="child-two">two</p></div>
<div data-sd-check-ignore="color"><div id="silent" class="box" style="background:#3b82f6"></div></div>
<div data-sd-check-ignore="type"><div id="other-rule" class="box" style="background:#3b82f6"></div></div>
<p id="graphite-only">graphite</p>`,
      // A tint of a token written out by hand keeps the token's channels with
      // a new alpha. A value only graphite's tokens have (its surface, say) is
      // written by hand on a page with no graphite in it.
      script: `${themeValues}
const danger = getComputedStyle(document.documentElement).getPropertyValue("--sd-danger").trim();
document.getElementById("tint").style.background = \`color-mix(in oklab, \${danger} 12%, transparent)\`;
document.getElementById("tint-srgb").style.background = \`color-mix(in srgb, \${danger} 40%, transparent)\`;
const others = new Set([...Object.values(values("ink")), ...Object.values(values("paper"))]);
const only = Object.values(values("graphite")).find((v) => /^#[0-9a-f]{6}$/.test(v) && !others.has(v));
if (only) document.getElementById("graphite-only").style.color = only;`,
    }),
    named: ["background", "oklch", "text", "border", "outline", "themed", "app-root", "parent", "other-rule", "graphite-only"],
    // One finding per side.
    times: { border: 4 },
    says: {
      background: "div#background.box: background-color rgb(59, 130, 246) is the same in every theme (use a --sd-* token)",
      text: "p#text: color rgb(255, 0, 170)",
      border: "border-top-color rgb(238, 153, 0)",
      outline: "outline-color rgb(0, 170, 85)",
    },
  },
  {
    // A script that painted a token's color inline (the ornament glints)
    // keeps it through the rule's flip, which sends no sd:theme. On a page in
    // graphite, graphite's values are tokens.
    name: "color on a graphite page",
    rule: "color",
    html: page({
      theme: "graphite",
      body: `<p id="glint">glints</p>
<div id="surface" class="box"></div>
<div id="hex" class="box" style="background:#3b82f6"></div>`,
      script: `const s = getComputedStyle(document.documentElement);
document.getElementById("glint").style.color = s.getPropertyValue("--sd-fg").trim();
document.getElementById("surface").style.background = s.getPropertyValue("--sd-surface").trim();`,
    }),
    named: ["hex"],
  },
  {
    name: "nav-color",
    rule: "nav-color",
    html: page({
      body: `<h2 id="heading" style="color:var(--sd-accent)">Item</h2>
<nav><a id="link" href="#" style="color:var(--sd-danger)">Item</a></nav>
<a id="sidebar" class="sd-sidebar-link" href="#" style="color:var(--sd-success)">Item</a>
<a id="rail" class="sd-rail-item" href="#" style="color:var(--sd-extra)">Item</a>
<button id="tab" role="tab" style="color:var(--sd-warning)">Item</button>
<ol class="sd-breadcrumb"><li><a id="crumb" href="#" style="color:var(--sd-pending)">Item</a></li></ol>
<h3><svg id="icon" width="16" height="16" viewBox="0 0 16 16" style="color:var(--sd-accent)"><path d="M0 0h16v16H0z" fill="currentColor"/></svg></h3>
<h2 id="grey" style="color:var(--sd-fg-muted)">Item</h2>
<h2 id="plain">Item</h2>
<p id="not-nav" style="color:var(--sd-accent)">Item</p>
<div data-tone="danger"><h2 id="tone" style="color:var(--sd-danger)">Item</h2></div>
<span class="sd-badge"><h2 id="badge" style="color:var(--sd-success)">Item</h2></span>
<span class="sd-count"><h2 id="count" style="color:var(--sd-accent)">Item</h2></span>
<span class="sd-dot"><h2 id="dot" style="color:var(--sd-accent)">Item</h2></span>
<span class="sd-status"><h2 id="status" style="color:var(--sd-extra)">Item</h2></span>
<h4 id="who" style="--who:var(--sd-accent);color:var(--who)">Item</h4>
<div data-sd-check-ignore="nav-color"><h2 id="silent" style="color:var(--sd-accent)">Item</h2></div>
<div data-sd-check-ignore="color"><h2 id="other-rule" style="color:var(--sd-accent)">Item</h2></div>`,
    }),
    named: ["heading", "link", "sidebar", "rail", "tab", "crumb", "icon", "other-rule"],
    says: {
      heading: "is the accent role (navigation and headings stay grey)",
      link: "is the danger role",
      sidebar: "is the success role",
      rail: "is the extra role",
      tab: "is the warning role",
      crumb: "is the pending role",
    },
  },
  {
    name: "label",
    rule: "label",
    html: page({
      body: `<input id="input" placeholder="Search tasks">
<input id="email" type="email" placeholder="you@example.com">
<textarea id="textarea" placeholder="Write a note"></textarea>
<input id="empty-name" placeholder="Name" aria-label="  ">
<label for="for-label">Name</label><input id="for-label" placeholder="Jane Doe">
<label>Name <input id="wrapped" placeholder="Jane Doe"></label>
<input id="aria-label" placeholder="Search" aria-label="Search tasks">
<span id="notes">Notes</span><textarea id="labelledby" placeholder="Write a note" aria-labelledby="notes"></textarea>
<input id="title" placeholder="Search" title="Search tasks">
<input id="no-placeholder" aria-label="Search">
<input id="blank-placeholder" placeholder="  " aria-label="Search">
<input id="checkbox" type="checkbox" placeholder="x">
<input id="radio" type="radio" placeholder="x">
<input id="submit" type="submit" placeholder="x">
<input id="hidden-input" type="hidden" placeholder="x">
<input id="range" type="range" placeholder="x">
<input id="hidden-field" placeholder="Search" hidden>
<div data-sd-check-ignore="label"><input id="silent" placeholder="Search"></div>
<div data-sd-check-ignore="type"><input id="other-rule" placeholder="Search"></div>`,
    }),
    named: ["input", "email", "textarea", "empty-name", "other-rule"],
    says: {
      input: 'input#input: the placeholder "Search tasks" is the only name',
      textarea: 'textarea#textarea: the placeholder "Write a note"',
      "empty-name": 'the placeholder "Name"',
    },
  },
  {
    // The page, an open dialog and an open popover are three views; buttons
    // under data-sd-check-ignore="type" still count.
    name: "primary, two per view",
    rule: "primary",
    html: page({
      body: `${primary("Save")}${primary("Send")}
<div data-sd-check-ignore="type">${primary("Other A")}${primary("Other B")}</div>
<dialog open id="two">${primary("Delete")}${primary("Keep")}</dialog>
<div popover="manual" id="pop-two">${primary("Apply")}${primary("Reset")}</div>`,
      script: openPopovers,
    }),
    lines: [
      ["the page has 4 primary buttons (one per view)", '"Save"', '"Send"', '"Other A"', '"Other B"'],
      ["dialog#two has 2 primary buttons", '"Delete"', '"Keep"'],
      ["div#pop-two has 2 primary buttons", '"Apply"', '"Reset"'],
    ],
  },
  {
    name: "primary, one per view",
    rule: "primary",
    html: page({
      body: `<div data-sd-check-ignore="primary">${primary("Ignored A")}${primary("Ignored B")}</div>
<div data-sd-check-ignore="primary">${primary("Ignored C")}</div>
${primary("Save")}<button class="sd-btn sd-btn-ghost">Cancel</button><button class="sd-btn">Other</button>
${primary("Hidden", " hidden")}
<dialog open id="own">${primary("Delete")}</dialog>
<dialog id="closed">${primary("Closed")}</dialog>
<div popover="manual" id="pop-own">${primary("Apply")}</div>`,
      script: openPopovers,
    }),
    lines: [],
  },
];

// A page Signal's CSS is not on: its base layer would hold every radius at
// zero. The page has no text, so only the corner and shadow rules speak.
const box = "width:20px;height:20px";
const shadow = "box-shadow:0 2px 8px #000";
const bare = `<!doctype html><title>t</title>
<div id="round" style="${box};border-radius:8px"></div>
<div id="glow" style="${box};${shadow}"></div>
<div id="hairline" style="${box};box-shadow:0 0 0 1px #888"></div>
<div data-sd-check-ignore="corners shadows"><div id="exempt" style="${box};border-radius:8px;${shadow}"></div></div>
<div data-sd-check-ignore="shadows"><div id="ignored" style="${box};${shadow}"></div></div>
<div data-sd-check-ignore="corners"><div id="other" style="${box};${shadow}"></div></div>
<div data-sd-check-ignore="shadows-extra"><div id="lookalike" style="${box};${shadow}"></div></div>`;

const routes = new Map([...samples.map((s, i) => [`/${i}.html`, s.html]), ["/bare.html", bare]]);
const types = { ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (routes.has(path)) return res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(routes.get(path));
  const file = resolve(dist, `.${path.replace(/^\/dist/, "")}`);
  if (path.startsWith("/dist/") && file.startsWith(dist + sep) && existsSync(file)) {
    return res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  }
  res.writeHead(404).end();
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

/** Runs the CLI at one width; the server keeps serving while it does. */
const run = (url, ...args) =>
  new Promise((done) => {
    const child = spawn(process.execPath, [cli, "check", url, "--widths", "1280", ...args], { cwd: root });
    let out = "";
    child.stdout.on("data", (chunk) => (out += chunk));
    child.stderr.on("data", (chunk) => (out += chunk));
    child.on("close", (code) => done({ code, out }));
  });
const findings = (out) => out.split(/\r?\n/).flatMap((line) => /^FAIL \S+ @\d+px: (.*)$/.exec(line)?.slice(1) ?? []);
/** The id of the element a finding is about: "rule: tag#id.class: ...". */
const subject = (finding) => /^[\w-]+: [\w-]+#([\w-]+)[.:]/.exec(finding)?.[1];

/**
 * A check: its name, and a function that runs it, calls fail for each
 * problem and returns what it showed. Checks run four at a time, so each
 * keeps its own problems.
 */
const checks = [];
const check = (name, body) => checks.push({ name, body });

for (const [i, sample] of samples.entries()) {
  check(sample.name, async (fail) => {
    const { out } = await run(`${base}/${i}.html`);
    const all = findings(out);
    const mine = all.filter((f) => f.startsWith(`${sample.rule}: `));
    if (sample.lines) {
      if (mine.length !== sample.lines.length) fail(`${mine.length} finding(s), wanted ${sample.lines.length}: ${JSON.stringify(mine)}`);
      for (const want of sample.lines) if (!mine.some((f) => want.every((text) => f.includes(text)))) fail(`no finding with ${want.join(", ")}: ${JSON.stringify(mine)}`);
    } else {
      const counts = new Map();
      for (const f of mine) {
        const id = subject(f);
        if (!id) fail(`a finding about an element with no id: ${f}`);
        else counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      for (const id of sample.named) {
        const want = sample.times?.[id] ?? 1;
        if ((counts.get(id) ?? 0) !== want) fail(`#${id} has ${counts.get(id) ?? 0} finding(s), wanted ${want}: ${JSON.stringify(mine)}`);
      }
      for (const [id] of counts) if (!sample.named.includes(id)) fail(`#${id} keeps the rule and was reported: ${JSON.stringify(mine.filter((f) => subject(f) === id))}`);
      for (const [id, text] of Object.entries(sample.says ?? {})) {
        if (!mine.some((f) => subject(f) === id && f.includes(text))) fail(`no finding on #${id} says "${text}": ${JSON.stringify(mine)}`);
      }
    }
    const unnamed = all.filter((f) => !/^[\w-]+: /.test(f));
    if (unnamed.length) fail(`findings that do not start with their rule: ${JSON.stringify(unnamed)}`);
    return `${mine.length} finding(s), each where it belongs`;
  });
}

// A stylesheet the page cannot read (a file: page, or another origin)
// still gives the color rule its tokens.
const dir = mkdtempSync(join(tmpdir(), "signal-e2e-"));
check("color from a file: stylesheet", async (fail) => {
  const file = join(dir, "file.html");
  writeFileSync(
    file,
    page({ body: `<p id="hex" style="color:#3b82f6">hex</p>\n<p id="token" style="color:var(--sd-fg-muted)">token</p>` }).replace(
      'href="/dist/signal.css"',
      `href="${pathToFileURL(join(dist, "signal.css")).href}"`,
    ),
  );
  const { out } = await run(pathToFileURL(file).href, "--skip", "fonts");
  const ids = findings(out).filter((f) => f.startsWith("color: ")).map(subject);
  if (ids.join() !== "hex") fail(`wanted one finding on #hex, got ${JSON.stringify(findings(out))}`);
  return "the hex is reported, the token is not";
});

// Corner and shadow findings name their rule, and data-sd-check-ignore
// silences exactly the rules it lists.
const bareUrl = `${base}/bare.html`;
check("names", async (fail) => {
  const { code, out } = await run(bareUrl, "--skip", "fonts");
  const all = findings(out);
  if (code !== 1) fail(`the CLI exited ${code} on a page with a rounded corner and a blurred shadow`);
  // A radius is reported once per corner, so each id counts once here.
  const said = (rule) => [...new Set(all.filter((f) => f.startsWith(`${rule}: `)).map(subject))].sort().join();
  if (said("corners") !== "round") fail(`corners: wanted #round, got ${JSON.stringify(all)}`);
  if (said("shadows") !== "glow,lookalike,other") fail(`shadows: wanted #glow, #lookalike and #other, got ${JSON.stringify(all)}`);
  return "corners and shadows name their rule, and data-sd-check-ignore silences what it lists";
});

// --skip turns rules off, in either form and repeated, and refuses a name
// it does not know or a flag that names nothing.
const skips = [
  [["--skip", "fonts,corners"], 1, (out) => !out.includes("corners:") && out.includes("shadows: div#glow")],
  [["--skip=fonts,corners"], 1, (out) => !out.includes("corners:") && out.includes("shadows: div#glow")],
  [["--skip", "fonts,corners,shadows"], 0],
  [["--skip", "fonts", "--skip=corners", "--skip", "shadows"], 0],
  [["--skip", "corners,sparkles"], 2, (out) => out.includes("sparkles") && out.includes("shadows")],
  [["--skip=sparkles"], 2, (out) => out.includes("sparkles")],
  [["--skip"], 2],
  [["--skip=fonts", "--skip"], 2],
];
for (const [args, want, holds] of skips) {
  check(`check ${args.join(" ")}`, async (fail) => {
    const { code, out } = await run(bareUrl, ...args);
    if (code !== want) fail(`exited ${code}, wanted ${want}: ${out.trim()}`);
    else if (holds && !holds(out)) fail(`exited ${code} with the wrong findings: ${out.trim()}`);
    return `exit ${code}`;
  });
}

let failures = 0;
try {
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let next; (next = checks.shift()); ) {
        const problems = [];
        const shown = await next.body((what) => problems.push(what));
        failures += problems.length;
        for (const what of problems) console.log(`FAIL ${next.name}: ${what}`);
        if (!problems.length) console.log(`ok   ${next.name}: ${shown}`);
      }
    }),
  );
} finally {
  server.close();
  rmSync(dir, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} failure(s)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
