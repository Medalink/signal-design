import { mountBar, savedScrollbars } from "./viewport.js";
import { init, toast } from "../src/js/index.js";

mountBar();
init({ scrollbars: savedScrollbars() });

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ---- What is connected -------------------------------------------------

const noAnswer = (address) => `Could not connect: no answer from ${address}.`;
const providers = [
  { id: "studio", name: "Studio server", model: "small-instruct", address: "http://localhost:11434", reachable: true },
  { id: "office", name: "Office server", model: "medium-instruct", address: "http://192.168.1.40:8080", reachable: false, result: { ok: false, text: noAnswer("http://192.168.1.40:8080") } },
];
const foundServers = [{ id: "local", name: "Local server", address: "http://localhost:1234", models: ["small-instruct", "medium-instruct"] }];
const foundAgents = [{ id: "agent", name: "local-agent", program: "local-agent" }];

const connectedList = $("[data-connected]");
const connectedPanel = $("[data-connected-panel]");
const empty = $("[data-empty]");
const foundPanel = $("[data-found-panel]");
const foundList = $("[data-found]");
const agentList = $("[data-agents]");

function resultHtml(result) {
  if (!result) return "";
  if (result.running) return `<p class="sd-subtle text-sm">Testing…</p>`;
  if (result.ok) return `<p class="sd-muted text-sm">${esc(result.text)}</p>`;
  return `<p class="sd-note" data-tone="danger" role="alert">${esc(result.text)}</p>`;
}

const dotAttrs = (result) => (result?.running || !result ? 'data-shape="hollow"' : `data-tone="${result.ok ? "success" : "danger"}"`);

function connectedRow(p, index) {
  return `<li class="sd-row max-sm:flex-wrap" data-id="${p.id}">
    <span class="sd-dot" ${dotAttrs(p.result)} aria-hidden="true"></span>
    <div class="sd-row-body">
      <p class="sd-row-title">${esc(p.name)}</p>
      <p class="sd-subtle flex flex-wrap items-center gap-x-3 text-sm">${index === 0 ? '<span class="sd-badge">In use</span>' : ""}${p.model ? `<span>${esc(p.model)}</span>` : ""}<span class="break-all font-mono">${esc(p.address)}</span></p>
      <div data-result>${resultHtml(p.result)}</div>
    </div>
    <div class="sd-row-end max-sm:w-full max-sm:pl-5">
      <button type="button" class="sd-btn sd-btn-sm" data-act="test" aria-label="Test ${esc(p.name)}">Test</button>
      <button type="button" class="sd-btn sd-btn-sm sd-btn-ghost" data-act="remove" aria-label="Remove ${esc(p.name)}">Remove</button>
    </div>
  </li>`;
}

const foundServerRow = (s) => `<li class="grid gap-2" data-found-id="${s.id}">
  <div class="min-w-0">
    <p>${esc(s.name)}</p>
    <p class="sd-subtle break-all font-mono text-sm">${esc(s.address)}</p>
  </div>
  <div class="flex gap-3">
    <select class="sd-control-sm min-w-0 flex-1" aria-label="Model for ${esc(s.name)}">${s.models.map((m) => `<option>${esc(m)}</option>`).join("")}</select>
    <button type="button" class="sd-btn sd-btn-sm" data-act="connect-server" aria-label="Connect ${esc(s.name)}">Connect</button>
  </div>
</li>`;

const foundAgentRow = (a) => `<li class="grid gap-2" data-agent-id="${a.id}">
  <p class="break-all font-mono">${esc(a.name)}</p>
  <div class="flex gap-3">
    <input class="sd-control-sm min-w-0 flex-1" aria-label="Model for ${esc(a.name)}" placeholder="Model (optional)" autocomplete="off">
    <button type="button" class="sd-btn sd-btn-sm" data-act="connect-agent" aria-label="Connect ${esc(a.name)}">Connect</button>
  </div>
</li>`;

function render() {
  connectedList.innerHTML = providers.map(connectedRow).join("");
  connectedPanel.hidden = !providers.length;
  empty.hidden = providers.length > 0;
  foundList.innerHTML = foundServers.map(foundServerRow).join("");
  foundPanel.hidden = !foundServers.length;
  agentList.innerHTML = foundAgents.map(foundAgentRow).join("");
  agentList.hidden = !foundAgents.length;
}

const byId = (id) => providers.find((p) => p.id === id);
const rowOf = (id) => connectedList.querySelector(`[data-id="${id}"]`);

/** A connection that was just added: show it and put focus on its Test button. */
function add(provider, message) {
  providers.push({ reachable: true, ...provider });
  render();
  rowOf(provider.id).querySelector('[data-act="test"]').focus();
  toast(message, { tone: "success" });
}

