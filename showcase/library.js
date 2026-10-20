/**
 * What every library page shares: the Preview / Code flip on each block, the
 * sidebar list of this page's blocks and scroll-aware crumbs. Theme, chart
 * colors, scrollbars and rain live in the showcase bar (viewport.js). A page
 * module calls mountLibrary() first, before any demo code, so the snapshots
 * below capture each block's markup as authored.
 */
import "./viewport.js";
import { init } from "../src/js/index.js";

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Strip the source indentation so the snippet starts at column 0. */
function dedent(html) {
  const lines = html.split("\n");
  const indents = lines.slice(1).filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((l, i) => (i === 0 ? l : l.slice(Math.min(cut, l.match(/^ */)[0].length)))).join("\n");
}

/** What init() wires in this block, so a copied snippet works. */
function jsNote(html) {
  if (/data-sd-living-table/.test(html)) return 'JS: Call <code>mountLivingTable(root)</code> from <code>signal-design/js</code>; <code>init()</code> does not mount it. Call <code>dispose()</code> on teardown.';
  if (/data-sd-countdown/.test(html)) return 'JS: Call <code>mountCountdown(root)</code> from <code>signal-design/js</code>, then <code>set({ remainingMs, running })</code>; <code>init()</code> does not mount it.';

  if (/data-sd-feed/.test(html)) return 'JS: Call <code>mountFeed(root, options)</code> and <code>hotkeys(map, options)</code> from <code>signal-design/js</code>; <code>init()</code> wires detail toggles.';
  const passive = /^data-sd-(ornaments-size|ornaments-still|rain-style|rain-skip|tip-side|align|side|static|chart-scale)$/;
  const attrs = [...new Set(html.match(/data-sd-[a-z-]+/g) || [])].filter((a) => !passive.test(a));
  const extras = [];
  if (/popovertarget/.test(html)) extras.push("popovertarget (placement, menu keys)");
  if (/role="tab"/.test(html)) extras.push('role="tab"');
  const all = [...attrs, ...extras];
  return all.length
    ? `JS: <code>init()</code> from <code>signal-design/js</code> wires ${all.map((a) => `<code>${a}</code>`).join(" · ")}.`
    : "No JS needed: the HTML works with the CSS alone.";
}

/* ---- Preview / code: snapshot every block before any script touches it -- */

function decorateBlocks(blocks) {
  const snapshots = new Map();
  for (const block of blocks) {
    const parts = [...block.children].filter((el) => !el.matches("h3.sd-label, .demo-usage, script[data-demo-js]"));
    // outerHTML starts each part at column 0; strip its source indent too.
    snapshots.set(block, parts.map((el) => dedent(el.outerHTML)).join("\n\n"));
  }
  blocks.forEach((block, n) => {
    const h3 = block.querySelector(":scope > h3.sd-label");
    if (!h3) return;
    const section = block.closest(".demo-section");
    block.id ||= `${section?.id ?? "block"}-${slug(h3.textContent)}`;
    const head = document.createElement("div");
    head.className = "demo-head";
    h3.replaceWith(head);
    head.append(h3);
    const toggle = document.createElement("div");
    toggle.className = "sd-seg sd-seg-sm sd-seg-inline";
    toggle.setAttribute("aria-label", `${h3.textContent}: view`);
    toggle.innerHTML = `<button type="button" data-view="preview" aria-pressed="true">Preview</button><button type="button" data-view="code" aria-pressed="false">Code</button>`;
    head.append(toggle);

    const code = document.createElement("div");
    code.className = "demo-code";
    const html = snapshots.get(block);
    const js = block.querySelector(":scope > script[data-demo-js]")?.textContent.trim();
    code.innerHTML =
      `<div class="sd-code"><div class="sd-code-head">HTML <button class="sd-btn sd-btn-sm sd-btn-ghost" data-sd-copy="#code-${n}">Copy</button></div><pre id="code-${n}"><code>${esc(html)}</code></pre></div>` +
      (js ? `<div class="sd-code"><div class="sd-code-head">JS <button class="sd-btn sd-btn-sm sd-btn-ghost" data-sd-copy="#code-${n}-js">Copy</button></div><pre id="code-${n}-js"><code>${esc(js)}</code></pre></div>` : "") +
      `<p class="demo-usage">${jsNote(snapshots.get(block))} CSS: <code>@import "signal-design"</code> after Tailwind, or link <code>dist/signal.css</code>.</p>`;
    head.after(code);
  });

  function setView(block, view) {
    block.dataset.view = view;
    for (const b of block.querySelectorAll(":scope > .demo-head [data-view]")) b.setAttribute("aria-pressed", String(b.dataset.view === view));
  }
  document.addEventListener("click", (event) => {
    const b = event.target.closest(".demo-head [data-view]");
    if (b) setView(b.closest(".demo-block"), b.dataset.view);
    const all = event.target.closest("[data-code-all]");
    if (all) for (const block of blocks) setView(block, all.dataset.codeAll);
  });
}

