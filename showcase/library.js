/**
 * What every library page shares: the Preview / Code flip on each block, rail
 * sections that open their sidebar, remembered group folds and the current
 * page's link scrolled into view in the sidebar. Theme, chart
 * colors, scrollbars and rain live in the showcase bar (viewport.js). A page
 * module calls mountLibrary() first, before any demo code, so the snapshots
 * below capture each block's markup as authored.
 */
import { mountBar, savedScrollbars } from "./viewport.js";
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
  const passive = /^data-sd-(ornaments-size|ornaments-seed|ornaments-still|rain-style|rain-skip|tip-side|align|side|static|chart-scale)$/;
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
    const parts = [...block.children].filter((el) => !el.matches("h2.sd-label, .demo-usage, script[data-demo-js]"));
    // outerHTML starts each part at column 0; strip its source indent too.
    snapshots.set(block, parts.map((el) => dedent(el.outerHTML)).join("\n\n"));
  }
  blocks.forEach((block, n) => {
    const title = block.querySelector(":scope > h2.sd-label");
    if (!title) return;
    const section = block.closest(".demo-section");
    block.id ||= `${section?.id ?? "block"}-${slug(title.textContent)}`;
    const head = document.createElement("div");
    head.className = "demo-head";
    title.replaceWith(head);
    head.append(title);
    const toggle = document.createElement("div");
    toggle.className = "sd-seg sd-seg-sm sd-seg-inline";
    toggle.setAttribute("aria-label", `${title.textContent}: view`);
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

/* ---- Rail and sidebar ---------------------------------------------------- */

// A section opens its first page while the sidebar is pinned beside the page.
// Collapsed, on a tablet or in the phone drawer, the click stays on the rail
// and the shell shows that section's pages instead.
function wireRail() {
  document.getElementById("shell-rail")?.addEventListener("click", (event) => {
    const item = event.target.closest(".sd-rail-item[data-sd-section]");
    if (item && (item.closest(".sd-shell").dataset.sidebar === "collapsed" || !matchMedia("(min-width: 64rem)").matches)) event.preventDefault();
  });
}

// Folded groups stay folded from page to page; the group holding the current page always opens.
const FOLDED = "sd-showcase-folded";
function rememberFolds() {
  let folded = [];
  try {
    folded = JSON.parse(localStorage.getItem(FOLDED)) || [];
  } catch {
    /* storage blocked */
  }
  for (const group of document.querySelectorAll("#library-sidebar .sd-sidebar-group")) {
    if (folded.includes(group.dataset.group) && !group.querySelector('[aria-current="page"]')) group.open = false;
    group.addEventListener("toggle", () => {
      folded = folded.filter((key) => key !== group.dataset.group).concat(group.open ? [] : [group.dataset.group]);
      try {
        localStorage.setItem(FOLDED, JSON.stringify(folded));
      } catch {
        /* storage blocked */
      }
    });
  }
}

function revealCurrent() {
  const link = document.querySelector('#library-sidebar .sd-sidebar-link[aria-current="page"]');
  const body = link?.closest(".sd-sidebar-body");
  if (!body) return;
  const top = link.getBoundingClientRect().top - body.getBoundingClientRect().top;
  if (top + link.offsetHeight > body.clientHeight) body.scrollTop = top - body.clientHeight / 3;
}

/** Wire the page shell. Call first: it snapshots the blocks, then runs init(). */
export function mountLibrary() {
  mountBar();
  const blocks = [...document.querySelectorAll(".demo-block")];
  decorateBlocks(blocks);
  // An old section link (#tokens) lands on a page with no such anchor: show the page from its top.
  if (location.hash && !document.getElementById(decodeURIComponent(location.hash.slice(1)))) history.replaceState(null, "", location.pathname + location.search);
  init({ scrollbars: savedScrollbars() });
  wireRail();
  rememberFolds();
  revealCurrent();
}
