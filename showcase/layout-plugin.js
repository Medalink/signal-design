/**
 * Vite plugin: wraps each library page (and the overview) in the shared App
 * Shell chrome from layout.html. A page file holds only its content in
 * <body>; the head, rail, sidebar, nav palette and aside come from here and
 * from pages.js, so the served and built HTML is static and no page copies
 * the chrome.
 */
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { EXAMPLES, HOME, LIBRARY, byFile } from "./pages.js";

const dir = import.meta.dirname;
const template = () => readFileSync(resolve(dir, "layout.html"), "utf8");

const symbol = (id, body, view = "0 0 24 24", stroke = "1.5") => `    <symbol id="i-${id}" viewBox="${view}" fill="none" stroke="currentColor" stroke-width="${stroke}">${body}</symbol>`;
const ICONS = [
  `    <symbol id="i-mark" viewBox="0 0 28 28"><rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" stroke-opacity=".3"/><rect x="6" y="15" width="4" height="7" fill="currentColor" fill-opacity=".45"/><rect x="12" y="11" width="4" height="11" fill="currentColor" fill-opacity=".7"/><rect x="18" y="6" width="4" height="16" fill="var(--sd-accent)"/></symbol>`,
  symbol("tokens", '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><path d="M13 16.5h7M16.5 13v7"/>'),
  symbol("elements", '<path d="M4 5h8M4 11h16M4 15h16M4 19h11"/>'),
  symbol("components", '<rect x="3.5" y="4.5" width="17" height="4"/><rect x="3.5" y="10" width="11" height="4"/><rect x="3.5" y="15.5" width="14" height="4"/>'),
  symbol("conversation", '<rect x="3.5" y="4.5" width="12" height="7"/><rect x="8.5" y="13.5" width="12" height="6"/>'),
  symbol("inputs", '<rect x="3.5" y="8.5" width="17" height="7"/><path d="M7 11v2"/>'),
  symbol("charts", '<path d="M4 20h16"/><rect x="5.5" y="12" width="3" height="6"/><rect x="10.5" y="7" width="3" height="11"/><rect x="15.5" y="10" width="3" height="8"/>'),
  symbol("effects", '<path d="M6 3v6M6 12v2M12 6v9M12 18v2M18 3v4M18 10v8"/>'),
  symbol("code", '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/>'),
  symbol("pages", '<rect x="4.5" y="3.5" width="12" height="15"/><path d="M8 21.5h11.5V7"/>'),
  symbol("search", '<rect x="4" y="4" width="11" height="11"/><path d="M15 15l5.5 5.5"/>'),
  symbol("menu", '<path d="M4 6h16M4 12h16M4 18h16"/>'),
  symbol("close", '<path d="M6 6l12 12M18 6L6 18"/>'),
  symbol("collapse", '<path d="M8 4L4 8l4 4M12 4L8 8l4 4"/>', "0 0 16 16"),
  symbol("home", '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>'),
  symbol("panel", '<rect x="2" y="2.5" width="12" height="11"/><path d="M10 2.5v11"/>', "0 0 16 16", "1.3"),
].join("\n");

const current = (on) => (on ? ' aria-current="page"' : "");

function rail(page) {
  const items = LIBRARY.map(
    (p) => `      <a class="sd-rail-item" href="./${p.file}"${current(p === page)}><svg><use href="#i-${p.icon}"/></svg><span>${p.label}</span></a>`,
  ).join("\n");
  return `  <nav class="sd-rail" id="shell-rail" aria-label="Library" data-sd-ornaments="bottom" data-sd-ornaments-size="200">
    <a class="sd-rail-home" href="./${HOME.file}" aria-label="Signal home"${current(page === HOME)}><svg class="sd-mark"><use href="#i-mark"/></svg></a>
    <button class="sd-rail-item" style="margin-top:8px" data-sd-open="nav-palette"{{search_key}} aria-label="Search (Ctrl K)"><svg><use href="#i-search"/></svg><span><kbd>Ctrl K</kbd></span></button>
    <div class="sd-rail-sep" style="margin-block:8px"></div>
    <div class="sd-rail-list">
${items}
    </div>
  </nav>`;
}

