import { mountBar, savedScrollbars } from "./viewport.js";
import { init, toast, setExpanded, openDialog, drawSpark } from "../src/js/index.js";
import { icon } from "../src/js/icons.js";

mountBar();
const swap = (root) => {
  for (const el of root.querySelectorAll("i[data-ic]")) el.replaceWith(...new DOMParser().parseFromString(icon(el.dataset.ic), "text/html").body.children);
};
swap(document);
init({ scrollbars: savedScrollbars() });

const $ = (sel) => document.querySelector(sel);
const html = (s) => Object.assign(document.createElement("template"), { innerHTML: s.trim() }).content.firstElementChild;

/* ---- Containers -------------------------------------------------------- */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WSL_MEMORY = 45.9 * 1024;
const WSL_CPUS = 32;
const now = Date.now();

const series = (base, spread) => Array.from({ length: 24 }, (_, i) => Math.max(0, base + Math.sin(i * 1.7) * spread + (i % 5) * spread * 0.1));

const containers = [
  { id: "checkout-api", group: "acme-shop", port: 8080, cpu: 0.6, mem: 412, state: "running", since: now - (3 * DAY + 4 * HOUR), image: "node:22-alpine", path: "C:\\Users\\dev\\code\\acme-shop\\checkout-api", created: "Oct 26, 09:14", net: "1.2 MB in / 860 kB out", disk: "128 MB", pids: 14 },
  { id: "worker", group: "acme-shop", port: null, cpu: 0.2, mem: 268, state: "running", since: now - (3 * DAY + 4 * HOUR), image: "node:22-alpine", path: "C:\\Users\\dev\\code\\acme-shop\\worker", created: "Oct 26, 09:14", net: "310 kB in / 95 kB out", disk: "96 MB", pids: 9 },
  { id: "storefront", group: "acme-shop", port: 3000, cpu: 0.4, mem: 640, state: "unhealthy", since: now - (2 * HOUR + 18 * MIN), image: "nginx:1.27", path: "C:\\Users\\dev\\code\\acme-shop\\storefront", created: "Oct 29, 07:02", net: "4.8 MB in / 12.3 MB out", disk: "210 MB", pids: 22 },
  { id: "blog-web", group: "blog", port: 8081, cpu: 0.1, mem: 188, state: "running", since: now - (6 * HOUR + 40 * MIN), image: "ruby:3.4-slim", path: "C:\\Users\\dev\\code\\blog\\web", created: "Oct 29, 02:41", net: "540 kB in / 2.1 MB out", disk: "74 MB", pids: 6 },
  { id: "blog-db", group: "blog", port: 5432, cpu: 0.4, mem: 1240, state: "running", since: now - (6 * HOUR + 41 * MIN), image: "postgres:17", path: "C:\\Users\\dev\\code\\blog\\db", created: "Oct 29, 02:40", net: "2.4 MB in / 1.9 MB out", disk: "1.1 GB", pids: 11 },
  { id: "blog-cache", group: "blog", port: 6379, cpu: 0, mem: 0, state: "stopped", since: null, image: "redis:7", path: "C:\\Users\\dev\\code\\blog\\cache", created: "Oct 27, 18:20", net: "0 B", disk: "12 MB", pids: 0 },
  { id: "blog-search", group: "blog", port: 7700, cpu: 0, mem: 0, state: "exited", since: null, image: "getmeili/meilisearch:v1", path: "C:\\Users\\dev\\code\\blog\\search", created: "Oct 28, 11:05", net: "0 B", disk: "58 MB", pids: 0 },
];
for (const c of containers) {
  c.cpuH = series(c.cpu, c.cpu * 0.3);
  c.memH = series(c.mem, c.mem * 0.03);
}

const removed = [
  { name: "preview-build", group: "acme-shop", port: "3001", how: "Removed", at: "2 h ago", lifetime: "3 h 12 m", peak: "640 MiB", avg: "1.4%" },
  { name: "migrate-job", group: "acme-shop", port: "—", how: "Removed", at: "Yesterday", lifetime: "1 m", peak: "96 MiB", avg: "0.8%" },
  { name: "blog-staging", group: "blog", port: "8082", how: "Reaped", at: "Oct 27", lifetime: "2 d 6 h", peak: "310 MiB", avg: "0.3%" },
];

