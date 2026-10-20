import { mountBar } from "./viewport.js";
import { init, hotkeys, toast, setExpanded, rain, setOptions, openDialog } from "../src/js/index.js";

mountBar();
init();

const shell = document.getElementById("shell");
const content = document.querySelector(".sd-shell-content");

/* ---- Work items ------------------------------------------------------ */

const items = [
  { n: 28, team: "design", time: "08:04", title: "Update pricing page copy for the Pro plan", tone: "pending", shape: "dashed" },
  { n: 27, team: "platform", time: "08:02", title: "Cut checkout p95 latency from 410ms to 260ms", tone: "warning" },
  { n: 26, team: "platform", time: "08:01", title: "Renew the TLS certificate before Oct 30", tone: "warning" },
  { n: 25, team: "data", time: "07:59", title: "Add 14 tests for refund edge cases", shape: "hollow" },
  { n: 24, team: "sales", time: "07:58", title: "Send the $4,200 renewal quote to a customer", tone: "danger", risk: true },
  { n: 23, team: "support", time: "07:57", title: "Triage 9 new tickets, close 2 duplicates", shape: "hollow", lock: "Alex" },
  { n: 22, team: "billing", time: "07:56", title: "Stop double charges when a payment retries", tone: "danger", risk: true },
  { n: 21, team: "platform", time: "07:55", title: "Fix the crash when a customer has no address", tone: "warning" },
  { n: 20, team: "platform", time: "07:50", title: "Upgrade the web framework to 11.31.4", tone: "warning", done: true },
  { n: 19, team: "design", time: "07:40", title: "Fix 6 broken links in the help center", shape: "hollow", done: true },
  { n: 18, team: "billing", time: "07:31", title: "Categorize 38 September transactions", tone: "warning", done: true },
];
let focus = 21;
let open = null;

const feed = document.querySelector("[data-feed]");

function rowHTML(c) {
  const dot = `<span class="sd-dot"${c.tone ? ` data-tone="${c.tone}"` : ""}${c.shape ? ` data-shape="${c.shape}"` : ""}></span>`;
  const meta = `<p class="sd-meta"><span>#${c.n}</span><span>${c.team}</span><span>${c.time}</span>${c.risk ? '<span data-tone="danger">risk</span>' : ""}</p>`;
  const end = c.done
    ? '<span class="sd-badge" data-tone="success">approved</span>'
    : c.lock
      ? `<span class="sd-badge" data-tone="extra">${c.lock} reviewing</span>`
      : c.n === focus
        ? `<button class="sd-btn sd-btn-sm${c.risk ? '" data-tone="danger' : " sd-btn-primary"}" data-approve="${c.n}">${c.risk ? "Review" : "Approve"} <kbd>a</kbd></button>`
        : "";
  return `<article class="sd-row" data-n="${c.n}" tabindex="-1"${c.n === focus ? ' aria-current="true"' : ""}${c.risk ? " data-edge" : ""}${c.tone === "danger" ? ' data-tone="danger"' : ""}${c.done ? " data-done" : ""}>
    ${dot}<div class="sd-row-body"><p class="sd-row-title">${c.title}</p>${meta}</div><div class="sd-row-end">${end}</div></article>
    <div class="sd-expand" id="detail-${c.n}"${open === c.n ? " data-open" : ""}><div>
      <div class="grid gap-5 py-4 pl-[18px] sm:grid-cols-2">
        <div class="grid gap-2 content-start"><span class="sd-label">Preview</span><div class="sd-shot"><span class="sd-shot-caption">0:07 / 0:12</span></div></div>
        <div class="grid gap-2 content-start"><span class="sd-label">Checks</span>
          <ul class="sd-checks"><li data-tone="success">checks passed · 214 tests</li><li data-tone="success">reviewed by Alex</li><li data-tone="pending">monitoring for 7 days</li></ul>
          <p class="sd-meta"><span>ACME-4${c.n}</span><span>3 files changed</span></p></div>
      </div>
      <div class="sd-actions pl-[18px] pb-5">
        <button class="sd-btn sd-btn-primary" data-approve="${c.n}">Approve <kbd>a</kbd></button>
        <button class="sd-btn" data-sd-shell="aside">Request changes <kbd>s</kbd></button>
        <button class="sd-btn" data-tone="danger">Decline <kbd>x</kbd></button>
      </div>
    </div></div>`;
}

function render() {
  const lastDone = Math.max(...items.filter((c) => c.done).map((c) => c.n));
  const next = nextUp();
  feed.innerHTML = items
    .map((c) => {
      const marker =
        c.n === lastDone
          ? `<div class="sd-marker"><span>You are here</span><span class="sd-marker-plain">reviewed through #${lastDone}</span><span class="sd-marker-end"><kbd>N</kbd> next is #${next ?? "–"}</span></div>`
          : "";
      return marker + rowHTML(c);
    })
    .join("");
  const done = items.filter((c) => c.done).length;
  document.querySelector("[data-done]").textContent = String(8 + done - 3);
  document.querySelector("[data-open]").textContent = String(32 - (done - 3));
  const cells = document.querySelector("[data-cells]");
  cells.innerHTML = items.map((c) => `<i${c.done ? " data-on" : ""}></i>`).join("");
  document.querySelector("[data-item]").textContent = `#${focus}`;
}

const nextUp = () => items.filter((c) => !c.done && !c.lock).map((c) => c.n).sort((a, b) => a - b)[0];
const rowEl = (n) => feed.querySelector(`.sd-row[data-n="${n}"]`);