function test(p, row, button) {
  if (button.getAttribute("aria-busy") === "true") return;
  button.setAttribute("aria-busy", "true");
  button.setAttribute("aria-disabled", "true");
  const slot = $("[data-result]", row);
  const dot = $(".sd-dot", row);
  p.result = { running: true };
  slot.innerHTML = resultHtml(p.result);
  dot.removeAttribute("data-tone");
  dot.dataset.shape = "hollow";
  setTimeout(() => {
    p.result = p.reachable ? { ok: true, text: "Replied: “Hello.”" } : { ok: false, text: noAnswer(p.address) };
    slot.innerHTML = resultHtml(p.result);
    delete dot.dataset.shape;
    dot.dataset.tone = p.result.ok ? "success" : "danger";
    button.removeAttribute("aria-busy");
    button.removeAttribute("aria-disabled");
  }, 700);
}

function remove(p) {
  const index = providers.indexOf(p);
  providers.splice(index, 1);
  render();
  (connectedList.children[index] ?? connectedList.children[index - 1])?.querySelector('[data-act="remove"]')?.focus();
  if (!providers.length) $(".sd-empty-title", empty).focus();
  toast(`Removed ${p.name}.`, {
    action: {
      label: "Undo",
      onClick: () => {
        providers.splice(index, 0, p);
        render();
      },
    },
  });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest?.("button[data-act]");
  if (!button) return;
  const row = button.closest("li");
  if (button.dataset.act === "test") return test(byId(row.dataset.id), row, button);
  if (button.dataset.act === "remove") return remove(byId(row.dataset.id));
  if (button.dataset.act === "connect-server") {
    const server = foundServers.find((s) => s.id === row.dataset.foundId);
    foundServers.splice(foundServers.indexOf(server), 1);
    add({ id: server.id, name: server.name, model: $("select", row).value, address: server.address }, `Connected ${server.name}.`);
  }
  if (button.dataset.act === "connect-agent") {
    const agent = foundAgents.find((a) => a.id === row.dataset.agentId);
    foundAgents.splice(foundAgents.indexOf(agent), 1);
    add({ id: agent.id, name: agent.name, model: $("input", row).value.trim(), address: agent.program }, `Connected ${agent.name}.`);
  }
});

render();

// ---- Validation and error recovery --------------------------------------

/** Why an address cannot be used: "" when it can, "empty" or "invalid". */
function addressProblem(value) {
  const text = value.trim();
  if (!text) return "empty";
  try {
    const url = new URL(text);
    return /^https?:$/.test(url.protocol) && url.hostname ? "" : "invalid";
  } catch {
    return "invalid";
  }
}

// What is wrong with each field, in words that say how to fix it.
const messages = {
  "srv-address": (field) => (field.value.trim() ? "Use a full address, like http://localhost:11434." : "Enter a server address."),
  "srv-model": () => "Choose a model.",
  "cmd-program": () => "Enter a program name or path.",
  "cmd-model": () => "A model name has no spaces.",
  "cmd-trust": () => "Confirm you trust this program.",
};

const isField = (el) => el.matches?.("input, select, textarea");
// A field inside a hidden block is not part of the form yet.
const fieldsOf = (form) => [...form.querySelectorAll("input, select, textarea")].filter((f) => !f.closest("[hidden]"));
const errorOf = (field) => field.closest(".sd-field")?.querySelector(".sd-field-error");

// A control points at its hint while valid and at its error while invalid,
// so a screen reader never reads an error that is not showing.
function describe(field) {
  const message = errorOf(field);
  if (!message) return;
  const hint = message.parentElement.querySelector(".sd-field-hint");
  const target = field.hasAttribute("aria-invalid") ? message : hint;
  if (target) field.setAttribute("aria-describedby", target.id);
  else field.removeAttribute("aria-describedby");
}

// The rules live here, not in `required` or `pattern`: the browser would show its own error the moment a field
// is left, before the page can decide whether the user is on the way to a button.
const rules = {
  "srv-address": (field) => addressProblem(field.value) === "",
  "srv-model": (field) => field.value !== "",
  "cmd-program": (field) => field.value.trim() !== "",
  "cmd-model": (field) => !/\s/.test(field.value.trim()),
  "cmd-trust": (field) => field.checked,
};

function validate(field) {
  if (rules[field.id]?.(field) ?? true) field.removeAttribute("aria-invalid");
  else {
    field.setAttribute("aria-invalid", "true");
    const message = errorOf(field);
    if (message && messages[field.id]) message.textContent = messages[field.id](field);
  }
  describe(field);
}

/** The banner follows the fields once it has been shown. */
function summarize(form) {
  const banner = $("[data-form-error]", form);
  const count = form.querySelectorAll('[aria-invalid="true"]').length;
  banner.hidden = !count;
  banner.textContent = count === 1 ? "1 field needs fixing." : `${count} fields need fixing.`;
  return count;
}