const STATE = {
  running: { tone: "success", label: "running", order: 1 },
  restarting: { tone: "pending", label: "restarting", order: 2 },
  unhealthy: { tone: "danger", label: "unhealthy", order: 0 },
  exited: { tone: "danger", label: "exited (1)", order: 3 },
  stopped: { tone: null, label: "stopped", order: 4 },
};
const isUp = (c) => c.state === "running" || c.state === "unhealthy";
const find = (id) => containers.find((c) => c.id === id);

const fmtMem = (mib) => (mib >= 1024 ? `${(mib / 1024).toFixed(1)} GiB` : `${Math.round(mib)} MiB`);
const fmtCpu = (v) => `${v.toFixed(1)}%`;
function fmtUptime(c) {
  if (!isUp(c)) return "—";
  const ms = Date.now() - c.since;
  if (ms >= DAY) return `${Math.floor(ms / DAY)} d ${Math.floor((ms % DAY) / HOUR)} h`;
  if (ms >= HOUR) return `${Math.floor(ms / HOUR)} h ${Math.floor((ms % HOUR) / MIN)} m`;
  return `${Math.max(0, Math.floor(ms / MIN))} m ${Math.floor((ms % MIN) / 1000)} s`;
}

/* ---- Rows: built once per container, then updated in place ---------------- */

const actionButton = (act, label) => `<button class="sd-btn sd-btn-sm" type="button" data-act="${act}">${label}</button>`;

function buildRow(c) {
  const body = html(`
    <tbody data-id="${c.id}">
      <tr>
        <td><button class="sd-btn sd-btn-ghost sd-btn-sm group h-auto text-start" type="button" data-sd-toggle="detail-${c.id}" aria-expanded="false" aria-controls="detail-${c.id}">
          <span class="group-aria-expanded:hidden"><i data-ic="chevron-right"></i></span><span class="hidden group-aria-expanded:inline"><i data-ic="chevron-down"></i></span>
          ${c.id}</button>
          <p class="sd-subtle m-0 ps-8 text-sm md:hidden" data-f="meta"></p></td>
        <td class="sd-num max-md:hidden" data-f="port"></td>
        <td class="sd-num max-md:hidden" data-f="cpu"></td>
        <td class="sd-num max-md:hidden" data-f="mem"></td>
        <td class="max-md:hidden ps-8" data-f="uptime"></td>
        <td><span class="sd-badge" data-f="state"></span></td>
      </tr>
      <tr>
        <td colspan="6" class="border-0 p-0">
          <div class="sd-expand" id="detail-${c.id}"><div>
            <div class="grid gap-6 px-3 py-4 md:grid-cols-2">
              <dl class="sd-kv sd-kv-plain content-start">
                <dt class="md:hidden">CPU</dt><dd class="md:hidden" data-f="cpu"></dd>
                <dt class="md:hidden">Uptime</dt><dd class="md:hidden" data-f="uptime"></dd>
                <dt>Network</dt><dd>${c.net}</dd>
                <dt>Disk</dt><dd>${c.disk}</dd>
                <dt>Processes</dt><dd data-f="pids"></dd>
                <dt>Created</dt><dd>${c.created}</dd>
                <dt>Image</dt><dd>${c.image}</dd>
                <dt>Path</dt><dd>${c.path.replaceAll("\\", "\\<wbr>")}</dd>
                <dt data-orphan-key hidden>Folder</dt><dd data-orphan-note hidden>Deleted. Reap to free its memory.</dd>
              </dl>
              <div class="grid content-start gap-4 sm:grid-cols-2">
                <div class="grid gap-1"><span class="sd-label">CPU</span><span class="sd-spark [--w:100%]" data-spark="cpuH"></span></div>
                <div class="grid gap-1"><span class="sd-label">Memory</span><span class="sd-spark [--w:100%]" data-spark="memH"></span></div>
              </div>
            </div>
            <div class="sd-actions px-3 pb-6" role="group" aria-label="${c.id} actions">
              ${actionButton("toggle", "Stop")}
              ${actionButton("restart", "Restart")}
              ${actionButton("logs", "Follow logs")}
              ${actionButton("folder", "Open folder")}
              ${actionButton("inspect", "Inspect")}
              ${actionButton("shell", "Terminal")}
              ${actionButton("files", "Files")}
              <button class="sd-btn sd-btn-sm sd-icon-text" type="button" data-tone="danger" data-act="remove"><i data-ic="delete"></i> Remove</button>
            </div>
          </div></div>
        </td>
      </tr>
    </tbody>`);
  swap(body);
  return body;
}