const resize = `    <div class="sd-sidebar-resize" role="separator" aria-orientation="vertical" aria-label="Resize sidebar" aria-controls="library-sidebar" aria-valuemin="224" aria-valuemax="480" aria-valuenow="288" tabindex="0" data-sd-shell="resize"></div>`;

function sidebar(page) {
  if (page !== HOME) {
    return `  <!-- library.js lists this page's blocks in the panel. -->
  <aside class="sd-sidebar" id="library-sidebar" aria-label="Blocks on this page">
    <div class="sd-sidebar-panel" data-sections="${page.sections.join(" ")}" data-title="${page.title}" data-icon="${page.icon}"></div>
${resize}
  </aside>`;
  }
  const links = (list) => list.map((p) => `          <a class="sd-sidebar-link" href="./${p.file}">${p.title}</a>`).join("\n");
  return `  <aside class="sd-sidebar" id="library-sidebar" aria-label="Pages">
    <div class="sd-sidebar-panel">
      <div class="sd-sidebar-head"><svg><use href="#i-pages"/></svg><span class="sd-sidebar-title">Pages</span>
        <button class="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm" data-sd-shell="sidebar" aria-label="Collapse sidebar"><svg><use href="#i-collapse"/></svg></button></div>
      <nav class="sd-sidebar-body" data-sd-ornaments="bottom" data-sd-ornaments-size="200" aria-label="All pages">
        <details class="sd-sidebar-group" open>
          <summary>Library <span class="sd-count">${LIBRARY.length}</span></summary>
${links(LIBRARY)}
        </details>
        <details class="sd-sidebar-group" open>
          <summary>Examples <span class="sd-count">${EXAMPLES.length}</span></summary>
${links(EXAMPLES)}
        </details>
      </nav>
      <div class="sd-sidebar-foot">signal-design · ${LIBRARY.length + EXAMPLES.length} pages</div>
    </div>
${resize}
  </aside>`;
}

/** The page-level palette: every page, from the registry. It is not a demo block. */
function palette() {
  const option = (p, hint) => `      <a role="option" href="./${p.file}" data-keywords="${p.summary.replace(/"/g, "&quot;")}">${p.title} <span class="sd-menu-hint">${hint}</span></a>`;
  return `<dialog class="sd-command" id="nav-palette" aria-label="Go to a page" data-sd-palette>
  <input type="search" placeholder="Go to a page" aria-label="Go to a page">
  <div class="sd-menu" role="listbox" aria-label="Pages">
    <div class="sd-menu-label" role="presentation">Library</div>
${[option(HOME, "overview"), ...LIBRARY.map((p) => option(p, "library"))].join("\n")}
    <div class="sd-menu-label" role="presentation">Examples</div>
${EXAMPLES.map((p) => option(p, "example")).join("\n")}
    <div class="sd-menu-label" role="presentation">Actions</div>
    <button type="button" role="option" data-sd-theme-cycle data-keywords="dark light paper">Next theme <span class="sd-menu-hint">Shift T</span></button>
  </div>
  <p class="sd-command-foot">↑↓ move · ↵ open · Esc close</p>
</dialog>`;
}

/** The right panel holds only what applies to this page: every block as code or as a preview. Theme, chart colors, scrollbars and rain live in the showcase bar. */
const aside = `  <aside class="sd-shell-aside" id="settings-panel" aria-label="Code views">
    <div class="sd-shell-aside-head"><span class="flex-1">Code views</span>
      <button class="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm" data-sd-shell="aside" aria-label="Close code views"><svg><use href="#i-close"/></svg></button></div>
    <div class="sd-shell-aside-section text-sm sd-subtle">Show every block on this page as copyable code, or as a preview.</div>
    <div class="sd-shell-aside-section sd-actions"><button class="sd-btn sd-btn-sm" data-code-all="code">Show all code</button><button class="sd-btn sd-btn-sm sd-btn-ghost" data-code-all="preview">Show all previews</button></div>
  </aside>`;
