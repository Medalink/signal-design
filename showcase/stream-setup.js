import { mountBar, savedScrollbars } from "./viewport.js";
import { init } from "../src/js/index.js";

mountBar();
init({ scrollbars: savedScrollbars() });

const $ = (sel) => document.querySelector(sel);

const SCENES = { start: "Starting soon", game: "In game", brb: "Be right back", end: "Ending" };
const LAYERS = ["bg", "title", "latest", "socials", "cam", "goal", "alerts", "credits", "stats"];
const FIELDS = ["kicker", "title", "line", "away", "timer", "follow", "sub", "goal", "goallabel", "name"];
const base = new URL("stream.html", location.href);

// What each scene in stream.html has today: its layers, and the default text
// of every URL field it reads. A field absent from a scene never reaches that
// scene's URL, and \\n in a placeholder is the break the URL syntax uses.
const SCENE_TABLE = {
  start: {
    layers: ["bg", "title", "latest", "socials", "alerts"],
    fields: {
      kicker: "Stream starting",
      title: "Starting\\nsoon",
      timer: "300",
      line: "Tonight: *ranked to Diamond*, then viewer games",
      follow: "nightowl_42",
      sub: "pixelmoth",
      socials: "X:@medalink|YT:/medalink|DC:discord.gg/medalink",
    },
  },
  game: {
    layers: ["bg", "latest", "cam", "goal", "alerts"],
    fields: { follow: "nightowl_42", sub: "pixelmoth", goal: "38/50", goallabel: "Sub goal", name: "Medalink" },
  },
  brb: {
    layers: ["bg", "title", "latest", "socials", "alerts"],
    fields: {
      kicker: "Grabbing a drink",
      title: "Be right back",
      away: "Away",
      follow: "nightowl_42",
      sub: "pixelmoth",
      socials: "X:@medalink|YT:/medalink|DC:discord.gg/medalink",
    },
  },
  end: {
    layers: ["bg", "title", "credits", "stats"],
    fields: { kicker: "Stream ending", title: "Thanks for\\nhanging out", line: "Raiding *tidepool* next. Stick around." },
  },
};

const sceneLayers = () => SCENE_TABLE[state.scene].layers;
const sceneFields = () => Object.keys(SCENE_TABLE[state.scene].fields);

// The form's state. Socials are [label, value] pairs.
const state = {
  scene: "brb",
  fields: Object.fromEntries(FIELDS.map((f) => [f, ""])),
  socials: [
    ["X", "@medalink"],
    ["YT", "/medalink"],
    ["DC", "discord.gg/medalink"],
  ],
  layers: new Set(SCENE_TABLE.brb.layers),
};

// The form edits the chosen scene; names, socials, goal and timer carry to every scene.
const OWN_TEXT = ["kicker", "title", "line", "away"];

function urlFor(scene, layers) {
  const url = new URL(base);
  url.searchParams.set("scene", scene);
  const fields = Object.keys(SCENE_TABLE[scene].fields);
  for (const [key, value] of Object.entries(state.fields)) {
    if (value && fields.includes(key) && (scene === state.scene || !OWN_TEXT.includes(key))) url.searchParams.set(key, value);
  }
  if (fields.includes("socials")) url.searchParams.set("socials", state.socials.map(([label, value]) => `${label}:${value}`).join("|"));
  if (layers.size !== SCENE_TABLE[scene].layers.length) url.searchParams.set("layer", LAYERS.filter((l) => layers.has(l)).join(","));
  return url;
}

const buildUrl = (layers) => urlFor(state.scene, layers ?? state.layers).toString();

// The background and graphics with every word left out, for OBS Text sources
// on top. The timer and goal stay: they are graphics.
const WORDS = ["kicker", "title", "line", "away", "follow", "sub", "goallabel", "name", "socials"];

function graphicsUrl() {
  const url = urlFor(state.scene, state.layers);
  for (const key of WORDS) url.searchParams.delete(key);
  url.searchParams.set("native", "");
  return url.toString();
}

const STORAGE_KEY = "sd-stream-setup";

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ scene: state.scene, fields: state.fields, socials: state.socials, layers: [...state.layers] }));
  } catch {}
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (SCENE_TABLE[saved.scene]) state.scene = saved.scene;
    if (saved.fields && typeof saved.fields === "object") {
      for (const field of FIELDS) if (typeof saved.fields[field] === "string") state.fields[field] = saved.fields[field];
    }
    if (Array.isArray(saved.socials)) {
      const socials = saved.socials.filter((pair) => Array.isArray(pair) && pair.length === 2 && pair.every((part) => typeof part === "string"));
      if (socials.length) state.socials = socials;
    }
    if (Array.isArray(saved.layers)) {
      const layers = saved.layers.filter((l) => sceneLayers().includes(l));
      if (layers.length) state.layers = new Set(layers);
    }
  } catch {}
}

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
  state.layers = new Set(sceneLayers());
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
  const listed = q.get("layer");
  state.layers = new Set((listed ? listed.split(",").map((l) => l.trim()) : sceneLayers()).filter((l) => sceneLayers().includes(l)));
  render();
  build();
});

function renderScene() {
  for (const button of $("#scene-seg").querySelectorAll("[data-scene]")) button.setAttribute("aria-pressed", String(button.dataset.scene === state.scene));
}

// A scene shows only its own fields, with its default as the placeholder.
function renderFields() {
  const fields = sceneFields();
  for (const field of FIELDS) {
    const input = $(`#f-${field}`);
    if (!input) continue;
    const has = fields.includes(field);
    input.closest(".sd-field").hidden = !has;
    if (has) input.placeholder = SCENE_TABLE[state.scene].fields[field];
  }
  $("#socials-field").hidden = !fields.includes("socials");
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
    ...sceneLayers().map((layer) => {
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

function renderOutputs() {
  $("#out-layers").replaceChildren(...sceneLayers().map((layer) => urlRow(`out-layer-${layer}`, `Layer: ${layer}`)));
}

function render() {
  renderScene();
  renderFields();
  renderSocials();
  renderLayers();
  renderOutputs();
}

const copyButton = (target) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sd-btn sd-btn-sm";
  button.dataset.copy = target;
  button.textContent = "Copy";
  return button;
};

const urlRow = (id, labelText) => {
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
  row.append(input, copyButton(id));
  wrap.append(label, row);
  return wrap;
};

function build() {
  $("#out-full").value = buildUrl();
  $("#out-graphics").value = graphicsUrl();
  for (const layer of sceneLayers()) $(`#out-layer-${layer}`).value = buildUrl(new Set([layer]));
  save();
}

restore();
render();
build();

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
