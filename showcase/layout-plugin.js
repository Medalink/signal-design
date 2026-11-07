/**
 * Vite plugin: wraps each library page (and the overview) in shared chrome. A
 * page file holds only its content in <body>; the head, topbar, doc sidebar,
 * page header, pager and on-this-page rail come from here and from pages.js,
 * so the served and built HTML is static and no page copies the chrome.
 * Library pages are uiarc-style documents (layout.html): a sticky topbar, a
 * fixed filter sidebar, the article and a sticky toc rail on normal page
 * scroll. The overview gets the landing chrome: a topbar, then a full-width
 * marketing page (layout-landing.html).
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { HOME, LIBRARY, EXAMPLES, SECTIONS, byFile, byId, keyOf, neighbors } from "./pages.js";

const dir = import.meta.dirname;
const template = () => readFileSync(resolve(dir, "layout.html"), "utf8");
const landingTemplate = () => readFileSync(resolve(dir, "layout-landing.html"), "utf8");

const symbol = (id, body, view = "0 0 24 24", stroke = "1.5") => `    <symbol id="i-${id}" viewBox="${view}" fill="none" stroke="currentColor" stroke-width="${stroke}">${body}</symbol>`;
export const ICONS = [
  `    <symbol id="i-mark" viewBox="0 0 28 28"><rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" stroke-opacity=".3"/><rect x="6" y="15" width="4" height="7" fill="currentColor" fill-opacity=".45"/><rect x="12" y="11" width="4" height="11" fill="currentColor" fill-opacity=".7"/><rect x="18" y="6" width="4" height="16" fill="var(--sd-accent)"/></symbol>`,
  symbol("tokens", '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><path d="M13 16.5h7M16.5 13v7"/>'),
  symbol("inputs", '<rect x="3.5" y="8.5" width="17" height="7"/><path d="M7 11v2"/>'),
  symbol("shell", '<rect x="3.5" y="4.5" width="17" height="15"/><path d="M8.5 4.5v15M8.5 9.5h12"/>'),
  symbol("code", '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/>'),
  symbol("pages", '<rect x="4.5" y="3.5" width="12" height="15"/><path d="M8 21.5h11.5V7"/>'),
  symbol("search", '<rect x="4" y="4" width="11" height="11"/><path d="M15 15l5.5 5.5"/>'),
  symbol("menu", '<path d="M4 6h16M4 12h16M4 18h16"/>'),
  symbol("close", '<path d="M6 6l12 12M18 6L6 18"/>'),
  symbol("eye", '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  symbol("copy", '<rect x="8" y="8" width="13" height="13"/><path d="M16 8V3H3v13h5"/>'),
  symbol("up", '<path d="M12 19V5M5 12l7-7 7 7"/>'),
  symbol("chevron", '<path d="M6 9l6 6 6-6"/>'),
  symbol("next", '<path d="M5 12h14M13 6l6 6-6 6"/>'),
  symbol("monitor", '<rect x="3" y="4" width="18" height="12"/><path d="M8 20h8M12 16v4"/>'),
  symbol("phone", '<rect x="7" y="3" width="10" height="18"/><path d="M11 18h2"/>'),
  symbol("expand", '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>'),
  symbol("markdown", '<rect x="3" y="5" width="18" height="14"/><path d="M6.5 15V9l2.5 3 2.5-3v6M15 9v6M13 13l2 2 2-2"/>'),
  symbol("collapse", '<path d="M8 4L4 8l4 4M12 4L8 8l4 4"/>', "0 0 16 16"),
  symbol("home", '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>'),
  symbol("panel", '<rect x="2" y="2.5" width="12" height="11"/><path d="M10 2.5v11"/>', "0 0 16 16", "1.3"),
  `    <symbol id="i-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16"/><rect x="12" y="4" width="8" height="16" fill="currentColor" fill-opacity=".45" stroke="none"/></symbol>`,
  `    <symbol id="i-github" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></symbol>`,
].join("\n");

const current = (on) => (on ? ' aria-current="page"' : "");
/** Where a section's first page is, for the topbar breadcrumb and the landing anchors. */
const landing = (section) => (section.groups[0].pages[0].id ? section.groups[0].pages[0].file : `${HOME.file}#home-${section.id}`);