const asideButton = `      <div class="sd-shell-header-end">
        <button class="sd-btn sd-btn-sm" data-sd-shell="aside" data-sd-key="]" aria-controls="settings-panel"><svg><use href="#i-panel"/></svg><span class="sd-desktop-only">Code views</span> <kbd>]</kbd></button>
      </div>`;
const asideHint = `    <span><kbd>]</kbd> code views</span>
`;

const blockCount = (file) => (readFileSync(resolve(dir, file), "utf8").match(/<div class="demo-block"/g) || []).length;

/** Cards for the overview, from the registry. */
function cards() {
  const card = (p, site) =>
    `      <a class="sd-link-card" href="./${p.file}"><span class="sd-link-card-site">${site}</span><span class="sd-link-card-title">${p.title}</span><span class="sd-link-card-desc">${p.summary}</span></a>`;
  const grid = (items) => `    <div class="sd-grid" style="--min: 16rem; --gap: 12px">\n${items.join("\n")}\n    </div>`;
  return `  <section class="home-section" aria-labelledby="home-library-h">
    <h2 id="home-library-h" class="sd-title">Library</h2>
    <p class="sd-muted mt-2 max-w-[42rem]">One page per section. Each shows its parts, with a Preview and Code flip on every block.</p>
${grid(LIBRARY.map((p, i) => card(p, `${String(i + 1).padStart(2, "0")} · ${blockCount(p.file)} blocks`)))}
  </section>

  <section class="home-section" aria-labelledby="home-examples-h">
    <h2 id="home-examples-h" class="sd-title">Examples</h2>
    <p class="sd-muted mt-2 max-w-[42rem]">Whole pages built only from library parts.</p>
${grid(EXAMPLES.map((p) => card(p, "example")))}
  </section>`;
}

const homeContent = (body) => body.replace("<!--@cards-->", cards());

/** The page whose file this is, or null for the example pages and everything else. */
export function pageOf(filename) {
  const file = basename(filename);
  return file === HOME.file ? HOME : byFile(file) ?? null;
}

export function renderPage(page, html) {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? "";
  const content = (page === HOME ? homeContent(body) : body).replace(/^\n+|\s+$/g, "");
  const library = page !== HOME;
  const title = page === HOME ? "Signal design library" : `${page.title} · Signal design library`;
  const own = /<dialog[^>]*data-sd-palette/.test(content);
  const fill = {
    icons: ICONS,
    label: page === HOME ? "Library" : page.label,
    title: page === HOME ? "Overview" : page.title,
    crumb: page === HOME ? "Signal" : content.match(/<h3 class="sd-label">([^<]*)</)?.[1] ?? page.title,
    // A page whose own content has a command palette keeps Ctrl K for it.
    search_key: own ? "" : ' data-sd-key="mod+k"',
    rail: rail(page),
    sidebar: sidebar(page),
    aside: library ? aside : "",
    aside_button: library ? asideButton : "",
    aside_hint: library ? asideHint : "",
    palette: palette(),
  };
  const fillIn = (text) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in fill ? fillIn(fill[key]) : `{{${key}}}`));
  // The page content goes in verbatim: it is never read as a template.
  const [before, after] = template().split("{{content}}");
  return `<!doctype html>
<html lang="en" data-theme="ink">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <script>
    try { const t = localStorage.getItem("sd-theme"); if (t) document.documentElement.dataset.theme = t; } catch {}
  </script>
  <link rel="stylesheet" href="./app.css">
  <script type="module" src="./pages/${page === HOME ? "home" : page.id}.js"></script>
</head>
<body>
${fillIn(before)}${content}
${fillIn(after)}
</body>
</html>
`;
}

export function layoutPlugin() {
  return {
    name: "signal-showcase-layout",
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
