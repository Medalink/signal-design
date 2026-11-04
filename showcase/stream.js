import { mountBar, savedScrollbars } from "./viewport.js";
import { init, mountStream, ALERT_KINDS } from "../src/js/index.js";

// As an OBS source (?scene=…) the page is the scene alone: no bar, no remembered theme.
const source = document.documentElement.dataset.source;
if (!source) mountBar();
init({ theme: !source, scrollbars: savedScrollbars() });

/* ---- URL fields -----------------------------------------------------------
 * Every word on the source is settable: ?scene=brb&socials=X:@me&layer=socials.
 * One table below is the whole contract; it runs before mountStream, which
 * reads the timers and goals at mount. Text from the URL becomes DOM nodes
 * only — never innerHTML — with \n (or a real newline) as a break and *x* as bold.
 */

// Text from the URL: newlines break, *asterisks* bold.
function rich(value) {
  const frag = document.createDocumentFragment();
  value.split(/\n|\\n/).forEach((line, i) => {
    if (i) frag.append(document.createElement("br"));
    line.split("*").forEach((seg, j) => {
      if (!seg) return;
      if (j % 2) {
        const b = document.createElement("b");
        b.textContent = seg;
        frag.append(b);
      } else frag.append(seg);
    });
  });
  return frag;
}

// Replace an element's text with rich(value), keeping one child of it
// (a live square stays before the text; a timer goes after).
function refill(el, value, { keep = null, after = false } = {}) {
  if (!el) return;
  const child = keep ? el.querySelector(keep) : null;
  el.replaceChildren(...(child && !after ? [child] : []), rich(value), ...(child && after ? [" ", child] : []));
}

const scene = source ? document.querySelector(`[data-scene="${source}"]`) : null;
const params = source ? new URLSearchParams(location.search) : null;

// Every layer a scene can hold; the end scene's bar labels are its "stats".
const LAYERS = ["bg", "title", "latest", "socials", "cam", "goal", "alerts", "credits", "stats"];
const listed = (value) => value.split(",").map((name) => name.trim()).filter(Boolean);
let shown = null; // null: every layer renders
let burst = true; // false once the layer set leaves the alerts out

// The table: one apply per URL field. Applied to the source scene only.
const FIELDS = {
  socials: {
    apply(value) {
      for (const end of scene.querySelectorAll(".sd-scene-bar-end")) {
        if (!value) {
          end.remove();
          continue;
        }
        end.replaceChildren(
          ...value.split("|").map((pair) => {
            const at = pair.indexOf(":");
            const span = document.createElement("span");
            const label = document.createElement("b");
            label.textContent = at < 0 ? "" : pair.slice(0, at);
            span.append(label, at < 0 ? pair : pair.slice(at + 1));
            return span;
          }),
        );
      }
    },
  },
  kicker: { apply: (v) => refill(scene.querySelector(".sd-scene-kicker"), v, { keep: ".sd-live" }) },
  title: { apply: (v) => refill(scene.querySelector(".sd-scene-title"), v) },
  line: { apply: (v) => refill(scene.querySelector(".sd-scene-line"), v) },
  away: { apply: (v) => refill(scene.querySelectorAll(".sd-scene-kicker")[1], v, { keep: "[data-sd-timer]", after: true }) },
  timer: {
    apply(value) {
      const seconds = Math.round(Number(value));
      if (!Number.isFinite(seconds) || seconds < 0) return;
      for (const el of scene.querySelectorAll("[data-sd-timer]")) if (el.dataset.sdTimer !== "up") el.dataset.sdTimer = String(seconds);
    },
  },
  follow: { apply: (v) => { for (const el of scene.querySelectorAll('[data-sd-latest="follow"]')) el.textContent = v; } },
  sub: { apply: (v) => { for (const el of scene.querySelectorAll('[data-sd-latest="sub"]')) el.textContent = v; } },
  goal: {
    apply(value) {
      const [v, max] = value.split("/").map((n) => Number(n.trim()));
      if (!Number.isFinite(v)) return;
      for (const goal of scene.querySelectorAll("[data-sd-goal]")) {
        goal.dataset.value = String(v);
        if (Number.isFinite(max)) goal.dataset.max = String(max);
      }
    },
  },
  goallabel: { apply: (v) => { for (const el of scene.querySelectorAll(".sd-scene-goal-head > span")) el.textContent = v; } },
  name: {
    apply(v) {
      const tag = scene.querySelector(".sd-cam-tag > span");
      if (tag) tag.textContent = v;
    },
  },
  layer: { apply: (v) => { shown = new Set(v ? listed(v) : LAYERS); } },
  hide: {
    apply(v) {
      shown ??= new Set(LAYERS);
      for (const name of listed(v)) shown.delete(name);
    },
  },
};

if (params && scene) {
  for (const [key, field] of Object.entries(FIELDS)) {
    const value = params.get(key);
    if (value === null) continue;
    field.apply(value);
  }
  // Layers the URL leaves out stop rendering; without bg the scene paints over nothing.
  if (shown) {
    for (const el of scene.querySelectorAll("[data-layer]")) if (!shown.has(el.dataset.layer)) el.setAttribute("data-off", "");
    if (!shown.has("bg")) {
      scene.setAttribute("data-clear", "");
      document.documentElement.setAttribute("data-layer-clear", "");
    }
    burst = shown.has("alerts");
  }
}

const SAMPLE = {
  follow: ["lumen_fox", "graywave", "kitebox", "ostrander"],
  sub: ["pixelmoth", "byteharbor", "fernlight"],
  raid: ["tidepool", "northdial", "moss_and_iron"],
  bits: ["quietkey", "sundial", "hexagram"],
};
const DETAIL = { sub: "Tier 1 · 3 months", raid: "Raiding with 42 viewers", bits: "Cheered 500 bits" };
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const sample = (kind) => ({ kind, name: pick(SAMPLE[kind]), detail: DETAIL[kind] ?? ALERT_KINDS[kind].detail });

const streams = {};
for (const el of document.querySelectorAll("[data-scene]")) {
  streams[el.dataset.scene] = mountStream(el, el === scene ? { burst } : {});
}

for (const group of document.querySelectorAll("[data-fire-for]")) {
  const stream = streams[group.dataset.fireFor];
  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fire]");
    if (button) stream.alert(sample(button.dataset.fire));
  });
}

if (source) {
  // The in-game preview shows a raid at rest; a live source starts clear.
  for (const card of document.querySelectorAll(".sd-stream-alert")) card.hidden = true;
  // A bot or a dock can call window.stream.alert({ kind, name, detail }).
  window.stream = streams[source];
  if (new URLSearchParams(location.search).has("demo")) {
    const kinds = Object.keys(SAMPLE).filter((k) => source === "game" || k !== "raid");
    setInterval(() => streams[source]?.alert(sample(pick(kinds))), 8000);
  }
}