/** The module a page loads: the overview's, the page's own `pages/<id>.js`, or the shared mount. */
export const scriptOf = (page) => (page === HOME ? "pages/home.js" : existsSync(resolve(dir, `pages/${page.id}.js`)) ? `pages/${page.id}.js` : "mount.js");

/**
 * The uiarc-style doc sidebar body: one section label per library section
 * (Foundations, Components, …, Examples), then subgroup headings with their
 * page count at the row's end over the page links. Each section carries the
 * tier the sidebar's All/Components/Examples filter shows it under. The
 * current page takes aria-current, fg emphasis and the left marker bar.
 */
const SECTION_ICON = { foundations: "tokens", components: "inputs", patterns: "shell", scripting: "code", examples: "pages" };
const chevron = `<svg class="doc-chevron" aria-hidden="true"><use href="#i-chevron"/></svg>`;

function docNav(page) {
  const link = (p) => `          <a class="doc-nav-link" href="./${p.file}"${current(p === page)}>${p.title}</a>`;
  const group = (g) => `      <details class="doc-nav-group" data-group="${g.title}" open>
        <summary class="doc-nav-sub">${chevron}<span>${g.title}</span><span class="sd-count">${g.pages.length}</span></summary>
        <div class="doc-nav-links">
${g.pages.map(link).join("\n")}
        </div>
      </details>`;
  const count = (s) => s.groups.reduce((n, g) => n + g.pages.length, 0);
  const section = (s) => `    <details class="doc-nav-section" data-section="${s.id}" data-kind="${s.id === "examples" ? "examples" : "components"}" open>
      <summary class="doc-nav-heading"><svg class="doc-nav-icon" aria-hidden="true"><use href="#i-${SECTION_ICON[s.id] ?? "pages"}"/></svg><span>${s.title}</span><span class="doc-nav-total">${count(s)}</span>${chevron}</summary>
${s.groups.map(group).join("\n")}
    </details>`;
  return SECTIONS.map(section).join("\n");
}

/** The sidebar's pinned footer card: the current release, linking to its notes. */
const releaseCard = () => {
  const { version } = JSON.parse(readFileSync(resolve(dir, "../package.json"), "utf8"));
  return `<a class="doc-release" href="https://github.com/Medalink/signal-design/releases/tag/v${version}" target="_blank" rel="noreferrer"><span class="sd-dot" data-tone="success" aria-hidden="true"></span><span>What's new</span><span class="doc-release-ver">v${version}</span><svg aria-hidden="true"><use href="#i-next"/></svg></a>`;
};

/** The page-level palette: every page under its group, from the registry. It is not a demo block. */
function palette() {
  const option = (p, hint = "") => `      <a role="option" href="./${p.file}" data-keywords="${p.summary.replace(/"/g, "&quot;")}">${p.title}${hint && ` <span class="sd-menu-hint">${hint}</span>`}</a>`;
  const label = (text) => `    <div class="sd-menu-label" role="presentation">${text}</div>`;
  return `<dialog class="sd-command" id="nav-palette" aria-label="Go to a page" data-sd-palette>
  <input type="search" placeholder="Go to a page" aria-label="Go to a page">
  <div class="sd-menu" role="listbox" aria-label="Pages">
${option(HOME, "overview")}
${SECTIONS.flatMap((s) => s.groups.map((g) => [label(g.title), ...g.pages.map((p) => option(p))].join("\n"))).join("\n")}
${label("Actions")}
    <button type="button" role="option" data-sd-theme-cycle data-keywords="dark light paper">Next theme <span class="sd-menu-hint">Shift T</span></button>
  </div>
  <p class="sd-command-foot">↑↓ move · ↵ open · Esc close</p>
</dialog>`;
}

