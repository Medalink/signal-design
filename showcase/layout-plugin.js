/**
 * Vite plugin: wraps each library page (and the overview) in the shared App
 * Shell chrome from layout.html. A page file holds only its content in
 * <body>; the head, rail, sidebar, page header, pager, nav palette and aside
 * come from here and from pages.js, so the served and built HTML is static
 * and no page copies the chrome.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { HOME, SECTIONS, byFile, keyOf, neighbors } from "./pages.js";

const dir = import.meta.dirname;
const template = () => readFileSync(resolve(dir, "layout.html"), "utf8");

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
const aside = `  <aside class="sd-shell-aside" id="settings-panel" aria-label="Code views">
    <div class="sd-shell-aside-head"><span class="flex-1">Code views</span>
      <button class="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm" data-sd-shell="aside" aria-label="Close code views"><svg><use href="#i-close"/></svg></button></div>
    <div class="sd-shell-aside-section sd-actions"><button class="sd-btn sd-btn-sm" data-code-all="code">Show all code</button><button class="sd-btn sd-btn-sm sd-btn-ghost" data-code-all="preview">Show all previews</button></div>
  </aside>`;
const asideButton = `      <div class="sd-shell-header-end">
        <button class="sd-btn sd-btn-sm" data-sd-shell="aside" data-sd-key="]" aria-controls="settings-panel"><svg><use href="#i-panel"/></svg><span class="sd-desktop-only">Code views</span> <kbd>]</kbd></button>
      </div>`;
const asideHint = `    <span><kbd>]</kbd> code views</span>
`;

const blockCount = (file) => (readFileSync(resolve(dir, file), "utf8").match(/<div class="demo-block"/g) || []).length;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Cards for the overview: a section per rail section, a grid per group. */
function cards() {
  const card = (p) =>
    `      <a class="sd-link-card" href="./${p.file}"><span class="sd-link-card-site">${p.id ? plural(blockCount(p.file), "block") : "example"}</span><span class="sd-link-card-title">${p.title}</span><span class="sd-link-card-desc">${p.summary}</span></a>`;
  const group = (g) => `    <h3 class="sd-label">${g.title}</h3>
    <div class="sd-grid" style="--min: 16rem; --gap: 12px">
${g.pages.map(card).join("\n")}
    </div>`;
  return SECTIONS.map(
    (s) => `  <section class="home-section" id="home-${s.id}" aria-labelledby="home-${s.id}-h">
    <h2 id="home-${s.id}-h" class="sd-title">${s.title}</h2>
${s.groups.map(group).join("\n")}
  </section>`,
  ).join("\n\n");
}

/** A library page: its group and title over its content, then the pages either side. */
function libraryContent(page, body) {
  const title = `<div class="demo-title"><p class="sd-label">${page.group.title}</p><h1 id="${page.id}-h" class="sd-display">${page.title}</h1></div>`;
  const content = body.startsWith('<header class="demo-intro">')
    ? body.replace('<header class="demo-intro">', `<header class="demo-intro">\n    ${title}`)
    : `<header class="demo-intro">\n    ${title}\n  </header>\n\n  ${body}`;
  const { prev, next } = neighbors(page);
  const step = (p, rel, side) =>
    p ? `    <a class="sd-link-card" href="./${p.file}" rel="${rel}"><span class="sd-link-card-site">${side}</span><span class="sd-link-card-title">${p.title}</span></a>` : "    <span></span>";
  return `  <section class="demo-section" id="${page.id}" aria-labelledby="${page.id}-h">
  ${content}
  </section>

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
  const content = library ? libraryContent(page, body) : `  ${body.replace("<!--@cards-->", cards())}`;
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
    search_key: own ? "" : ' data-sd-key="mod+k"',
    search_label: own ? "Go to a page" : "Go to a page (Ctrl K)",
    search_kbd: own ? "" : "<span><kbd>Ctrl K</kbd></span>",
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
