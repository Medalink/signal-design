// Stream setup: builds OBS Browser Source URLs for stream.html. The form is
// the state; every input change rebuilds the URLs below. One URL per layer,
// so each piece can be its own transparent Browser Source.
import { mountBar, savedScrollbars } from "./viewport.js";
import { init } from "../src/js/index.js";

mountBar();
init({ scrollbars: savedScrollbars() });

const $ = (sel) => document.querySelector(sel);

const SCENES = { start: "Starting soon", game: "In game", brb: "Be right back", end: "Ending" };
const LAYERS = ["bg", "title", "latest", "socials", "cam", "goal", "alerts", "credits", "stats"];
const FIELDS = ["kicker", "title", "line", "away", "timer", "follow", "sub", "goal", "goallabel", "name"];
const base = new URL("stream.html", location.href);

// The form's state. Socials are [label, value] pairs; layers all on by default.
const state = {
  scene: "brb",
  fields: Object.fromEntries(FIELDS.map((f) => [f, ""])),
  socials: [
    ["X", "@medalink"],
    ["YT", "/medalink"],
    ["DC", "discord.gg/medalink"],
  ],
  layers: new Set(LAYERS),
};

const layerParam = (layers) => (layers.size === LAYERS.length ? null : [...LAYERS].filter((l) => layers.has(l)).join(","));

function buildUrl(layers) {
  const url = new URL(base);
  url.searchParams.set("scene", state.scene);
  for (const [key, value] of Object.entries(state.fields)) if (value) url.searchParams.set(key, value);
  url.searchParams.set("socials", state.socials.map(([label, value]) => `${label}:${value}`).join("|"));
  const layer = layerParam(layers ?? state.layers);
  if (layer) url.searchParams.set("layer", layer);
  return url.toString();
}

/* ---- Build: inputs, socials rows, layer checks --------------------------- */

for (const field of FIELDS) {
  $("#f-" + field).addEventListener("input", (e) => {
    state.fields[field] = e.target.value;
    build();
  });
}

$("#scene-seg").addEventListener("click", (event) => {
  const button = event.target.closest("[data-scene]");
  if (!button) return;
  state.scene = button.dataset.scene;
  render();
  build();
});

$("#socials-add").addEventListener("click", () => {
  state.socials.push(["", ""]);
  renderSocials();
  build();
});

$("#socials-rows").addEventListener("input", (event) => {
  const row = event.target.closest("[data-row]");
  if (!row) return;
  state.socials[Number(row.dataset.row)] = [row.querySelector("[data-label]").value, row.querySelector("[data-value]").value];
  build();
});

$("#socials-rows").addEventListener("click", (event) => {
  if (!event.target.closest("[data-remove]")) return;
  state.socials.splice(Number(event.target.closest("[data-row]").dataset.row), 1);
  renderSocials();
  build();
});

$("#layer-checks").addEventListener("change", (event) => {
  const box = event.target.closest("[data-layer-check]");
  if (!box) return;
  state.layers[box.checked ? "add" : "delete"](box.dataset.layerCheck);
  build();
});

/* ---- Read: load from a pasted URL ---- */

$("#load-btn").addEventListener("click", () => {
  let url;
  try {
    url = new URL($("#load-url").value.trim());
  } catch {
    $("#load-url").focus();
    $("#load-url").select();
    return;
  }
  const q = url.searchParams;
  const scene = q.get("scene");
  if (SCENES[scene]) state.scene = scene;
  for (const field of FIELDS) state.fields[field] = q.get(field) ?? "";
  const socials = (q.get("socials") ?? "").split("|").filter(Boolean).map((pair) => {
    const at = pair.indexOf(":");
    return at < 0 ? ["", pair] : [pair.slice(0, at), pair.slice(at + 1)];
  });
  if (q.has("socials")) state.socials = socials;
  state.layers = new Set(q.get("layer") ? q.get("layer").split(",").map((l) => l.trim()).filter((l) => LAYERS.includes(l)) : LAYERS);
  render();
  build();
});

/* ---- Render ---- */

function renderScene() {
  for (const button of $("#scene-seg").querySelectorAll("[data-scene]")) button.setAttribute("aria-pressed", String(button.dataset.scene === state.scene));
}

function renderSocials() {
  const rows = $("#socials-rows");
  rows.replaceChildren(
    ...state.socials.map(([label, value], i) => {
      const row = document.createElement("div");
      row.className = "ss-row";
      row.dataset.row = i;
      const at = document.createElement("input");
      at.type = "text";
      at.dataset.label = "";
      at.value = label;
      at.setAttribute("aria-label", `Social ${i + 1} label`);
      at.placeholder = "X";
      at.autocomplete = "off";
      const val = document.createElement("input");
      val.type = "text";
      val.dataset.value = "";
      val.value = value;
      val.setAttribute("aria-label", `Social ${i + 1} value`);
      val.placeholder = "@medalink";
      val.autocomplete = "off";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "sd-btn sd-btn-sm";
      remove.dataset.remove = "";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove social ${i + 1}`);
      row.append(at, val, remove);
      return row;
    }),
  );
}

function renderLayers() {
  $("#layer-checks").replaceChildren(
    ...LAYERS.map((layer) => {
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.dataset.layerCheck = layer;
      box.checked = state.layers.has(layer);
      label.append(box, document.createTextNode(layer));
      return label;
    }),
  );
}

function render() {
  renderScene();
  renderSocials();
  renderLayers();
}

/* ---- URLs out, one full and one per layer ---- */

const copyButton = (target) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sd-btn sd-btn-sm";
  button.dataset.copy = target;
  button.textContent = "Copy";
  return button;
};

const urlRow = (id, labelText, hint) => {
  const wrap = document.createElement("div");
  wrap.className = "sd-field";
  const label = document.createElement("label");
  label.className = "sd-field-label";
  label.htmlFor = id;
  label.textContent = labelText;
  const row = document.createElement("div");
  row.className = "ss-url";
  const input = document.createElement("input");
  input.type = "text";
  input.readOnly = true;
  input.id = id;
  input.setAttribute("aria-label", labelText);
  const button = copyButton(id);
  row.append(input, button);
  wrap.append(label, row);
  if (hint) {
    const p = document.createElement("p");
    p.className = "sd-field-hint";
    p.textContent = hint;
    wrap.append(p);
  }
  return wrap;
};

function renderOutputs() {
  const list = $("#out-layers");
  list.replaceChildren(
    ...LAYERS.map((layer) => urlRow(`out-layer-${layer}`, `Layer: ${layer}`, layer === "alerts" ? "Alerts only: no burst canvas behind the card." : layer === "socials" ? "The socials with their bar, over nothing." : undefined)),
  );
}

renderOutputs();

function build() {
  $("#out-full").value = buildUrl();
  for (const layer of LAYERS) $(`#out-layer-${layer}`).value = buildUrl(new Set([layer]));
}

build();
render();

/* ---- Copy: clipboard first, select the input when OBS refuses it ---- */

document.body.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const input = document.getElementById(button.dataset.copy);
  const was = button.textContent;
  try {
    await navigator.clipboard.writeText(input.value);
    button.textContent = "Copied";
  } catch {
    input.focus();
    input.select();
    button.textContent = "Selected";
  }
  setTimeout(() => (button.textContent = was), 1200);
});