/** The toc rail beside the article: "On this page" anchors, then the Markdown link and a way back to the top. Quiet text on the page background, no frame. */
const asideFor = (page) => {
  const links = pageSections(page)
    .map(([id, label, sub]) => `        <li><a href="#${id}"${sub ? ' class="doc-toc-sub"' : ""}>${label}</a></li>`)
    .join("\n");
  return `  <aside class="doc-toc-rail" aria-label="On this page">
    <p class="doc-toc-label">On this page</p>
    <ul class="doc-toc">
${links}
    </ul>
    <div class="doc-toc-foot">
      <a class="doc-toc-link" href="https://github.com/Medalink/signal-design/blob/main/llms-full.txt" target="_blank" rel="noreferrer"><svg aria-hidden="true"><use href="#i-markdown"/></svg>View as Markdown</a>
      <button class="doc-toc-link" type="button" data-doc-top>Back to top <svg aria-hidden="true"><use href="#i-up"/></svg></button>
    </div>
  </aside>`;
};

const blockCount = (file) => (readFileSync(resolve(dir, file), "utf8").match(/<div class="demo-block"/g) || []).length;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The slug decorateBlocks computes for a block title. */
const slugToc = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * What "On this page" lists: a page with a doc object lists its doc sections;
 * any other page lists its demo blocks, by their authored id or the id the
 * block flip derives from the h2.
 */
function pageSections(page) {
  const d = page.doc;
  if (d) {
    const out = [["preview", "Preview"]];
    if (d.when?.length) out.push(["when", "When to use"]);
    if (d.notWhen?.length) out.push(["not-when", "When not to use"]);
    if (d.install) out.push(["install", "Installation"]);
    if (d.usage) out.push(["usage", "Usage"]);
    if (d.examples?.length) {
      out.push(["examples", "Examples"]);
      for (const ex of d.examples) out.push([`ex-${slugToc(ex.title)}`, ex.title, true]);
    }
    if (d.api?.length) out.push(["api", "API reference"]);
    if (d.keyboard?.length) out.push(["keyboard", "Keyboard interactions"]);
    if (d.a11y?.length) out.push(["a11y", "Accessibility"]);
    if (d.motion?.length) out.push(["motion", "Motion"]);
    if (d.responsive?.length) out.push(["responsive", "Responsive behavior"]);
    if (d.notes?.length) out.push(["notes", "Notes for AI"]);
    if (d.related?.length) out.push(["related", "Related"]);
    return out;
  }
  const html = readFileSync(resolve(dir, page.file), "utf8");
  const out = [["preview", "Preview"]];
  for (const [, attrs, h2] of html.matchAll(/<div class="demo-block"([^>]*)>(?:\s*<h2 class="sd-label">([^<]*)<\/h2>)?/g)) {
    const id = attrs.match(/id="([^"]+)"/)?.[1] ?? (h2 ? slugToc(h2) : null);
    if (id) out.push([id, h2?.trim() || id]);
  }
  return out;
}

/** Cards for the overview: a section per library section, a grid per group. Each lives in the landing's wide column, so the groups separate by spacing, not a second rule. */
function cards() {
  const card = (p) =>
    `      <a class="sd-link-card" href="./${p.file}"><span class="sd-link-card-site">${p.id ? plural(blockCount(p.file), "block") : "example"}</span><span class="sd-link-card-title">${p.title}</span><span class="sd-link-card-desc">${p.summary}</span></a>`;
  const group = (g) => `    <section class="home-browse-group" aria-label="${g.title}">
      <h3 class="sd-label">${g.title}</h3>
      <div class="sd-grid" style="--min: 14rem; --gap: 12px">
${g.pages.map(card).join("\n")}
      </div>
    </section>`;
  return SECTIONS.map(
    (s) => `  <section class="home-browse-group" id="home-${s.id}" aria-labelledby="home-${s.id}-h">
    <h2 id="home-${s.id}-h" class="sd-title">${s.title}</h2>
${s.groups.map(group).join("\n")}
  </section>`,
  ).join("\n\n");
}

/** The lead sentence under the hero headline: real counts from the registry. */
const homeLead = () =>
  `<p class="sd-lead max-w-[42rem]">A design library for Tailwind v4 apps, plain HTML and Tauri. <b>${LIBRARY.length} component pages</b> and <b>${EXAMPLES.length} example apps</b> show every part working.</p>`;

/** The strongest example apps, one art piece each. */
const FEATURED = [
  ["chat.html", "signal", "A group channel in the whole app frame, with a poll, replies and members by role."],
  ["shell.html", "laptop", "A containers screen: rows open to details, a confirm before removal, a live status bar."],
  ["charts.html", "chip", "Live CPU and memory plots for a fleet, with a per-container table."],
  ["stream.html", "wifi", "A Twitch overlay package with live alerts, ready for OBS."],
  ["react-shell.html", "terminal", "The app shell as React components, state owned by React."],
];

