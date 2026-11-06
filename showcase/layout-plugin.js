/**
 * Vite plugin: wraps each library page (and the overview) in shared chrome. A
 * page file holds only its content in <body>; the head, rail, sidebar, page
 * header, pager, nav palette and aside come from here and from pages.js, so
 * the served and built HTML is static and no page copies the chrome. Library
 * pages get the App Shell (layout.html); the overview gets the landing
 * chrome: a topbar, then a full-width marketing page (layout-landing.html).
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
  symbol("collapse", '<path d="M8 4L4 8l4 4M12 4L8 8l4 4"/>', "0 0 16 16"),
  symbol("home", '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>'),
  symbol("panel", '<rect x="2" y="2.5" width="12" height="11"/><path d="M10 2.5v11"/>', "0 0 16 16", "1.3"),
  `    <symbol id="i-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16"/><rect x="12" y="4" width="8" height="16" fill="currentColor" fill-opacity=".45" stroke="none"/></symbol>`,
].join("\n");

const current = (on) => (on ? ' aria-current="page"' : "");
/** Where a section's rail item goes: its first page, or for the examples, their cards on the overview. */
const landing = (section) => (section.groups[0].pages[0].id ? section.groups[0].pages[0].file : `${HOME.file}#home-${section.id}`);

/** The module a page loads: the overview's, the page's own `pages/<id>.js`, or the shared mount. */
export const scriptOf = (page) => (page === HOME ? "pages/home.js" : existsSync(resolve(dir, `pages/${page.id}.js`)) ? `pages/${page.id}.js` : "mount.js");

/**
 * The rail: home, search, then one item per section. A section
 * opens its first page while the sidebar is pinned beside the page; otherwise
 * library.js keeps the click on the rail so the section's sidebar peeks in.
 */
function rail(page) {
  const items = SECTIONS.map(
    (s) =>
      `      <a class="sd-rail-item" href="./${landing(s)}" data-sd-section="${s.id}"${s === page.section ? ' aria-current="true"' : ""}><svg><use href="#i-${s.icon}"/></svg><span>${s.label}</span></a>`,
  ).join("\n");
  return `  <nav class="sd-rail" id="shell-rail" aria-label="Sections" data-sd-ornaments="bottom" data-sd-ornaments-size="200">
    <a class="sd-rail-home" href="./${HOME.file}" aria-label="Signal home"${current(page === HOME)}><svg class="sd-mark"><use href="#i-mark"/></svg></a>
    <button class="sd-rail-item" style="margin-top:8px" data-sd-open="nav-palette"{{search_key}} aria-label="{{search_label}}"><svg><use href="#i-search"/></svg>{{search_kbd}}</button>
    <div class="sd-rail-sep" style="margin-block:8px"></div>
    <div class="sd-rail-list">
${items}
    </div>
  </nav>`;
}

/**
 * One panel per section: its pages under folding text groups, each with its
 * page count. The current page's section shows; the overview shows the first.
 */
function sidebar(page) {
  const shown = page.section ?? SECTIONS[0];
  const link = (p) => `          <a class="sd-sidebar-link" href="./${p.file}"${current(p === page)}>${p.title}</a>`;
  const group = (s, g) => `        <details class="sd-sidebar-group" open data-group="${s.id}/${g.title}">
          <summary>${g.title} <span class="sd-count">${g.pages.length}</span></summary>
${g.pages.map(link).join("\n")}
        </details>`;
  const panel = (s) => `    <div class="sd-sidebar-panel" data-section="${s.id}"${s === shown ? "" : " hidden"}>
      <div class="sd-sidebar-head"><svg><use href="#i-${s.icon}"/></svg><span class="sd-sidebar-title">${s.title}</span>
        <button class="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm" data-sd-shell="sidebar" data-sd-key="[" aria-label="Collapse sidebar"><svg><use href="#i-collapse"/></svg></button></div>
      <nav class="sd-sidebar-body" data-sd-ornaments="bottom" data-sd-ornaments-size="200" aria-label="${s.title} pages">
${s.groups.map((g) => group(s, g)).join("\n")}
      </nav>
    </div>`;
  return `  <aside class="sd-sidebar" id="library-sidebar" aria-label="Section pages">
${SECTIONS.map(panel).join("\n")}
    <div class="sd-sidebar-resize" role="separator" aria-orientation="vertical" aria-label="Resize sidebar" aria-controls="library-sidebar" aria-valuemin="224" aria-valuemax="480" aria-valuenow="288" tabindex="0" data-sd-shell="resize"></div>
  </aside>`;
}

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

/** The right panel holds only what applies to this page: every block as code or as a preview. Theme, chart colors, scrollbars and rain live in the showcase bar. */
/** The right panel is the "On this page" rail: anchors to the page's sections, then the code-view buttons. */
const asideFor = (page) => {
  const links = pageSections(page)
    .map(([id, label]) => `        <a href="#${id}">${label}</a>`)
    .join("\n");
  return `  <aside class="sd-shell-aside" id="settings-panel" aria-label="On this page">
    <div class="sd-shell-aside-head"><span class="flex-1">On this page</span>
      <button class="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm" data-sd-shell="aside" aria-label="Close on this page"><svg><use href="#i-close"/></svg></button></div>
    <div class="sd-shell-aside-section">
      <nav class="doc-toc" aria-label="On this page">
${links}
      </nav>
    </div>
    <div class="sd-shell-aside-section sd-actions"><button class="sd-btn sd-btn-sm" data-code-all="code">Show all code</button><button class="sd-btn sd-btn-sm sd-btn-ghost" data-code-all="preview">Show all previews</button></div>
  </aside>`;
};
const asideButton = `      <div class="sd-shell-header-end">
        <button class="sd-btn sd-btn-sm" data-sd-shell="aside" data-sd-key="]" aria-controls="settings-panel" data-sd-tip="On this page (])" data-sd-tip-side="bottom" aria-label="Toggle the on-this-page panel"><svg><use href="#i-panel"/></svg><span class="sd-desktop-only">On this page</span> <kbd>]</kbd></button>
      </div>`;
