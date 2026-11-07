/**
 * What every library page shares: the Preview / Code flip driven by the
 * toolbar's single pair, the sidebar page filter, the phone drawer and the
 * Ctrl K shortcut that focuses the filter. Theme, chart colors, scrollbars
 * and rain live in the showcase bar (viewport.js). A page module calls
 * mountLibrary() first, before any demo code, so the snapshots below capture
 * each block's markup as authored.
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
  const passive = /^data-sd-(ornaments-size|ornaments-seed|ornaments-still|ornaments-style|iris-still|mascot-still|mascot-press|rain-style|rain-skip|tip-side|align|side|static|chart-scale)$/;
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
  }
  // One control flips every block: the toolbar's Preview / Code pair. The
  // seg's own wiring keeps its aria-pressed current.
  document.addEventListener("click", (event) => {
    const all = event.target.closest("[data-code-all]");
    if (all) for (const block of blocks) setView(block, all.dataset.codeAll);
  });

  // The preview bar's tools: full or phone width for the canvas, and the
  // canvas full screen.
  const canvas = document.querySelector(".doc-canvas");
  document.addEventListener("click", (event) => {
    const width = event.target.closest("[data-doc-width]");
    if (width && canvas) {
      canvas.dataset.width = width.dataset.docWidth;
      for (const b of document.querySelectorAll("[data-doc-width]")) b.setAttribute("aria-pressed", String(b === width));
    } else if (event.target.closest("[data-doc-fullscreen]") && canvas) {
      if (document.fullscreenElement) document.exitFullscreen();
      else canvas.requestFullscreen?.();
    }
  });
}

/* ---- Sidebar: tiers, filter, phone drawer, Ctrl K ------------------------- */