/** Everything under the hero: featured apps, the full grid, AI files, FAQ and the footer. Each section's content sits in the landing's wide column. */
function homeCards(grid) {
  const featured = FEATURED.map(
    ([file, art, line]) =>
      `      <a class="sd-link-card sd-link-card-hero home-featured-card" href="./${file}"><span class="sd-link-card-thumb home-featured-art"><span class="sd-art" data-sd-art="${art}" aria-hidden="true"></span></span><span class="sd-link-card-site">Example app</span><span class="sd-link-card-title">${EXAMPLES.find((p) => p.file === file)?.title ?? file}</span><span class="sd-link-card-desc">${line}</span></a>`,
  ).join("\n");
  const faq = [
    ["What is Signal?", `A flat, square, monochrome design library: CSS components for Tailwind v4 or one prebuilt stylesheet, plus a small dependency-free JS module that wires behavior through attributes.`],
    ["How do I install it?", `From GitHub, not npm: <code>pnpm add github:Medalink/signal-design</code>. Pin a tag or commit for reproducible builds.`],
    ["Does it need Tailwind?", `No. With Tailwind, import it after <code>tailwindcss</code>. Without, link <code>dist/signal.css</code> and keep the fonts next to it.`],
    ["How do themes work?", `Four themes: ink, graphite, paper and auto. <code>&lt;html data-theme&gt;</code> sets one, <code>setTheme()</code> switches and remembers it, and every color reads a <code>--sd-*</code> token, so a theme change never breaks a page.`],
    ["Can my AI read it?", `Yes. <code>llms-full.txt</code> holds the guide and every component's HTML in one file, and <code>ai/components.json</code> holds the same as data with copyable markup.`],
    ["Where does it run?", `Any browser and most WebViews: Tauri on WebView2, WKWebView and WebKitGTK.`],
  ]
    .map(([q, a]) => `      <div><h3>${q}</h3><p class="sd-muted">${a}</p></div>`)
    .join("\n");
  return `  <section class="home-section" id="home-featured" aria-labelledby="home-featured-h">
    <div class="home-inner">
    <h2 id="home-featured-h" class="sd-title">See it in use</h2>
    <p class="sd-muted max-w-[42rem]">Whole apps built only from library parts. Open one and click around.</p>
    <div class="sd-grid home-featured-grid" style="--min: 20rem; --gap: 20px">
${featured}
    </div>
    </div>
  </section>

  <section class="home-section" id="home-browse" aria-labelledby="home-browse-h">
    <div class="home-inner">
    <h2 id="home-browse-h" class="sd-title">Browse everything</h2>
    <p class="sd-muted max-w-[42rem]">Every part of the library on its own page, with preview and code side by side.</p>

${grid}
    </div>
  </section>

  <section class="home-section" id="home-ai" aria-labelledby="home-ai-h">
    <div class="home-inner">
    <h2 id="home-ai-h" class="sd-title">Use Signal with your AI</h2>
    <p class="sd-muted max-w-[42rem]">Install from GitHub, then point your agent at the files it reads. The docs ship as plain text on purpose.</p>
    <div class="grid gap-3 sm:grid-cols-2 items-start">
      <div class="sd-code">
        <div class="sd-code-head">pnpm <button class="sd-btn sd-btn-sm sd-btn-ghost" data-sd-copy="#install-pnpm">Copy</button></div>
        <pre id="install-pnpm" tabindex="0"><code>pnpm add github:Medalink/signal-design</code></pre>
      </div>
      <div class="sd-code">
        <div class="sd-code-head">npm <button class="sd-btn sd-btn-sm sd-btn-ghost" data-sd-copy="#install-npm">Copy</button></div>
        <pre id="install-npm" tabindex="0"><code>npm install github:Medalink/signal-design</code></pre>
      </div>
    </div>
    <ul class="doc-list max-w-[42rem]">
      <li><code>llms-full.txt</code> is the guide and every component's HTML in one file. <a href="https://github.com/Medalink/signal-design/blob/main/llms-full.txt">Read it on GitHub</a>.</li>
      <li><code>ai/components.json</code> is every block as data, with copyable markup. <a href="https://github.com/Medalink/signal-design/blob/main/ai/components.json">Browse it on GitHub</a>.</li>
      <li>The <a href="./lib-setup.html">Setup page</a> shows what <code>init()</code> wires, attribute by attribute.</li>
    </ul>
    </div>
  </section>

  <section class="home-section" id="home-faq" aria-labelledby="home-faq-h">
    <div class="home-inner">
    <h2 id="home-faq-h" class="sd-title">Good questions</h2>
    <div class="sd-grid home-faq" style="--min: 15rem; --gap: 32px 24px">
${faq}
    </div>
    </div>
  </section>

  <section class="home-section home-footer" aria-labelledby="home-cta-h">
    <div class="home-inner">
    <h2 id="home-cta-h" class="sd-title">Start with one page.</h2>
    <p class="sd-lead max-w-[42rem]">Try it on its page, then install it with one command.</p>
    <div class="sd-actions">
      <a class="sd-btn" href="./lib-buttons.html">Open the Buttons page</a>
      <a class="sd-btn sd-btn-ghost" href="./lib-setup.html">Set it up</a>
    </div>
    <nav class="home-footer-nav" aria-label="Footer">
      <div>
        <p class="sd-label">Library</p>
        <ul>
          <li><a href="./lib-rules.html">Rules</a></li>
          <li><a href="./lib-buttons.html">Buttons</a></li>
          <li><a href="./lib-fields.html">Fields</a></li>
          <li><a href="./lib-setup.html">Setup</a></li>
        </ul>
      </div>
      <div>
        <p class="sd-label">AI</p>
        <ul>
          <li><a href="https://github.com/Medalink/signal-design/blob/main/llms-full.txt">llms-full.txt</a></li>
          <li><a href="https://github.com/Medalink/signal-design/blob/main/ai/components.json">ai/components.json</a></li>
          <li><a href="./lib-owned.html">Framework state</a></li>
        </ul>
      </div>
      <div>
        <p class="sd-label">Examples</p>
        <ul>
          <li><a href="./chat.html">Chat</a></li>
          <li><a href="./shell.html">App shell</a></li>
          <li><a href="./charts.html">Charts</a></li>
          <li><a href="./stream.html">Stream</a></li>
          <li><a href="./react-shell.html">React app shell</a></li>
        </ul>
      </div>
    </nav>
    <p class="sd-subtle home-copyright">© 2026 Signal design. MIT.</p>
    </div>
  </section>`;
}