const asideHint = `    <span><kbd>]</kbd> on this page</span>
`;

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
    const out = [];
    if (d.when?.length) out.push(["when", "When to use"]);
    if (d.notWhen?.length) out.push(["not-when", "When not to use"]);
    if (d.usage) out.push(["usage", "Usage"]);
    if (d.api?.length) out.push(["api", "API"]);
    if (d.keyboard?.length) out.push(["keyboard", "Keyboard"]);
    if (d.a11y?.length) out.push(["a11y", "Accessibility"]);
    if (d.motion?.length) out.push(["motion", "Motion"]);
    if (d.related?.length) out.push(["related", "Related"]);
    return out;
  }
  const html = readFileSync(resolve(dir, page.file), "utf8");
  const out = [];
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

/** Every doc section a page provides, in reading order. Empty for pages without a doc object. */
function docHtml(page) {
  const d = page.doc;
  if (!d) return "";
  const parts = [];
  if (d.when?.length) parts.push(docSection("when", "When to use", docBullets(d.when)));
  if (d.notWhen?.length) parts.push(docSection("not-when", "When not to use", docBullets(d.notWhen)));
  if (d.usage)
    parts.push(
      docSection(
        "usage",
        "Usage",
        `    <div class="sd-code">
      <div class="sd-code-head">Usage <button class="sd-btn sd-btn-sm sd-btn-ghost" data-sd-copy="#doc-usage">Copy</button></div>
      <pre id="doc-usage" tabindex="0"><code>${d.usage}</code></pre>
    </div>`,
      ),
    );
  if (d.api?.length) parts.push(docSection("api", "API", docApi(d.api)));
  if (d.keyboard?.length) parts.push(docSection("keyboard", "Keyboard", docKeyboard(d.keyboard)));
  if (d.a11y?.length) parts.push(docSection("a11y", "Accessibility", docBullets(d.a11y)));
  if (d.motion?.length) parts.push(docSection("motion", "Motion", docBullets(d.motion)));
  if (d.related?.length) parts.push(docSection("related", "Related", docRelated(d.related)));
  return parts.join("\n\n");
}

/** A library page: its group and title over its content, then the doc sections, then the pages either side. */
function libraryContent(page, body) {
  const intro = page.doc?.intro;
  const title = `<div class="demo-title"><p class="sd-label">${page.group.title}</p><h1 id="${page.id}-h" class="sd-display">${page.title}</h1>${intro ? `\n      <p class="sd-lead max-w-[42rem]">${intro}</p>` : ""}</div>`;
  const content = body.startsWith('<header class="demo-intro">')
    ? body.replace('<header class="demo-intro">', `<header class="demo-intro">\n    ${title}`)
    : `<header class="demo-intro">\n    ${title}\n  </header>\n\n  ${body}`;
  const doc = docHtml(page);
  const { prev, next } = neighbors(page);
  const step = (p, rel, side) =>
    p ? `    <a class="sd-link-card" href="./${p.file}" rel="${rel}"><span class="sd-link-card-site">${side}</span><span class="sd-link-card-title">${p.title}</span></a>` : "    <span></span>";
  return `  <section class="demo-section" id="${page.id}" aria-labelledby="${page.id}-h">
  ${content}
  </section>
${doc ? `\n${doc}\n` : ""}
  <nav class="demo-pager" aria-label="Previous and next page">
${step(prev, "prev", "Previous")}
${step(next, "next", "Next")}
  </nav>`;
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
  const own = /<dialog[^>]*data-sd-palette/.test(content);
  const fill = {
    icons: ICONS,
    label: library ? page.title : "Library",
    crumbs: library
      ? [
          `<li><a href="./${landing(page.section)}"><svg><use href="#i-${page.section.icon}"/></svg> ${page.section.title}</a></li>`,
          `<li><span>${page.group.title}</span></li>`,
          `<li><span aria-current="page">${page.title}</span></li>`,
        ].join("\n          ")
      : `<li><span aria-current="page">Overview</span></li>`,
    // A page whose own content has a command palette keeps Ctrl K for it.
    search_key: own ? "" : ' data-sd-key="mod+k" aria-keyshortcuts="Control+K"',
    search_label: "Go to a page",
    search_kbd: own ? "" : "<span><kbd>Ctrl K</kbd></span>",
    rail: rail(page),
    sidebar: sidebar(page),
    aside: library ? asideFor(page) : "",
    aside_button: library ? asideButton : "",
    aside_hint: library ? asideHint : "",
    palette: palette(),
  };
  const fillIn = (text) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in fill ? fillIn(fill[key]) : `{{${key}}}`));
  // The page content goes in verbatim: it is never read as a template.
  // Library pages sit in the App Shell; the overview is the landing template.
  const [before, after] = (library ? template() : landingTemplate()).split("{{content}}");
  return `<!doctype html>
<html lang="en" data-theme="ink" data-page="${keyOf(page)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <script>
    try { const t = localStorage.getItem("sd-theme"); if (t) document.documentElement.dataset.theme = t; } catch {}
  </script>
  <link rel="stylesheet" href="./app.css">
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