const rows = new Map();

function updateRow(c) {
  const el = rows.get(c.id);
  if (!el) return;
  const st = STATE[c.state];
  const text = {
    port: c.port ? `:${c.port}` : "—",
    cpu: isUp(c) ? fmtCpu(c.cpu) : "—",
    mem: isUp(c) ? fmtMem(c.mem) : "—",
    uptime: fmtUptime(c),
    pids: String(c.pids),
    meta: [c.port ? `:${c.port}` : null, isUp(c) ? fmtMem(c.mem) : null].filter(Boolean).join(" · ") || "Not running",
  };
  for (const [key, value] of Object.entries(text)) for (const node of el.querySelectorAll(`[data-f="${key}"]`)) node.textContent = value;
  const badge = el.querySelector('.sd-badge[data-f="state"]');
  badge.textContent = st.label;
  if (st.tone) badge.dataset.tone = st.tone;
  else delete badge.dataset.tone;
  const toggle = el.querySelector('[data-act="toggle"]');
  const restart = el.querySelector('[data-act="restart"]');
  toggle.textContent = isUp(c) || c.state === "restarting" ? "Stop" : "Start";
  toggle.disabled = restart.disabled = c.state === "restarting";
  el.querySelector('[role="group"]').toggleAttribute("aria-busy", c.state === "restarting");
  for (const node of el.querySelectorAll("[data-orphan-key], [data-orphan-note]")) node.hidden = !c.orphan;
  for (const spark of el.querySelectorAll("[data-spark]")) {
    spark.dataset.values = c[spark.dataset.spark].join(" ");
    drawSpark(spark);
  }
}

/* ---- Groups, sorting -------------------------------------------------------- */

const COLUMNS = [
  ["name", "Name", ""],
  ["port", "Port", "max-md:hidden sd-num w-24"],
  ["cpu", "CPU", "max-md:hidden sd-num w-24"],
  ["memory", "Memory", "max-md:hidden sd-num w-32"],
  ["uptime", "Uptime", "max-md:hidden ps-8 w-40"],
  ["state", "State", "w-40"],
];
const sorters = {
  name: (a, b) => a.id.localeCompare(b.id),
  port: (a, b) => (a.port ?? Infinity) - (b.port ?? Infinity),
  cpu: (a, b) => (isUp(a) ? a.cpu : -1) - (isUp(b) ? b.cpu : -1),
  memory: (a, b) => (isUp(a) ? a.mem : -1) - (isUp(b) ? b.mem : -1),
  uptime: (a, b) => (isUp(a) ? a.since : Infinity) - (isUp(b) ? b.since : Infinity),
  state: (a, b) => STATE[a.state].order - STATE[b.state].order,
};
let sort = null;

const groupsEl = $("[data-groups]");
const groupTables = new Map();

function buildGroup(name) {
  const section = html(`
    <section class="grid gap-3" aria-labelledby="group-${name}">
      <h2 class="sd-label" id="group-${name}">${name} <span class="sd-count" data-group-count></span></h2>
      <div class="sd-table-wrap">
        <table class="sd-table w-full md:table-fixed">
          <thead><tr>${COLUMNS.map(([key, label, cls]) => `<th class="${cls}" data-sort="${key}" tabindex="0">${label}</th>`).join("")}</tr></thead>
        </table>
      </div>
    </section>`);
  groupsEl.append(section);
  groupTables.set(name, section);
  return section;
}