function wireSidebar() {
  const sidebar = document.getElementById("doc-sidebar");
  const filter = document.getElementById("doc-filter");
  const nav = document.getElementById("doc-nav");
  if (!sidebar || !filter || !nav) return;

  // The tier row (All / Components / Examples) picks which registry sections
  // show; the search narrows the links inside them. Both write the same
  // hidden attributes, so the filter re-runs after a tier change.
  const empty = document.createElement("p");
  empty.className = "doc-nav-empty";
  empty.hidden = true;
  empty.textContent = "No pages match.";
  nav.append(empty);
  const runFilter = () => {
    const q = filter.value.trim().toLowerCase();
    for (const section of nav.querySelectorAll(".doc-nav-section")) {
      if (section.dataset.tierHidden === "true") {
        section.hidden = true;
        continue;
      }
      let sectionAny = false;
      for (const group of section.querySelectorAll(".doc-nav-group")) {
        let groupAny = false;
        for (const link of group.querySelectorAll(".doc-nav-link")) {
          const hit = !q || link.textContent.toLowerCase().includes(q);
          link.hidden = !hit;
          groupAny ||= hit;
        }
        group.hidden = !groupAny;
        // A search opens every group it matches inside, so a hit is never
        // folded away; clearing it leaves the tree as the reader left it.
        if (q && groupAny) group.open = true;
        sectionAny ||= groupAny;
      }
      section.hidden = !sectionAny;
      if (q && sectionAny) section.open = true;
    }
    empty.hidden = !!nav.querySelector(".doc-nav-link:not([hidden])");
  };
  filter.addEventListener("input", runFilter);

  const tiers = document.querySelector(".doc-tiers");
  if (tiers) {
    const radios = [...tiers.querySelectorAll('[role="radio"]')];
    // Roving tabindex: the checked radio is the only one in the tab order.
    const rove = () => {
      for (const r of radios) r.tabIndex = r.getAttribute("aria-checked") === "true" ? 0 : -1;
    };
    const choose = (radio, focus) => {
      for (const r of radios) r.setAttribute("aria-checked", String(r === radio));
      for (const section of nav.querySelectorAll(".doc-nav-section"))
        section.dataset.tierHidden = String(radio.dataset.tier !== "all" && section.dataset.kind !== radio.dataset.tier);
      rove();
      runFilter();
      if (focus) radio.focus();
    };
    rove();
    tiers.addEventListener("click", (event) => {
      const radio = event.target.closest('[role="radio"]');
      if (radio) choose(radio);
    });
    tiers.addEventListener("keydown", (event) => {
      const radio = event.target.closest('[role="radio"]');
      if (!radio) return;
      const i = radios.indexOf(radio);
      const moves = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      choose(radios[(moves[event.key] + radios.length) % radios.length], true);
    });
  }

  // The topbar search affordance lands on the sidebar filter, opening the
  // drawer first on a phone; the toc's back-to-top scrolls home.
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-doc-search]")) {
      if (matchMedia("(max-width: 63.99rem)").matches && !isOpen()) open(true);
      filter.focus();
    } else if (event.target.closest("[data-doc-top]")) {
      const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    }
  });

  // The phone drawer: the topbar button and the sidebar's close button toggle
  // it, the scrim click and Esc close it, and the article is inert while it
  // is open. A resize up to desktop closes it.
  const main = document.getElementById("main");
  const toggles = [...document.querySelectorAll("[data-doc-nav]")];
  const isOpen = () => document.body.dataset.docNav === "open";
  const open = (on) => {
    if (on) document.body.dataset.docNav = "open";
    else delete document.body.dataset.docNav;
    for (const b of toggles) b.setAttribute("aria-expanded", String(on));
    if (main) main.inert = on;
  };
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-doc-nav]")) open(!isOpen());
    else if (event.target.closest("[data-doc-nav-close]")) open(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) open(false);
  });
  matchMedia("(min-width: 64rem)").addEventListener("change", (m) => m.matches && isOpen() && open(false));

  // Ctrl K focuses the filter — except where the page's own command palette
  // claims the key.
  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "k" || !(event.ctrlKey || event.metaKey) || event.altKey || event.repeat) return;
    if (document.querySelector(".demo-block dialog[data-sd-palette]")) return;
    event.preventDefault();
    if (matchMedia("(max-width: 63.99rem)").matches) {
      open(true);
    } else {
      filter.focus();
    }
  });

  // The current page's link starts in view inside the sidebar.
  nav.querySelector('.doc-nav-link[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
}

/** The toc's marker bar follows the section in view: the last section whose top has risen past the topbar is current, and Preview before any has. */
function wireScrollspy() {
  const links = [...document.querySelectorAll(".doc-toc a[href^='#']")];
  const ids = [...new Set(links.map((a) => a.getAttribute("href").slice(1)))];
  const targets = ids.map((id) => document.getElementById(id)).filter(Boolean);
  if (!links.length || !targets.length) return;
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const setCurrent = (id) => {
    for (const [key, a] of byId) {
      if (key === id) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
  };
  // The line a section crosses sits just under the topbar (plus the harness bar).
  const top = document.documentElement.classList.contains("has-vp-bar") ? 140 : 104;
  let ticking = false;
  const mark = () => {
    ticking = false;
    let current = targets[0].id;
    for (const t of targets) if (t.getBoundingClientRect().top <= top) current = t.id;
    setCurrent(current);
  };
  addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(mark);
    }
  }, { passive: true });
  mark();
}

/** Wire the page. Call first: it snapshots the blocks, then runs init(). */
export function mountLibrary() {
  mountBar();
  const blocks = [...document.querySelectorAll(".demo-block")];
  decorateBlocks(blocks);
  // An old section link (#tokens) lands on a page with no such anchor: show the page from its top.
  if (location.hash && !document.getElementById(decodeURIComponent(location.hash.slice(1)))) history.replaceState(null, "", location.pathname + location.search);
  init({ scrollbars: savedScrollbars() });
  wireSidebar();
  wireScrollspy();
}