/* ---- Sidebar: one link per block, grouped by section ------------------- */

function buildSidebar() {
  const panel = document.querySelector(".sd-sidebar-panel[data-sections]");
  if (!panel) return;
  const groups = panel.dataset.sections.split(" ").map((id) => document.getElementById(id)).filter(Boolean);
  const count = groups.reduce((n, g) => n + g.querySelectorAll(".demo-block").length, 0);
  panel.innerHTML =
    `<div class="sd-sidebar-head"><svg><use href="#i-${panel.dataset.icon}"/></svg><span class="sd-sidebar-title">${panel.dataset.title}</span>` +
    `<button class="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm" data-sd-shell="sidebar" data-sd-key="[" aria-label="Collapse sidebar"><svg><use href="#i-collapse"/></svg></button></div>` +
    `<nav class="sd-sidebar-body" data-sd-ornaments="bottom" data-sd-ornaments-size="200" aria-label="${panel.dataset.title} blocks">` +
    groups
      .map((g) => {
        const links = [...g.querySelectorAll(".demo-block")].map((b) => `<a class="sd-sidebar-link" href="#${b.id}" data-block="${b.id}">${b.querySelector("h3").textContent}</a>`);
        return `<details class="sd-sidebar-group" open><summary>${g.querySelector("h2").textContent} <span class="sd-count">${links.length}</span></summary>${links.join("")}</details>`;
      })
      .join("") +
    `</nav><div class="sd-sidebar-foot">${count} blocks · Preview or Code on each</div>`;
}

/* ---- Where you are: crumbs and sidebar follow the scroll ----------------- */

function followScroll(blocks) {
  const content = document.querySelector("#shell .sd-shell-content");
  const crumb = document.querySelector("[data-crumb-page]");
  let current = null;
  let lastLink = null;
  const seen = new Map();

  // Updating crumbs and the sidebar restyles and re-lays out parts of the
  // frame, so do it once the scroll settles, never on every frame of it.
  function showWhereYouAre() {
    const top = [...seen].filter(([, y]) => y !== null).sort((a, b) => a[1] - b[1])[0]?.[0];
    if (!top || top === current) return;
    current = top;
    const title = top.querySelector("h3")?.textContent ?? "";
    if (crumb.textContent !== title) crumb.textContent = title;
    lastLink?.removeAttribute("aria-current");
    lastLink = document.querySelector(`.sd-sidebar-link[data-block="${top.id}"]`);
    lastLink?.setAttribute("aria-current", "page");
  }
  let settle = 0;
  const later = () => {
    clearTimeout(settle);
    settle = setTimeout(showWhereYouAre, 140);
  };
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) seen.set(e.target, e.isIntersecting ? e.boundingClientRect.top : null);
      later();
    },
    { root: content, rootMargin: "0px 0px -60% 0px" },
  );
  for (const block of blocks) spy.observe(block);
  content.addEventListener("scroll", () => settle && later(), { passive: true });
}

/** Wire the page shell. Call first: it snapshots the blocks, then runs init(). */
export function mountLibrary() {
  const blocks = [...document.querySelectorAll(".demo-block")];
  decorateBlocks(blocks);
  buildSidebar();
  init();
  if (blocks.length) followScroll(blocks);
}
