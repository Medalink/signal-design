/**
 * Generate the files AI tools and editors read, from the live showcase:
 *
 *   ai/components.json      every block: classes, attributes, HTML, JS, notes
 *   ai/tokens.json          every token, resolved per theme (W3C design tokens)
 *   llms-full.txt           AGENTS.md plus every component snippet, one file
 *   vscode/html-data.json   data-sd-* attribute completions with descriptions
 *   vscode/css-data.json    --sd-* custom property completions with values
 *
 *   node scripts/build-ai.mjs           write the files
 *   node scripts/build-ai.mjs --check   fail if they are out of date (CI)
 *
 * Starts its own Vite server for the showcase, so it needs no dev server.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

/** What each data-sd-* attribute does; the generator fails on an unknown one. */
const ATTRIBUTES = {
  "data-sd-open": "Opens the <dialog> with this id as a modal.",
  "data-sd-close": "Closes the nearest dialog; a value becomes its returnValue.",
  "data-sd-static": "On a dialog: a backdrop click does not close it.",
  "data-sd-toggle": "Opens and closes the .sd-expand with this id; keeps aria-expanded in sync.",
  "data-sd-seg": "Single-select button group (aria-pressed); fires change.",
  "data-sd-key": "Clicks the element when this key combo is pressed (not while typing), e.g. \"a\", \"shift+n\", \"mod+k\".",
  "data-sd-tip": "Tooltip text shown on hover and focus.",
  "data-sd-tip-side": "Tooltip side: top, bottom, left or right.",
  "data-sd-side": "Popover side: top, bottom, left or right.",
  "data-sd-align": "Popover alignment: start, center or end.",
  "data-sd-anchor": "Positions a popover against this selector instead of its trigger.",
  "data-sd-copy": "Copies the text of the element matched by this selector and confirms with a toast.",
  "data-sd-toast": "Shows this text as a toast on click (data-tone colors it).",
  "data-sd-theme": "Switches the theme (ink, graphite, paper, auto) and remembers it.",
  "data-sd-theme-cycle": "Steps to the next theme on click.",
  "data-sd-shell": "App shell control: sidebar (pin/collapse), aside (right panel), drawer (phones) or close.",
  "data-sd-section": "On a rail item: shows the sidebar panel with the same data-section.",
  "data-sd-window": "Title bar window button: minimize, maximize or close (Tauri window API, else an sd:window event).",
  "data-sd-ornaments": "Square-dust ornaments painted as the background: br (default), tl, tr, bl, top, bottom, center or none; space-separated.",
  "data-sd-ornaments-size": "Ornament size in px (default 340).",
  "data-sd-ornaments-still": "Turns off the ornament sparkle on this element.",
  "data-sd-edges": "Replaces the border with the glowing edge (bright corners, faint sides).",
  "data-sd-rain": "Turns a <canvas class=\"sd-rain\"> into the digital rain backdrop.",
  "data-sd-rain-style": "Rain style: glyphs (default) or squares.",
  "data-sd-rain-skip": "Selector for elements that cover the rain, so it skips drawing under them.",
  "data-sd-rain-toggle": "Button that turns the rain on or off (remembered).",
  "data-sd-fps": "Frame-rate counter; the number goes in a child <b>.",
  "data-sd-combobox": "Text input with a filtered listbox (role=combobox, aria-controls).",
  "data-sd-tags": "Tag entry: Enter or comma adds, Backspace removes; hidden inputs carry the values.",
  "data-sd-number": "Number stepper: − and + buttons with data-step.",
  "data-sd-palette": "On a <dialog class=\"sd-command\">: a command palette with filtering and arrow keys.",
  "data-sd-shortcuts": "On a <dialog>: the keyboard shortcut sheet; ? opens it.",
  "data-sd-autogrow": "Textarea grows with its content.",
  "data-sd-enter-submit": "Enter submits the form; Shift+Enter adds a line.",
  "data-sd-suggest": "Id of an .sd-suggest list opened by the trigger character (mentions).",
  "data-sd-trigger": "Character that opens the suggestion list (default @).",
  "data-sd-contextmenu": "Id of a menu opened at the pointer on right click, Shift+F10 or the menu key.",
  "data-sd-reaction": "Reaction toggle with a count; fires sd:reaction.",
  "data-sd-poll": "Poll: choosing an option marks it and reveals the shares.",
  "data-sd-chart": "On a <figure>: init a chart from its JSON <script> (initCharts from signal-design/charts).",
  "data-sd-chart-scale": "Container of buttons (data-value clamp|p95|p90|linear|log) that switch a chart's scale mode.",
  "data-sd-scroll-tab": "Give this scroll box a tab stop while it scrolls (tables and code get one automatically).",
  "data-sd-scrollbars": "Set by init() on <html>: auto hides scrollbars when idle, always keeps them.",
  "data-sd-scrolling": "Set by the JS on a scroller while it moves (scrollbar shows).",
  "data-sd-scrolling-page": "Set by the JS on <html> while anything scrolls (idle motion pauses).",
};

