/**
 * Makes the wall's specimens that need a script run: a level, a countdown, a
 * feed. The heavy ones (a machine, ASCII art, a living table) start when their
 * tile scrolls near the screen and stop when it leaves. Chart.js never loads
 * here: the plot tile is Signal's SVG plot, not a chart.
 */
import { hotkeys, mountCountdown, mountFeed } from "../../src/js/index.js";
import { markScrollers } from "./home-scrollers.js";

/** Run `start` when `el` comes near the screen; it may return a stop function, called when the part leaves. */
function whenVisible(el, start, { margin = "200px 0px" } = {}) {
  if (!el) return;
  let stop = null;
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) stop = start() ?? null;
      else if (stop) (stop(), (stop = null));
    },
    { rootMargin: margin },
  ).observe(el);
}

function mountLevel() {
  const meter = document.querySelector("[data-wall-level]");
  const input = document.querySelector("[data-wall-level-input]");
  input?.addEventListener("input", () => {
    const level = Number(input.value) / 100;
    meter.style.setProperty("--level", level);
    meter.setAttribute("aria-valuenow", level.toFixed(2));
    meter.dataset.tone = level > 0.85 ? "warning" : "success";
  });
}

function mountOwned() {
  const root = document.querySelector("[data-wall-owned]");
  if (!root) return;
  // React, Vue or Svelte would render this; here the script is the one writer.
  root.addEventListener("click", (event) => {
    const view = event.target.closest("[data-value]");
    if (view) for (const b of root.querySelectorAll("[data-value]")) b.setAttribute("aria-pressed", String(b === view));
    const toggle = event.target.closest("[data-wall-owned-toggle]");
    if (toggle) {
      const on = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(on));
      document.getElementById(toggle.getAttribute("aria-controls")).toggleAttribute("data-open", on);
    }
  });
}

function mountPredict() {
  const out = document.querySelector("[data-wall-predict-out]");
  const target = document.querySelector("[data-wall-predict]");
  target?.addEventListener("sd:predict", ({ detail }) => {
    out.textContent = `Predicted via ${detail.via}${detail.eta ? `, about ${Math.round(detail.eta)} ms out` : ""}`;
  });
}

function mountCount() {
  const root = document.querySelector("[data-wall-countdown]");
  if (!root) return;
  const countdown = mountCountdown(root);
  let remainingMs = 5000;
  let startedAt = null;
  const set = (running) => {
    if (startedAt !== null) remainingMs = Math.max(0, remainingMs - (performance.now() - startedAt));
    startedAt = running ? performance.now() : null;
    countdown.set({ remainingMs, running });
  };
  root.addEventListener("sd:countdown", ({ detail }) => {
    if (detail.state === "complete") (remainingMs = 5000), (startedAt = null);
  });
  set(false);
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-wall-count]");
    if (button) set(button.dataset.wallCount === "run");
  });
}

function mountFeedTile() {
  const root = document.getElementById("hs-live-feed-feed");
  if (!root) return;
  const above = document.querySelector("[data-wall-feed-above]");
  root.addEventListener("sd:feed", ({ detail }) => (above.textContent = `${detail.aboveCount} above`));
  const feed = mountFeed(root);
  hotkeys({ j: () => feed.move(1), k: () => feed.move(-1) }, { target: root });
  let order = 3;
  document.querySelector('[data-wall-feed="insert"]').addEventListener("click", () => {
    feed.beforeUpdate();
    const row = document.createElement("article");
    row.className = "sd-row";
    row.dataset.id = `activity-${++order}`;
    row.dataset.order = String(order);
    row.innerHTML = `<div class="sd-row-body"><p class="sd-row-title">Activity ${order} received</p></div>`;
    root.prepend(row);
    feed.afterUpdate();
  });
}

function mountMachineTile() {
  const figure = document.querySelector('.wall-tile[data-page="machine"] .sd-machine');
  whenVisible(figure, () => {
    let machine;
    import("../../src/js/machine.js").then(({ mountMachine }) => {
      machine = mountMachine(figure, {
        seed: 7,
        size: [40, 12],
        clock: { period: 40 },
        nodes: [
          { id: "writers", kind: "source", at: [1, 2], size: [5, 8], agents: 3, every: [5, 9], to: "build", label: "writers", labelSide: "top-start" },
          { id: "build", kind: "box", at: [10, 3], size: [6, 6], capacity: 2, hold: [2, 4], label: "build", meta: "2 at a time", out: { pass: { to: "deploy", weight: 9 }, fail: { to: "writers", weight: 1, status: "failed" } } },
          { id: "deploy", kind: "press", at: [19, 3], size: [6, 6], hold: [0.6, 1.2], label: "deploy", meta: "one at a time", note: "{done} deployed", out: "prod" },
          { id: "prod", kind: "line", at: [28, 5], size: [11, 2], label: "prod", labelSide: "top-start", note: "waiting", notes: { done: "healthy", failed: "failing" } },
        ],
        wires: [
          { from: "writers", to: "build" },
          { from: "build", to: "deploy" },
          { from: "deploy", to: "prod" },
        ],
      });
    });
    return () => machine?.destroy?.();
  });
}

function mountAsciiTile() {
  const el = document.querySelector("[data-wall-ascii]");
  whenVisible(el, () => {
    let art;
    Promise.all([import("../../src/js/ascii/index.js"), import("ascii-magic-art/pieces/spinning-torus.js")]).then(([{ mountAscii }, piece]) => {
      art = mountAscii(el, piece, { at: Number(el.dataset.at) });
    });
    return () => art?.destroy?.();
  });
}

function mountLivingTableTile() {
  const root = document.querySelector(".wall-tile [data-sd-living-table]");
  whenVisible(root, () => {
    let table;
    import("../../src/js/living-table.js").then(({ mountLivingTable }) => {
      table = mountLivingTable(root);
      requestAnimationFrame(markScrollers);
    });
    return () => table?.dispose?.();
  });
}

/** The package marks its JS as side-effect free, so the home page calls this export instead of importing the module for its effects. */
export function mountWall() {
  mountLevel();
  mountOwned();
  mountPredict();
  mountCount();
  mountFeedTile();
  mountMachineTile();
  mountAsciiTile();
  mountLivingTableTile();
}
