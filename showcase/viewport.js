/**
 * Showcase helper: a slim bar at the top of every page with links to the
 * showcase pages and a width switch. Pick a width and the same page opens in
 * a frame at that size, so layouts can be checked at phone, tablet and laptop
 * widths without resizing the window. Esc or Full closes. The bar sits in the
 * page flow (nothing is covered) and is hidden on phones and inside the frame.
 */
import { EXAMPLES, HOME } from "./pages.js";

const PAGES = [HOME, ...EXAMPLES].map((p) => [p.file, p.title]);
const SIZES = [
  { label: "Full", w: 0 },
  { label: "1440", w: 1440, h: 900, name: "Desktop 1440 × 900" },
  { label: "1024", w: 1024, h: 768, name: "Laptop 1024 × 768" },
  { label: "768", w: 768, h: 1024, name: "Tablet 768 × 1024" },
  { label: "390", w: 390, h: 844, name: "Phone 390 × 844" },
  { label: "360", w: 360, h: 780, name: "Small phone 360 × 780" },
];

const inFrame = new URLSearchParams(location.search).has("frame") || window !== window.top;

function frameUrl() {
  const url = new URL(location.href);
  url.searchParams.set("frame", "");
  return url.toString();
}

function mount() {
  const here = location.pathname.split("/").pop() || "index.html";
  const bar = document.createElement("nav");
  bar.className = "vp-bar";
  bar.setAttribute("aria-label", "Showcase");
  bar.innerHTML =
    `<span class="vp-brand">Signal showcase</span>` +
    `<span class="vp-pages">${PAGES.map(([href, label]) => `<a href="./${href}"${href === here ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</span>` +
    `<span class="vp-widths"><span id="vp-label">Width</span><span class="sd-seg sd-seg-sm sd-seg-inline" role="group" aria-labelledby="vp-label">${SIZES.map(
      (s) => `<button type="button" data-vp="${s.w}" aria-pressed="${s.w === 0}" ${s.name ? `aria-label="${s.name}"` : ""}>${s.label}</button>`,
    ).join("")}</span></span>`;
  // After the skip link, so that stays the first thing Tab reaches.
  const skip = document.querySelector("body > .sd-skip");
  (skip ? skip.after(bar) : document.body.prepend(bar));
  document.documentElement.classList.add("has-vp-bar");

  const dialog = document.createElement("dialog");
  dialog.className = "vp-dialog";
  dialog.setAttribute("aria-label", "Page at a set width");
  dialog.innerHTML = `<div class="vp-head"><span class="vp-name"></span><div class="sd-seg sd-seg-sm sd-seg-inline" role="group" aria-label="Width">${SIZES.map(
    (s) => `<button type="button" data-vp="${s.w}" ${s.name ? `aria-label="${s.name}"` : ""}>${s.label}</button>`,
  ).join("")}</div></div><div class="vp-stage"><iframe title="This page at a set width"></iframe></div>`;
  document.body.append(dialog);
  const frame = dialog.querySelector("iframe");
  const stage = dialog.querySelector(".vp-stage");

  function fit(size) {
    // Scale the frame down when the window is smaller than the device.
    const room = { w: stage.clientWidth - 32, h: stage.clientHeight - 32 };
    const scale = Math.min(1, room.w / size.w, room.h / size.h);
    frame.style.width = `${size.w}px`;
    frame.style.height = `${size.h}px`;
    frame.style.transform = scale < 1 ? `scale(${scale})` : "";
    dialog.querySelector(".vp-name").textContent = `${size.name}${scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ""}`;
  }

  let current = SIZES[0];
  function show(w) {
    current = SIZES.find((s) => s.w === w) ?? SIZES[0];
    for (const b of document.querySelectorAll("[data-vp]")) b.setAttribute("aria-pressed", String(Number(b.dataset.vp) === current.w));
    if (!current.w) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
      frame.src = frameUrl();
    }
    fit(current);
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-vp]");
    if (b) show(Number(b.dataset.vp));
    else if (e.target === dialog || e.target === stage) show(0);
  });
  dialog.addEventListener("close", () => {
    for (const b of document.querySelectorAll("[data-vp]")) b.setAttribute("aria-pressed", String(Number(b.dataset.vp) === 0));
    frame.removeAttribute("src");
  });
  addEventListener("resize", () => dialog.open && fit(current));
}

if (!inFrame) mount();