/** One doc section: an h2 with a stable id that the "On this page" rail links to. */
const docSection = (id, title, inner) => `  <section class="doc-section" id="${id}" aria-labelledby="${id}-h">
    <h2 id="${id}-h" class="sd-title">${title}</h2>
${inner}
  </section>`;

const docBullets = (items) => `    <ul class="doc-list">\n${items.map((t) => `      <li>${t}</li>`).join("\n")}\n    </ul>`;

const docApi = (rows) => `    <div class="sd-table-wrap">
      <table class="sd-table sd-table-compact">
        <thead><tr><th>Member</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
${rows.map((r) => `          <tr><td><code>${r.name}</code></td><td>${r.type}</td><td>${r.def ?? "—"}</td><td>${r.desc}</td></tr>`).join("\n")}
        </tbody>
      </table>
    </div>`;

const docKeyboard = (rows) => `    <dl class="sd-kv doc-keys">\n${rows.map(([k, v]) => `      <dt><kbd>${k}</kbd></dt><dd>${v}</dd>`).join("\n")}\n    </dl>`;

const docRelated = (ids) => {
  const cards = ids
    .map(byId)
    .filter(Boolean)
    .map((p) => `      <a class="sd-link-card" href="./${p.file}"><span class="sd-link-card-site">${p.group.title}</span><span class="sd-link-card-title">${p.title}</span><span class="sd-link-card-desc">${p.summary}</span></a>`);
  return `    <div class="sd-grid" style="--min: 16rem; --gap: 12px">\n${cards.join("\n")}\n    </div>`;
};