function renderGroups() {
  const names = [...new Set(containers.map((c) => c.group))];
  for (const [name, section] of groupTables) if (!names.includes(name)) (section.remove(), groupTables.delete(name));
  for (const name of names) {
    const section = groupTables.get(name) ?? buildGroup(name);
    const table = section.querySelector("table");
    const list = containers.filter((c) => c.group === name);
    if (sort) list.sort((a, b) => sorters[sort.key](a, b) * sort.dir || a.id.localeCompare(b.id));
    for (const c of list) {
      if (!rows.has(c.id)) rows.set(c.id, buildRow(c));
      table.append(rows.get(c.id));
    }
    section.querySelector("[data-group-count]").textContent = String(list.length);
    for (const th of table.querySelectorAll("th[data-sort]")) {
      if (sort?.key === th.dataset.sort) th.setAttribute("aria-sort", sort.dir > 0 ? "ascending" : "descending");
      else th.removeAttribute("aria-sort");
    }
  }
  for (const c of containers) updateRow(c);
  syncExpandAll();
}

groupsEl.addEventListener("click", (event) => {
  const th = event.target.closest("th[data-sort]");
  if (th) setSort(th.dataset.sort);
});
groupsEl.addEventListener("keydown", (event) => {
  const th = event.target.closest("th[data-sort]");
  if (th && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    setSort(th.dataset.sort);
  }
});
function setSort(key) {
  sort = { key, dir: sort?.key === key ? -sort.dir : 1 };
  renderGroups();
}

/* ---- Totals ------------------------------------------------------------------ */

function renderTotals() {
  const up = containers.filter(isUp);
  const mem = up.reduce((sum, c) => sum + c.mem, 0);
  const cpu = up.reduce((sum, c) => sum + c.cpu, 0);
  const orphans = containers.filter((c) => c.orphan).length;
  $("[data-running]").textContent = String(up.length);
  $("[data-total]").textContent = `/ ${containers.length}`;
  $("[data-memory]").textContent = fmtMem(mem);
  $("[data-memory-of]").textContent = `${((mem / WSL_MEMORY) * 100).toFixed(1)}% of WSL's 45.9 GiB`;
  $("[data-cpu]").textContent = fmtCpu(cpu);
  $("[data-orphans]").textContent = String(orphans);
  const tile = $("[data-orphans-tile]");
  if (orphans) tile.dataset.tone = "danger";
  else delete tile.dataset.tone;
  $("[data-reap]").disabled = !orphans;
  $("[data-win-cpu]").textContent = fmtCpu(winCpu);
  $("[data-win-mem]").textContent = fmtMem(winMem * 1024);
}

let winCpu = 14.2;
let winMem = 27.4;

/* ---- Removed ------------------------------------------------------------------- */

function renderRemoved() {
  $("[data-removed]").replaceChildren(
    ...removed.map((r) =>
      html(`<table><tbody><tr>
        <td>${r.name}</td><td class="max-lg:hidden">${r.group}</td><td class="max-lg:hidden">${r.port}</td>
        <td><span class="sd-badge">${r.how}</span></td><td>${r.at}</td>
        <td class="max-lg:hidden">${r.lifetime}</td><td class="sd-num max-md:hidden">${r.peak}</td><td class="sd-num max-md:hidden">${r.avg}</td>
      </tr></tbody></table>`).querySelector("tr"),
    ),
  );
  $("[data-removed-count]").textContent = String(removed.length);
}

function drop(ids, how) {
  for (const id of ids) {
    const c = find(id);
    containers.splice(containers.indexOf(c), 1);
    rows.get(id)?.remove();
    rows.delete(id);
    removed.unshift({
      name: c.id,
      group: c.group,
      port: c.port ? String(c.port) : "—",
      how,
      at: "Just now",
      lifetime: c.since ? fmtUptime(c) : "—",
      peak: fmtMem(Math.max(...c.memH)),
      avg: fmtCpu(c.cpuH.reduce((a, b) => a + b, 0) / c.cpuH.length),
    });
  }
  renderGroups();
  renderTotals();
  renderRemoved();
}

/* ---- Actions ------------------------------------------------------------------- */

const confirmDialog = $("#confirm-remove");
let pendingRemove = [];

function askRemove(ids, how) {
  pendingRemove = ids;
  confirmDialog.returnValue = "";
  $("[data-confirm-title]").textContent = how === "Reaped" ? `Reap ${ids.length} orphaned ${ids.length === 1 ? "container" : "containers"}?` : `Remove ${ids[0]}?`;
  $("[data-confirm-body]").textContent = how === "Reaped" ? "Removes every container whose folder was deleted, with its data." : "Removes the container and its data. It moves to Removed containers.";
  $("[data-confirm-ok]").textContent = how === "Reaped" ? "Reap" : "Remove";
  confirmDialog.dataset.how = how;
  openDialog(confirmDialog);
}