/** What each semantic token is for. */
const ROLES = {
  canvas: "Page background.",
  surface: "Panels a step above the page: rail, sidebar, cards, the shell's content box.",
  raised: "Hover rows and raised controls.",
  overlay: "Popovers, menus, dialogs, tooltips.",
  line: "Hairlines and default borders.",
  "line-strong": "Control borders and dividers that must read.",
  fg: "Main text.",
  "fg-muted": "Secondary text: descriptions, leads, subtitles.",
  "fg-subtle": "Labels and meta.",
  "fg-faint": "The quietest readable text (still 4.5:1): hints, timestamps.",
  primary: "Primary button background.",
  "on-primary": "Text on primary.",
  accent: "Signal: focus, current, selection.",
  success: "Signal: approved, passing, online.",
  danger: "Signal: irreversible, risk, reject, errors.",
  warning: "Signal: costly.",
  pending: "Signal: unproven, waiting, low confidence.",
  extra: "Signal: people and presence.",
  backdrop: "Behind modal dialogs and drawers.",
  "shell-bg": "Behind the app shell's content box, where the rain shows.",
  container: "The app shell's main content box.",
  flash: "Brightest ink: the hover shimmer's highlight.",
};

const server = await createServer({ root: resolve(root, "showcase"), logLevel: "error", server: { port: 0, strictPort: false } });
await server.listen();
const port = server.httpServer.address().port;
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => localStorage.setItem("sd-theme", "ink"));
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForSelector(".demo-code pre", { state: "attached" });

  /* ---- components ------------------------------------------------------ */
  const blocks = await page.evaluate(() =>
    [...document.querySelectorAll(".demo-block")].map((b) => {
      const section = b.closest(".demo-section");
      const pres = [...b.querySelectorAll(":scope > .demo-code pre")];
      const html = pres[0]?.textContent ?? "";
      const usage = [...b.querySelectorAll(":scope > .demo-usage")].map((u) => u.textContent.trim().replace(/\s+/g, " ")).join(" ");
      return {
        id: b.id,
        section: section?.querySelector("h2")?.textContent.trim(),
        title: b.querySelector("h3")?.textContent.trim(),
        usage,
        needsJs: b.querySelector(".demo-code .demo-usage")?.textContent.trim().replace(/\s+/g, " ").replace(/ CSS: .*$/, "") ?? "",
        html,
        js: pres[1]?.textContent ?? null,
      };
    }),
  );
  const unknown = new Set();
  const components = blocks.map((b) => {
    // Classes come from class="" only (data-sd-tip is an attribute, not sd-tip).
    const classAttrs = [...b.html.matchAll(/class="([^"]*)"/g)].map((m) => m[1]).join(" ");
    const classes = [...new Set(classAttrs.split(/\s+/).filter((c) => c.startsWith("sd-")))].sort();
    const attributes = [...new Set(b.html.match(/data-sd-[a-z-]+/g) || [])].sort();
    for (const a of attributes) if (!ATTRIBUTES[a]) unknown.add(a);
    return { id: b.id, section: b.section, title: b.title, classes, attributes, usage: b.usage, js: b.needsJs, html: b.html, ...(b.js ? { script: b.js } : {}) };
  });
  if (unknown.size) throw new Error(`Describe these attributes in ATTRIBUTES: ${[...unknown].join(", ")}`);

  /* ---- tokens ------------------------------------------------------------ */
  const tokens = await page.evaluate(
    ({ ROLES }) => {
      const hex = (text) => {
        const n = (text.match(/[\d.]+/g) || []).map(Number);
        const isColorFn = text.startsWith("color(");
        const [r, g, b, a = 1] = isColorFn ? [n[0] * 255, n[1] * 255, n[2] * 255, n[3] ?? 1] : n;
        const h = (v) => Math.round(v).toString(16).padStart(2, "0");
        return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a * 255) : ""}`;
      };
      const lum = (h) => {
        const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      };
      const ratio = (a, b) => {
        const [x, y] = [lum(a.slice(0, 7)), lum(b.slice(0, 7))].sort((p, q) => q - p);
        return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
      };
      const probe = document.createElement("span");
      document.body.append(probe);
      const color = (expr, host = probe) => {
        host.style.color = "";
        host.style.color = expr;
        return hex(getComputedStyle(host).color);
      };
      const chart = document.createElement("figure");
      chart.className = "sd-chart";
      document.body.append(chart);
      const chartProbe = document.createElement("span");
      chart.append(chartProbe);
      const CHART = ["down", "up", "in", "out", "rtt", "jitter", "1", "2", "3", "4", "5", "6", "heat", "ok", "grid", "tick", "accent", "warning", "critical", "burst", "surge", "drop"];
      const out = {};
      for (const theme of ["ink", "graphite", "paper"]) {
        document.documentElement.dataset.theme = theme;
        const t = { color: {}, chart: { mono: {}, spectrum: {} } };
        for (const [role, about] of Object.entries(ROLES)) {
          t.color[role] = { $type: "color", $value: color(`var(--sd-${role})`), $description: about };
        }
        const canvas = t.color.canvas.$value;
        const surface = t.color.surface.$value;
        const raised = t.color.raised.$value;
        for (const role of ["fg", "fg-muted", "fg-subtle", "fg-faint", "accent", "success", "danger", "warning", "pending"]) {
          const v = t.color[role].$value;
          t.color[role].$extensions = { "signal.contrast": { canvas: ratio(v, canvas), surface: ratio(v, surface), raised: ratio(v, raised) } };
        }
        for (const scheme of ["mono", "spectrum"]) {
          chart.dataset.chartTheme = scheme;
          for (const k of CHART) t.chart[scheme][k] = { $type: "color", $value: color(`var(--sd-chart-${k})`, chartProbe) };
        }
        out[theme] = t;
      }
      document.documentElement.dataset.theme = "ink";
      const rootStyle = getComputedStyle(document.documentElement);
      const read = (name) => rootStyle.getPropertyValue(name).trim();
      const sizes = {};
      for (const s of ["2xs", "xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"]) sizes[s] = { $type: "dimension", $value: read(`--text-${s}`) };
      const tracking = {};
      for (const s of ["tight", "wide", "caps", "widest", "display"]) {
        const v = read(`--tracking-${s}`);
        if (v) tracking[s] = { $type: "dimension", $value: v };
      }
      probe.remove();
      chart.remove();
      return {
        themes: out,
        typography: {
          family: { $type: "fontFamily", $value: getComputedStyle(document.body).fontFamily, $description: "Source Code Pro for all text, weights 400 and 600." },
          size: sizes,
          tracking,
        },
        shape: { radius: { $type: "dimension", $value: "0px", $description: "Square corners everywhere. Never round." } },
        motion: { "ease-out": { $type: "cubicBezier", $value: read("--ease-out") }, duration: { $type: "duration", $value: "120ms–200ms", $description: "State changes only." } },
      };
    },
    { ROLES },
  );

  /* ---- write ------------------------------------------------------------- */
  const header = { $schema: undefined, name: "signal-design", version: pkg.version, generatedBy: "scripts/build-ai.mjs" };
  const componentsFile = { ...header, about: "Every block from the components page: classes, attributes, copyable HTML, the JS it needs, and a usage note.", components };
  const tokensFile = { ...header, about: "Signal tokens resolved per theme, in W3C design-token form. Use the CSS variables (--sd-<role>, --sd-chart-<name>) in code, never these values.", ...tokens };

  const htmlData = {
    version: 1.1,
    globalAttributes: Object.entries(ATTRIBUTES).map(([name, description]) => ({ name, description })),
  };
  const cssData = {
    version: 1.1,
    properties: Object.entries(tokens.themes.ink.color).map(([role, t]) => ({
      name: `--sd-${role}`,
      description: `${t.$description} ink ${t.$value} · graphite ${tokens.themes.graphite.color[role].$value} · paper ${tokens.themes.paper.color[role].$value}`,
    })),
  };

  // Same output on every OS: a Windows checkout may have CRLF line endings.
  const agents = readFileSync(resolve(root, "AGENTS.md"), "utf8").replace(/\r\n/g, "\n");
  const full =
    agents.trimEnd() +
    "\n\n---\n\n# Component reference (generated)\n\nEvery block from the components page, with its copyable HTML. " +
    "`JS:` says what `init()` must wire.\n" +
    components
      .map(
        (c) =>
          `\n## ${c.section} / ${c.title}\n\n${c.usage}\n\nClasses: ${c.classes.join(", ") || "none"}\n${c.js ? `\n${c.js}\n` : ""}\n\`\`\`html\n${c.html.trim()}\n\`\`\`\n${c.script ? `\n\`\`\`js\n${c.script.trim()}\n\`\`\`\n` : ""}`,
      )
      .join("");

  const files = {
    "ai/components.json": JSON.stringify(componentsFile, null, 1) + "\n",
    "ai/tokens.json": JSON.stringify(tokensFile, null, 1) + "\n",
    "vscode/html-data.json": JSON.stringify(htmlData, null, 1) + "\n",
    "vscode/css-data.json": JSON.stringify(cssData, null, 1) + "\n",
    "llms-full.txt": full.endsWith("\n") ? full : full + "\n",
  };
  let stale = [];
  for (const [path, body] of Object.entries(files)) {
    const file = resolve(root, path);
    const current = existsSync(file) ? readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;
    if (check) {
      if (current !== body) stale.push(path);
      continue;
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
    console.log(`wrote ${path} (${(body.length / 1024).toFixed(0)} KB)`);
  }
  if (check && stale.length) {
    console.log(`Out of date: ${stale.join(", ")}. Run: node scripts/build-ai.mjs`);
    process.exitCode = 1;
  } else if (check) console.log("AI files are up to date.");
  console.log(`${components.length} components, ${Object.keys(ATTRIBUTES).length} attributes, ${Object.keys(ROLES).length} roles x 3 themes`);
} finally {
  await browser.close();
  await server.close();
}