/** The doc sections an example provides: an anchored h3 over its demo, on a field-fill canvas. */
const docExample = (ex) => `      <div class="doc-example" id="ex-${slugToc(ex.title)}">
        <h3>${ex.title}</h3>
        <div class="doc-example-demo" data-sd-check-ignore="primary">${ex.html}</div>
      </div>`;

/** The same install command for each package manager, when the page's command is a plain `pnpm add`. */
const MANAGERS = [
  ["pnpm", "pnpm add"],
  ["npm", "npm install"],
  ["yarn", "yarn add"],
  ["bun", "bun add"],
];
const copyBtn = (target, label = "Copy") =>
  `<button class="doc-code-copy" type="button" data-sd-copy="${target}"><svg aria-hidden="true"><use href="#i-copy"/></svg>${label}</button>`;

/** Installation: a package-manager tab row over one command, like uiarc's CLI block, then the note. */
const docInstall = (install) => {
  const args = install.cmd.startsWith("pnpm add ") ? install.cmd.slice("pnpm add ".length) : null;
  const note = `    <p class="sd-muted doc-note">${install.note}</p>`;
  if (!args)
    return `    <div class="sd-code doc-code">
      <div class="sd-code-head doc-code-head"><span>Terminal</span>${copyBtn("#doc-install-cmd")}</div>
      <pre id="doc-install-cmd" tabindex="0"><code>${install.cmd}</code></pre>
    </div>
${note}`;
  const tabs = MANAGERS.map(
    ([pm], i) => `<button role="tab" id="pm-${pm}-t" aria-controls="pm-${pm}"${i ? "" : ' aria-selected="true"'}>${pm}</button>`,
  ).join("");
  const panels = MANAGERS.map(
    ([pm, verb], i) => `      <div class="sd-tabpanel doc-code-panel" role="tabpanel" id="pm-${pm}" aria-labelledby="pm-${pm}-t"${i ? " hidden" : ""}>
        <div class="doc-code-copy-row">${copyBtn(`#pm-${pm}-cmd`)}</div>
        <pre id="pm-${pm}-cmd" tabindex="0"><code>${verb} ${args}</code></pre>
      </div>`,
  ).join("\n");
  return `    <div class="sd-code doc-code doc-install">
      <div class="sd-code-head doc-code-head"><div class="doc-pm-tabs" role="tablist" aria-label="Package manager">${tabs}</div></div>
${panels}
    </div>
${note}`;
};

const docAiFoot = `    <p class="sd-muted doc-note">The machine-readable reference lives in the repo: <a href="https://github.com/Medalink/signal-design/blob/main/ai/components.json">ai/components.json</a> and <a href="https://github.com/Medalink/signal-design/blob/main/llms-full.txt">llms-full.txt</a>.</p>`;

/** Every doc section a page provides, in reading order. Empty for pages without a doc object. */
function docHtml(page) {
  const d = page.doc;
  if (!d) return "";
  const parts = [];
  if (d.when?.length) parts.push(docSection("when", "When to use", docBullets(d.when)));
  if (d.notWhen?.length) parts.push(docSection("not-when", "When not to use", docBullets(d.notWhen)));
  if (d.install) parts.push(docSection("install", "Installation", docInstall(d.install)));
  if (d.usage)
    parts.push(
      docSection(
        "usage",
        "Usage",
        `    <div class="sd-code doc-code">
      <div class="sd-code-head doc-code-head"><span class="doc-code-file"><svg aria-hidden="true"><use href="#i-code"/></svg>example.html</span>${copyBtn("#doc-usage")}</div>
      <pre id="doc-usage" tabindex="0"><code>${d.usage}</code></pre>
    </div>`,
      ),
    );
  if (d.examples?.length)
    parts.push(docSection("examples", "Examples", `    <div class="doc-examples">\n${d.examples.map(docExample).join("\n")}\n    </div>`));
  if (d.api?.length) parts.push(docSection("api", "API reference", docApi(d.api)));
  if (d.keyboard?.length) parts.push(docSection("keyboard", "Keyboard interactions", docKeyboard(d.keyboard)));
  if (d.a11y?.length) parts.push(docSection("a11y", "Accessibility", docBullets(d.a11y)));
  if (d.motion?.length) parts.push(docSection("motion", "Motion", docBullets(d.motion)));
  if (d.responsive?.length) parts.push(docSection("responsive", "Responsive behavior", docBullets(d.responsive)));
  if (d.notes?.length) parts.push(docSection("notes", "Notes for AI", `${docBullets(d.notes)}\n${docAiFoot}`));
  if (d.related?.length) parts.push(docSection("related", "Related", docRelated(d.related)));
  return parts.join("\n\n");
}

/** The preview shell around a page's demo blocks: a Preview/Code tablist over one canvas. init() owns the tabs' aria-selected (roving focus included); the click handler in library.js flips every block from data-code-all. */
const previewShell = (blocks) => `  <div class="doc-preview">
    <div class="doc-preview-bar">
      <div class="doc-tabs" role="tablist" aria-label="Preview or code">
        <button type="button" role="tab" aria-selected="true" data-code-all="preview"><svg aria-hidden="true"><use href="#i-eye"/></svg>Preview</button>
        <button type="button" role="tab" aria-selected="false" data-code-all="code"><svg aria-hidden="true"><use href="#i-code"/></svg>Code</button>
      </div>
      <span class="doc-preview-hint">Live · keyboard ready</span>
      <div class="doc-preview-tools">
        <div class="doc-width" role="group" aria-label="Preview width">
          <button type="button" class="doc-tool" data-doc-width="full" aria-pressed="true" aria-label="Full width"><svg aria-hidden="true"><use href="#i-monitor"/></svg></button>
          <button type="button" class="doc-tool" data-doc-width="phone" aria-pressed="false" aria-label="Phone width"><svg aria-hidden="true"><use href="#i-phone"/></svg></button>
        </div>
        <button type="button" class="doc-tool" data-doc-fullscreen aria-label="Full screen"><svg aria-hidden="true"><use href="#i-expand"/></svg></button>
      </div>
    </div>
    <div class="doc-canvas" id="preview">
${blocks}
    </div>
  </div>`;

/** A library page: its breadcrumb, title and lead over its content, the demo blocks in the preview shell, then the doc sections, then the pages either side. */
function libraryContent(page, body) {
  const intro = page.doc?.intro;
  const copyPage = page.doc?.usage
    ? `
        <div class="doc-copy-page">
          <button type="button" data-sd-copy="#doc-usage"><svg aria-hidden="true"><use href="#i-copy"/></svg>Copy page</button>
          <button type="button" popovertarget="doc-copy-menu" aria-haspopup="menu" aria-expanded="false" aria-label="More copy options"><svg aria-hidden="true"><use href="#i-chevron"/></svg></button>
        </div>
        <div popover id="doc-copy-menu" class="sd-popover">
          <div class="sd-menu" role="menu" aria-label="Copy options">
            <button role="menuitem" data-sd-copy="#doc-header-cmd">Copy install command</button>
            <a role="menuitem" href="https://github.com/Medalink/signal-design/blob/main/llms-full.txt" target="_blank" rel="noreferrer">View as Markdown</a>
            <a role="menuitem" href="https://github.com/Medalink/signal-design/blob/main/ai/components.json" target="_blank" rel="noreferrer">Open components.json</a>
          </div>
        </div>`
    : "";
  const title = `<div class="demo-title"><h1 id="${page.id}-h" class="doc-h1">${page.title}</h1>${intro ? `\n      <p class="doc-lead">${intro}</p>` : ""}\n      <div class="doc-header-row">\n        <div class="doc-install-pill"><code id="doc-header-cmd">pnpm add github:Medalink/signal-design</code><button class="doc-icon-btn" type="button" data-sd-copy="#doc-header-cmd" aria-label="Copy install command"><svg aria-hidden="true"><use href="#i-copy"/></svg></button></div>${copyPage}\n      </div></div>`;
  let header;
  let blocks = body;
  if (blocks.startsWith('<header class="demo-intro">')) {
    const at = blocks.indexOf("</header>") + "</header>".length;
    header = blocks.slice(0, at).replace('<header class="demo-intro">', `<header class="demo-intro">\n    ${title}`);
    blocks = blocks.slice(at).trim();
  } else {
    header = `<header class="demo-intro">\n    ${title}\n  </header>`;
  }
  const content = blocks ? `${header}\n${previewShell(blocks)}` : header;
  const doc = docHtml(page);
  const { prev, next } = neighbors(page);
  const step = (p, rel, side) =>
    p ? `    <a class="doc-pager-link" href="./${p.file}" rel="${rel}"><span>${side}</span><span class="doc-pager-title">${p.title}</span></a>` : "    <span></span>";
  const pages = SECTIONS.reduce((n, s) => n + s.groups.reduce((m, g) => m + g.pages.length, 0), 0);
  return `  <section class="demo-section" id="${page.id}" aria-labelledby="${page.id}-h">
  ${content}
  </section>
${doc ? `\n${doc}\n` : ""}
  <nav class="demo-pager" aria-label="Previous and next page">
${step(prev, "prev", "Previous")}
${step(next, "next", "Next")}
  </nav>
  <footer class="doc-footer"><span>Signal · ${pages} pages</span><a href="https://github.com/Medalink/signal-design/blob/main/llms-full.txt">llms-full.txt</a></footer>`;
}

/** The page whose file this is, or null for the example pages and everything else. */
export function pageOf(filename) {
  const file = basename(filename);
  return file === HOME.file ? HOME : byFile(file) ?? null;
}

export function renderPage(page, html) {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? "").replace(/^\s+|\s+$/g, "");
  const library = page !== HOME;
  const content = library
    ? libraryContent(page, body)
    : body.replace("<!--@lead-->", homeLead()).replace("<!--@cards-->", homeCards(cards()));
  const title = library ? `${page.title} · Signal design library` : "Signal design library";
  const fill = {
    icons: ICONS,
    crumbs: library
      ? [
          `<li><a href="./${landing(page.section)}">${page.section.title}</a></li>`,
          `<li><span aria-current="page">${page.title}</span></li>`,
        ].join("\n          ")
      : `<li><span aria-current="page">Overview</span></li>`,
    sidebar: docNav(page),
    release: releaseCard(),
    navComponents: library && page.section.id !== "examples" ? ' aria-current="true"' : "",
    navExamples: library && page.section.id === "examples" ? ' aria-current="true"' : "",
    aside: library ? asideFor(page) : "",
    palette: palette(),
  };
  const fillIn = (text) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in fill ? fillIn(fill[key]) : `{{${key}}}`));
  // The page content goes in verbatim: it is never read as a template.
  // Library pages are uiarc-style documents; the overview is the landing template.
  const [before, after] = (library ? template() : landingTemplate()).split("{{content}}");
  return `<!doctype html>
<html lang="en" data-theme="ink" data-page="${keyOf(page)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <script>
    try { const d = document.documentElement.dataset, t = localStorage.getItem("sd-theme"), f = localStorage.getItem("sd-font"); if (t) d.theme = t; if (f) d.font = f; } catch {}
  </script>  <link rel="stylesheet" href="./app.css">
  <script type="module" src="./${scriptOf(page)}"></script>
</head>
<body>
${fillIn(before)}${content}
${fillIn(after)}
</body>
</html>
`;
}

/** The old section pages split into the pages above. A link to one goes through the overview, which knows where each old anchor lives now. */
const RETIRED = ["tokens", "components", "conversation", "inputs-more", "effects", "js"];
const retiredStub = (section) =>
  `<!doctype html>\n<meta charset="utf-8">\n<title>Signal design library</title>\n<script>location.replace("./index.html" + (location.hash || "#${section}"));</script>\n`;

export function layoutPlugin() {
  return {
    name: "signal-showcase-layout",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const section = req.url?.match(/^\/lib-([a-z-]+)\.html(?:[?#]|$)/)?.[1];
        if (!RETIRED.includes(section)) return next();
        res.setHeader("content-type", "text/html");
        res.end(retiredStub(section));
      });
    },
    generateBundle() {
      for (const section of RETIRED) this.emitFile({ type: "asset", fileName: `lib-${section}.html`, source: retiredStub(section) });
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const page = pageOf(ctx.filename);
        return page ? renderPage(page, html) : html;
      },
    },
    handleHotUpdate({ file, server }) {
      if (/[\\/]showcase[\\/](layout\.html|pages\.js|layout-plugin\.js)$/.test(file)) server.ws.send({ type: "full-reload" });
    },
  };
}