confirmDialog.addEventListener("close", () => {
  if (confirmDialog.returnValue !== "remove") return;
  const how = confirmDialog.dataset.how;
  const ids = pendingRemove.filter(find);
  drop(ids, how);
  toast(how === "Reaped" ? `Reaped ${ids.length} ${ids.length === 1 ? "container" : "containers"}` : `Removed ${ids[0]}`, { tone: "success" });
});

const MESSAGES = {
  logs: (id) => `Following logs for ${id}`,
  folder: (id) => `Opened the folder of ${id}`,
  inspect: (id) => `Inspecting ${id}`,
  shell: (id) => `Terminal opened in ${id}`,
  files: (id) => `Browsing files of ${id}`,
};

function restart(c) {
  c.state = "restarting";
  updateRow(c);
  renderTotals();
  toast(`Restarting ${c.id}`);
  setTimeout(() => {
    if (!find(c.id)) return;
    c.state = "running";
    c.since = Date.now();
    c.cpu = 0.2;
    c.mem = Math.max(c.mem, 160);
    c.pids = Math.max(c.pids, 4);
    updateRow(c);
    renderTotals();
    toast(`${c.id} is running`, { tone: "success" });
  }, 2400);
}

groupsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-act]");
  if (!button) return;
  const id = button.closest("tbody").dataset.id;
  const c = find(id);
  const act = button.dataset.act;
  if (act === "remove") return askRemove([id], "Removed");
  if (act === "restart") return restart(c);
  if (act === "toggle") {
    if (isUp(c)) {
      c.state = "stopped";
      c.cpu = c.mem = c.pids = 0;
      toast(`Stopped ${id}`);
    } else {
      c.state = "running";
      c.since = Date.now();
      c.cpu = 0.2;
      c.mem = 160;
      c.pids = 4;
      toast(`Started ${id}`, { tone: "success" });
    }
    updateRow(c);
    renderTotals();
    return;
  }
  toast(MESSAGES[act](id));
});

$("[data-reap]").addEventListener("click", () => {
  const ids = containers.filter((c) => c.orphan).map((c) => c.id);
  if (ids.length) askRemove(ids, "Reaped");
});

/* ---- Expand all ------------------------------------------------------------------ */

const expandAll = $("[data-expand-all]");
const detailIds = () => containers.map((c) => `detail-${c.id}`);
const allOpen = () => containers.length > 0 && detailIds().every((id) => "open" in document.getElementById(id).dataset);

function syncExpandAll() {
  expandAll.textContent = allOpen() ? "Collapse all" : "Expand all";
}
expandAll.addEventListener("click", () => {
  const open = !allOpen();
  for (const id of detailIds()) setExpanded(id, open);
  syncExpandAll();
});
groupsEl.addEventListener("click", (event) => {
  if (event.target.closest("[data-sd-toggle]")) queueMicrotask(syncExpandAll);
});

/* ---- Live numbers: a state change every two seconds, not ambient motion --------------- */

const jitter = (spread) => (Math.random() - 0.5) * 2 * spread;
const bounded = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function tick() {
  for (const c of containers.filter(isUp)) {
    c.cpu = bounded(c.cpu + jitter(0.08), 0.1, 1.2);
    c.mem = bounded(c.mem + jitter(c.mem * 0.012), 64, 2048);
    c.cpuH = [...c.cpuH.slice(1), c.cpu];
    c.memH = [...c.memH.slice(1), c.mem];
  }
  winCpu = bounded(winCpu + jitter(0.6), 8, 24);
  winMem = bounded(winMem + jitter(0.1), 24, 32);
  for (const c of containers) updateRow(c);
  renderTotals();
}
setInterval(() => !document.hidden && tick(), 2000);

// The monitor notices a deleted folder: Orphaned becomes the one tile with a color.
setTimeout(() => {
  const c = find("blog-search");
  if (!c) return;
  c.orphan = true;
  updateRow(c);
  renderTotals();
  toast("blog-search lost its folder", { tone: "danger" });
}, 16_000);

renderGroups();
renderTotals();
renderRemoved();