function setFocus(n, scroll = true) {
  focus = n;
  render();
  if (scroll) rowEl(n)?.scrollIntoView({ block: "center", behavior: "smooth" });
}

function move(delta) {
  const order = items.map((c) => c.n);
  const i = Math.max(0, Math.min(order.length - 1, order.indexOf(focus) + delta));
  setFocus(order[i]);
}

function approve(n) {
  const c = items.find((x) => x.n === n);
  if (!c || c.done || c.lock) return;
  if (c.risk) {
    open = n;
    render();
    toast(`#${n} is high risk: review the details first`, { tone: "danger" });
    return;
  }
  c.done = true;
  open = null;
  toast(`Approved #${n}`, { tone: "success", action: { label: "Undo", onClick: () => ((c.done = false), render()) } });
  const next = nextUp();
  setFocus(next ?? n);
}

function toggleDetail(n) {
  open = open === n ? null : n;
  setExpanded(`detail-${n}`, open === n);
}

feed.addEventListener("click", (event) => {
  const ap = event.target.closest("[data-approve]");
  if (ap) return approve(Number(ap.dataset.approve));
  if (event.target.closest("button, a")) return;
  const row = event.target.closest(".sd-row");
  if (row) {
    const n = Number(row.dataset.n);
    if (n !== focus) setFocus(n, false);
    toggleDetail(n);
  }
});

hotkeys({
  j: () => move(1),
  k: () => move(-1),
  n: () => nextUp() && setFocus(nextUp()),
  "shift+n": () => content.scrollTo({ top: 0, behavior: "smooth" }),
  a: () => approve(focus),
  enter: () => toggleDetail(focus),
  s: () => shell.querySelector('[data-sd-shell="aside"]').click(),
  "mod+k": () => openDialog("palette"),
});

render();
rowEl(focus)?.scrollIntoView({ block: "center" });

/* ---- Breadcrumb and page label follow the shell ----------------------- */

/** A link's own words, without its icon, count or badge. */
function linkLabel(link) {
  const copy = link.cloneNode(true);
  for (const el of copy.querySelectorAll("svg, .sd-count, .sd-badge, .sd-avatar, .sd-dot")) el.remove();
  return copy.textContent.trim();
}

const crumbSection = document.querySelector("[data-crumb-section]");
const crumbPage = document.querySelector("[data-crumb-page]");
const pageLabel = document.querySelector("[data-page-label]");

function syncCrumbs() {
  const panel = shell.querySelector(".sd-sidebar-panel:not([hidden])");
  const section = panel.querySelector(".sd-sidebar-title").textContent;
  const current = panel.querySelector('.sd-sidebar-link[aria-current="page"]');
  const page = current ? linkLabel(current) : section;
  crumbSection.textContent = section;
  const icon = panel.querySelector(".sd-sidebar-head use")?.getAttribute("href");
  if (icon) document.querySelector("[data-crumb-icon]").setAttribute("href", icon);
  crumbPage.textContent = page;
  pageLabel.textContent = `${section} / ${page}`;
}

shell.addEventListener("sd:shell", syncCrumbs);
syncCrumbs();
shell.addEventListener("click", (event) => {
  const link = event.target.closest(".sd-sidebar-link");
  if (!link) return;
  event.preventDefault();
  for (const l of link.closest(".sd-sidebar-panel").querySelectorAll(".sd-sidebar-link")) l.removeAttribute("aria-current");
  link.setAttribute("aria-current", "page");
  syncCrumbs();
});

document.querySelector("[data-request-changes]").addEventListener("click", () => {
  const note = document.getElementById("change-note");
  if (!note.value.trim()) {
    note.setAttribute("aria-invalid", "true");
    note.focus();
    return;
  }
  note.removeAttribute("aria-invalid");
  toast(`Requested changes on #${focus} from ${items.find((c) => c.n === focus).team}`);
  note.value = "";
});

/* ---- Live presence: state changes, not ambient motion ---------------- */

const live = document.querySelector("[data-live]");
const sam = document.querySelector("[data-sam]");
let samAt = 25;
setInterval(() => {
  samAt = samAt >= 28 ? 24 : samAt + 1;
  live.textContent = `Sam viewing #${samAt} · Alex reviewing #23`;
  sam.textContent = `#${samAt}`;
}, 4000);

/* ---- Command palette: the library's palette, filled from the page -------- */

setOptions(document.getElementById("palette"), [
  ...[...shell.querySelectorAll(".sd-sidebar-panel")].flatMap((panel) =>
    [...panel.querySelectorAll(".sd-sidebar-link")].map((link) => ({
      group: "Pages",
      label: `${panel.querySelector(".sd-sidebar-title").textContent} / ${linkLabel(link)}`,
      hint: "page",
      run: () => {
        shell.querySelector(`.sd-rail-item[data-sd-section="${panel.dataset.section}"]`).click();
        link.click();
      },
    })),
  ),
  ...items.map((c) => ({ group: "Items", label: `#${c.n} ${c.title}`, hint: c.team, run: () => setFocus(c.n) })),
]);

/* ---- Checks demo: the rain moves only while work runs ----------------- */

const runBatch = document.querySelector("[data-run-batch]");
runBatch.addEventListener("click", () => {
  if (runBatch.getAttribute("aria-busy") === "true") return;
  runBatch.setAttribute("aria-busy", "true");
  rain.busy(true);
  toast("Checks started on 8 items");
  setTimeout(() => {
    runBatch.removeAttribute("aria-busy");
    rain.busy(false);
    toast("Checks finished: 8 of 8 passed", { tone: "success" });
  }, 8000);
});
