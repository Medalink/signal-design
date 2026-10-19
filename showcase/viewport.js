/**
 * Showcase helper: a width toggle on every page. Pick a width and the same
 * page opens in a frame at that size, so layouts can be checked at phone,
 * tablet and laptop widths without resizing the window. Esc or Full closes.
 */
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
  // One small button; the widths are a menu, so it never covers the page.
  const bar = document.createElement("div");
  bar.className = "vp-toggle";
  bar.innerHTML =
    `<button type="button" class="sd-btn sd-btn-sm" popovertarget="vp-menu" aria-haspopup="menu" aria-expanded="false"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="1.5" y="3" width="13" height="10"/><path d="M5 8H1.5M11 8h3.5M3.5 6.5L2 8l1.5 1.5M12.5 6.5L14 8l-1.5 1.5"/></svg>Width</button>` +
    `<div popover id="vp-menu" class="sd-popover" data-sd-side="top" data-sd-align="start"><div class="sd-menu" role="menu" aria-label="Show this page at a width">${SIZES.map(
      (s) => `<button role="menuitemradio" data-vp="${s.w}" aria-checked="${s.w === 0}">${s.name ?? "Full window"}</button>`,
    ).join("")}</div></div>`;
  document.body.append(bar);

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
    for (const b of document.querySelectorAll("[data-vp]")) b.setAttribute(b.getAttribute("role") === "menuitemradio" ? "aria-checked" : "aria-pressed", String(Number(b.dataset.vp) === current.w));
    document.getElementById("vp-menu")?.hidePopover?.();
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
    for (const b of document.querySelectorAll("[data-vp]")) b.setAttribute(b.getAttribute("role") === "menuitemradio" ? "aria-checked" : "aria-pressed", String(Number(b.dataset.vp) === 0));
    frame.removeAttribute("src");
  });
  addEventListener("resize", () => dialog.open && fit(current));
}

if (!inFrame) mount();