/** Validate a form when its fields are left and when it is submitted; `onValid` runs when nothing is wrong. */
function watch(form, onValid) {
  fieldsOf(form).forEach(describe);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    // Show every field's error, not only the ones the user touched.
    fieldsOf(form).forEach(validate);
    if (summarize(form)) {
      // Center the field so its label, its message and the sticky banner all stay in view.
      const firstBad = form.querySelector('[aria-invalid="true"]');
      (firstBad.closest(".sd-field") ?? firstBad).scrollIntoView({ block: "center" });
      firstBad.focus({ preventScroll: true });
      return;
    }
    onValid(event);
  });

  // A new error line pushes the buttons down, so a click that began on one would land beside it.
  // Leaving a field for a button waits for the click: submitting checks every field anyway.
  let pressing = false;
  form.addEventListener("pointerdown", (event) => (pressing = !!event.target.closest?.("button")));
  addEventListener("pointerup", () => setTimeout(() => (pressing = false)));
  addEventListener("pointercancel", () => (pressing = false));

  // Check a field when the user leaves it, and again as they fix it.
  form.addEventListener("focusout", (event) => {
    if (pressing) return;
    if (isField(event.target)) validate(event.target);
    if (!$("[data-form-error]", form).hidden) summarize(form);
  });
  form.addEventListener("input", (event) => {
    if (isField(event.target) && event.target.hasAttribute("aria-invalid")) validate(event.target);
    if (!$("[data-form-error]", form).hidden) summarize(form);
  });
}

function clear(form) {
  form.reset();
  fieldsOf(form).forEach((field) => {
    field.removeAttribute("aria-invalid");
    describe(field);
  });
  summarize(form);
}

// ---- Add a command ---------------------------------------------------------

const commandForm = $("#command-form");
watch(commandForm, () => {
  const program = $("#cmd-program").value.trim();
  const name = program.split(/[\\/]/).pop().replace(/\.[^.]+$/, "") || program;
  clear(commandForm);
  add({ id: `cmd-${Date.now()}`, name, model: $("#cmd-model").value.trim(), address: name }, `Added ${name}.`);
});

// ---- Add a server ------------------------------------------------------------

const serverForm = $("#server-form");
const address = $("#srv-address");
const detectButton = $("[data-detect]", serverForm);
const connectButton = $("[data-connect]", serverForm);
const reason = $("[data-reason]", serverForm);
const failure = $("[data-detect-failure]", serverForm);
const modelBlock = $("[data-detected]", serverForm);
const modelSelect = $("#srv-model");
let detected = null;
let busy = false;

/** Detect and Connect stay on screen when they cannot run; the line under the address says why. */
function syncServer() {
  const problem = addressProblem(address.value);
  const detectOff = busy || problem !== "";
  const connectOff = busy || problem !== "" || !detected || !modelSelect.value;
  detectButton.setAttribute("aria-disabled", String(detectOff));
  detectButton.toggleAttribute("aria-busy", busy);
  connectButton.setAttribute("aria-disabled", String(connectOff));
  const text = busy
    ? "Detecting…"
    : problem === "empty"
      ? "Detect is off until you enter an address."
      : problem
        ? "Detect is off until the address is valid."
        : !detected
          ? "Connect is off until a server is detected."
          : !modelSelect.value
            ? "Connect is off until you choose a model."
            : "";
  reason.textContent = text;
  reason.hidden = !text;
}

function forget() {
  detected = null;
  modelBlock.hidden = true;
  failure.hidden = true;
}

address.addEventListener("input", () => {
  forget();
  syncServer();
});
modelSelect.addEventListener("change", syncServer);

watch(serverForm, () => {
  if (busy) return;
  const url = address.value.trim();
  busy = true;
  forget();
  syncServer();
  // Stand-in for the request: a name ending in .invalid never answers.
  setTimeout(() => {
    busy = false;
    if (new URL(url).hostname.endsWith(".invalid")) {
      failure.textContent = noAnswer(url);
      failure.hidden = false;
    } else {
      detected = { address: url, host: new URL(url).host };
      modelSelect.innerHTML = ["small-instruct", "medium-instruct", "large-instruct"].map((m) => `<option>${m}</option>`).join("");
      modelBlock.hidden = false;
    }
    syncServer();
  }, 600);
});

connectButton.addEventListener("click", () => {
  if (connectButton.getAttribute("aria-disabled") === "true") return;
  const { address: url, host } = detected;
  const model = modelSelect.value;
  clear(serverForm);
  forget();
  syncServer();
  add({ id: `srv-${Date.now()}`, name: host, model, address: url }, `Connected ${host}.`);
});

syncServer();
