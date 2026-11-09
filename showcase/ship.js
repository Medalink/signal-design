import { mountBar, savedScrollbars } from "./viewport.js";
import { init, setAside } from "../src/js/index.js";
import { icon } from "../src/js/icons.js";
import { mountMachine } from "../src/js/machine.js";
import { MACHINES } from "./machines.js";

mountBar();
init({ scrollbars: savedScrollbars() });

const $ = (id) => document.getElementById(id);
const paint = (root) => {
  for (const el of root.querySelectorAll("[data-icon]")) {
    if (!el.querySelector(":scope > svg")) el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon));
  }
};
paint(document);

const html = (strings, ...values) =>
  strings.reduce((out, s, i) => out + s + (i < values.length ? String(values[i]).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`) : ""), "");
const clock = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const seconds = (v) => `${Number(v).toFixed(1)} s`;

const figure = $("machine");
const byId = new Map(MACHINES.map((m) => [m.id, m]));
let current = byId.get(location.hash.slice(1)) ?? MACHINES[0];
let events = {};
let pending = [];

/* ---- Sidebar ------------------------------------------------------------- */

$("machine-list").innerHTML = MACHINES.map((m) => html`<a class="sd-sidebar-link" href="#${m.id}" data-icon="${m.icon}">${m.title}</a>`).join("");
paint($("machine-list"));

/* ---- The machine ----------------------------------------------------------- */

const machine = mountMachine(figure, current.spec, { select: true });

function show(next) {
  current = next;
  events = {};
  pending = [];
  $("log").replaceChildren();
  machine.load(next.spec);
  for (const link of $("machine-list").children) {
    if (link.getAttribute("href") === `#${next.id}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  $("machine-title").textContent = next.title;
  document.title = next.title;
  renderStats();
  renderExtras();
  $("spec-text").value = JSON.stringify(next.spec, null, 2);
  $("spec-error").closest(".sd-field").removeAttribute("data-invalid");
  $("spec-text").removeAttribute("aria-invalid");
  machine.select(null);
}

/* ---- Stats ----------------------------------------------------------------- */

function statValue(stat) {
  if (stat.event) return events[stat.event] ?? 0;
  const node = machine.node(stat.node);
  if (!node) return 0;
  if (stat.key === "queue") return node.queue;
  return node.count[stat.key] ?? 0;
}

function renderStats() {
  $("stats").innerHTML = current.stats
    .map((stat, i) => html`<div class="sd-stat-box"><span class="sd-stat-label">${stat.label}</span><span class="sd-stat-value" data-stat="${i}">0</span></div>`)
    .join("");
}

/* ---- Rows of chains under the board ---------------------------------------- */

function renderExtras() {
  const step = ([name, status]) => (status ? html`<span data-status="${status}">${name}</span>` : html`<span>${name}</span>`);
  const row = (r) => html`<div class="ship-extra"><div><b>${r.name}</b><span>${r.sub}</span></div>` + `<div class="sd-machine-chain">${r.chain.map(step).join("")}</div></div>`;
  $("extras").innerHTML = current.extras
    .map((group, g) => html`<section class="grid gap-3" aria-labelledby="extra-${g}"><h2 class="sd-label sd-label-strong" id="extra-${g}">${group.title}</h2>` +
      `<div class="ship-extras">${group.rows.map(row).join("")}</div></section>`)
    .join("");
}

/* ---- Inspector ------------------------------------------------------------- */

function range(id, label, value, min, max, step, format) {
  return `<div class="sd-field">
    <label class="sd-field-label ship-range-label" for="${id}"><span>${label}</span><output for="${id}" class="font-mono">${format(value)}</output></label>
    <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">
  </div>`;
}

function renderInspector() {
  const panel = $("tab-station");
  const id = machine.selected;
  const node = id && machine.node(id);
  if (!node) {
    panel.innerHTML = `<div class="sd-empty"><p class="sd-empty-title">No station picked</p></div>`;
    return;
  }
  const spec = node.spec;
  const hold = [spec.hold ?? 1].flat();
  const [lo, hi] = hold.length > 1 ? hold : [hold[0], hold[0]];
  const parts = [
    html`<div class="ship-station"><span class="sd-badge">${spec.kind ?? "box"}</span><b>${spec.label ?? spec.id}</b></div>`,
    `<dl class="sd-kv sd-kv-plain" id="station-counts"></dl>`,
  ];
  if (spec.kind === "source") {
    const every = [spec.every ?? [3, 6]].flat();
    parts.push(range("f-every-lo", "Writes, fastest", every[0], 0.5, 30, 0.5, seconds));
    parts.push(range("f-every-hi", "Writes, slowest", every[1] ?? every[0], 0.5, 30, 0.5, seconds));
  }
  if (spec.hold != null) {
    parts.push(range("f-hold-lo", "Hold, shortest", lo, 0.1, 20, 0.1, seconds));
    parts.push(range("f-hold-hi", "Hold, longest", hi, 0.1, 20, 0.1, seconds));
  }
  if ((spec.kind ?? "box") === "box") parts.push(range("f-capacity", "Slots", spec.capacity ?? 1, 1, 8, 1, String));
  const out = typeof spec.out === "object" && spec.out ? Object.entries(spec.out) : [];
  if (out.length > 1) {
    parts.push(`<h3 class="sd-label">Outcomes</h3>`);
    for (const [key, o] of out) parts.push(range(`f-out-${key}`, `${key}${o.to ? ` → ${o.to}` : ""}`, o.weight ?? 1, 0, 20, 1, String));
  }
  if (!["source", "line", "sink"].includes(spec.kind)) {
    const latest = spec.queue === "latest";
    parts.push(`<div class="sd-field"><span class="sd-field-label" id="f-queue-l">Waiting line</span>
      <div class="sd-seg sd-seg-inline" role="group" aria-labelledby="f-queue-l" id="f-queue">
        <button type="button" data-queue="fifo" aria-pressed="${!latest}">In order</button>
        <button type="button" data-queue="latest" aria-pressed="${latest}">Newest only</button>
      </div></div>`);
  }
  panel.innerHTML = `<div class="grid gap-4">${parts.join("")}</div>`;
  renderCounts();
}

function renderCounts() {
  const list = $("station-counts");
  const node = machine.selected && machine.node(machine.selected);
  if (!list || !node) return;
  const rows = [["In", node.count.in], ["Done", node.count.done], ["Failed", node.count.failed], ["Working", `${node.busy} of ${node.capacity}`], ["Waiting", node.queue]];
  const text = rows.map(([k, v]) => `${k}${v}`).join("|");
  if (list.dataset.text === text) return;
  list.dataset.text = text;
  list.innerHTML = rows.map(([k, v]) => html`<dt>${k}</dt><dd class="font-mono">${v}</dd>`).join("");
}

$("tab-station").addEventListener("input", (e) => {
  const input = e.target;
  if (input.type !== "range") return;
  const id = machine.selected;
  const spec = machine.node(id)?.spec;
  if (!spec) return;
  const v = Number(input.value);
  const label = input.previousElementSibling.querySelector("output");
  const pair = (lo, hi, which) => {
    const a = which === "lo" ? v : Number($(lo).value);
    const b = which === "hi" ? v : Number($(hi).value);
    return [Math.min(a, b), Math.max(a, b)];
  };
  if (input.id.startsWith("f-hold")) {
    machine.set(id, { hold: pair("f-hold-lo", "f-hold-hi", input.id.slice(7)) });
    label.value = seconds(v);
  } else if (input.id.startsWith("f-every")) {
    machine.set(id, { every: pair("f-every-lo", "f-every-hi", input.id.slice(8)) });
    label.value = seconds(v);
  } else if (input.id === "f-capacity") {
    machine.set(id, { capacity: v });
    label.value = String(v);
  } else if (input.id.startsWith("f-out-")) {
    const key = input.id.slice(6);
    machine.set(id, { out: { ...spec.out, [key]: { ...spec.out[key], weight: v } } });
    label.value = String(v);
  }
  $("spec-text").value = JSON.stringify(machine.spec, null, 2);
});

$("tab-station").addEventListener("click", (e) => {
  const button = e.target.closest("[data-queue]");
  if (!button) return;
  machine.set(machine.selected, { queue: button.dataset.queue });
  for (const b of button.parentElement.children) b.setAttribute("aria-pressed", String(b === button));
  $("spec-text").value = JSON.stringify(machine.spec, null, 2);
});

/* ---- Spec ------------------------------------------------------------------- */

$("spec-apply").addEventListener("click", () => {
  const field = $("spec-error").closest(".sd-field");
  try {
    const spec = JSON.parse($("spec-text").value);
    machine.load(spec);
    current = { ...current, spec };
    field.removeAttribute("data-invalid");
    $("spec-text").removeAttribute("aria-invalid");
    renderStats();
    machine.select(null);
  } catch (error) {
    $("spec-error").textContent = error.message;
    field.dataset.invalid = "";
    $("spec-text").setAttribute("aria-invalid", "true");
  }
});
$("spec-reset").addEventListener("click", () => show(byId.get(current.id) ?? MACHINES[0]));

/* ---- Controls --------------------------------------------------------------- */

function showPlaying() {
  const toggle = $("toggle");
  toggle.dataset.icon = machine.playing ? "pause" : "play";
  toggle.innerHTML = `${icon(toggle.dataset.icon)}<span>${machine.playing ? "Pause" : "Play"}</span>`;
}
$("toggle").addEventListener("click", () => {
  machine.toggle();
  showPlaying();
});
$("speed").addEventListener("click", (e) => {
  const button = e.target.closest("[data-speed]");
  if (!button) return;
  machine.speed = Number(button.dataset.speed);
  for (const b of $("speed").children) b.setAttribute("aria-pressed", String(b === button));
});
document.addEventListener("keydown", (e) => {
  if (e.key !== " " || e.target.closest("input, textarea, button, select, [role='button'], [contenteditable]")) return;
  e.preventDefault();
  machine.toggle();
  showPlaying();
});

/* ---- Events: the log, the counts, the status -------------------------------- */

const WORDS = { emit: "wrote", fold: "folded", land: "landed" };

figure.addEventListener("sd:machine", ({ detail }) => {
  events[detail.type] = (events[detail.type] ?? 0) + 1;
  if (detail.type === "select") {
    if (detail.node) setAside($("shell"), true);
    return renderInspector();
  }
  if (detail.type === "load") return;
  const word = detail.type === "finish" ? detail.outcome : WORDS[detail.type];
  if (!word || word === "pass" || word === "end") return;
  pending.push({ ...detail, word });
});

function flushLog() {
  if (!pending.length) return;
  const rows = pending.slice(-6).reverse().map((e) => {
    const spec = machine.node(e.node)?.spec;
    const status = e.token?.status;
    const tone = status === "failed" ? "danger" : status === "waiting" ? "pending" : status === "done" ? "success" : "";
    const count = e.token?.count > 1 ? ` · ${e.token.count} changes` : "";
    return html`<tr><td class="font-mono">${clock(e.t)}</td><td>${spec?.label ?? e.node}</td><td><span class="sd-status" data-tone="${tone}">${e.word}${count}</span></td><td class="font-mono">${e.token?.label ?? ""}</td></tr>`;
  });
  pending = [];
  $("log").insertAdjacentHTML("afterbegin", rows.join(""));
  while ($("log").children.length > 8) $("log").lastElementChild.remove();
}

function refresh() {
  for (const el of $("stats").querySelectorAll("[data-stat]")) {
    const value = String(statValue(current.stats[el.dataset.stat]));
    if (el.textContent !== value) el.textContent = value;
  }
  const line = current.line && figure.querySelector(`.sd-machine-node[data-id="${current.line}"]`);
  const status = line?.dataset.status;
  const badge = $("line-status");
  const text = current.line ? `${current.line} · ${status === "done" ? "green" : status === "failed" ? "red" : "waiting"}` : `${clock(machine.time)} machine time`;
  if (badge.textContent !== text) badge.textContent = text;
  badge.dataset.tone = status === "done" ? "success" : status === "failed" ? "danger" : "";
  $("status").textContent = `${machine.playing ? "Running" : "Paused"} · ${machine.speed}×`;
  $("status").dataset.tone = machine.playing ? "success" : "";
  $("clock").textContent = clock(machine.time);
  renderCounts();
  flushLog();
}
setInterval(refresh, 300);

addEventListener("hashchange", () => {
  const next = byId.get(location.hash.slice(1));
  if (next && next !== current) show(next);
});

show(current);
showPlaying();
refresh();
