import { mountBar, savedScrollbars } from "./viewport.js";
import { init, mountStream, ALERT_KINDS, setMood, lookAt } from "../src/js/index.js";
import { markNative } from "./stream-native.js";
import { startTwitch } from "./stream-twitch.js";

// As an OBS source (?scene=…) the page is the scene alone: no bar, no remembered theme.
const source = document.documentElement.dataset.source;
if (!source) mountBar();
init({ theme: !source, scrollbars: savedScrollbars() });

// URL params apply before mountStream, which reads the timers and goals at
// mount. Text from the URL becomes DOM nodes only, never innerHTML:
// \n (or a real newline) breaks, *x* bolds.

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

function refill(el, value, { keep = null, after = false } = {}) {
  if (!el) return;
  const child = keep ? el.querySelector(keep) : null;
  el.replaceChildren(...(child && !after ? [child] : []), rich(value), ...(child && after ? [" ", child] : []));
}

const scene = source ? document.querySelector(`[data-scene="${source}"]`) : null;
const params = source ? new URLSearchParams(location.search) : null;

// The end scene's bar labels are its "stats".
const LAYERS = ["bg", "title", "latest", "socials", "cam", "goal", "alerts", "credits", "stats"];
const listed = (value) => value.split(",").map((name) => name.trim()).filter(Boolean);
let shown = null; // null: every layer renders
let burst = true; // false once the layer set leaves the alerts out

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
  // ?native: OBS Text sources draw the strings; the page keeps their room.
  if (params.has("native")) markNative(scene);
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

// Latest names on air are real ones: the last the feed saw (kept across OBS
// restarts), else the URL's, else the label waits hidden.
const LATEST = "sd-latest";
const known = (() => {
  try {
    return JSON.parse(localStorage.getItem(LATEST)) ?? {};
  } catch {
    return {};
  }
})();

// A new follower shows for 10 s, then its label hides again; a sub stays up.
const FLASH = { follow: 10000 };
const flashing = {};

const latestLabels = (kind) => [...scene.querySelectorAll(`[data-sd-latest="${kind}"]`)].map((el) => el.closest(".sd-scene-label")).filter(Boolean);

function showLatest(kind, name, { live = false, keep = true } = {}) {
  for (const el of scene.querySelectorAll(`[data-sd-latest="${kind}"]`)) el.textContent = name;
  const flash = FLASH[kind];
  if (!flash || live) for (const label of latestLabels(kind)) label.hidden = false;
  if (flash && live) {
    clearTimeout(flashing[kind]);
    flashing[kind] = setTimeout(() => latestLabels(kind).forEach((label) => (label.hidden = true)), flash);
  }
  if (!keep) return;
  known[kind] = name;
  try {
    localStorage.setItem(LATEST, JSON.stringify(known));
  } catch {}
}

function showGoal(kind, value) {
  for (const goal of scene.querySelectorAll(`[data-sd-goal="${kind}"]`)) {
    const max = Number(goal.dataset.max) || 1;
    const shown = Math.min(max, Math.max(0, value));
    goal.dataset.value = String(value);
    [...goal.querySelectorAll(".sd-cells > i")].forEach((cell, i) => cell.toggleAttribute("data-on", i < shown));
    const label = goal.querySelector("[data-sd-goal-value]");
    if (label) label.textContent = `${shown} / ${max}`;
  }
}

if (scene) {
  for (const el of scene.querySelectorAll("[data-sd-latest]")) {
    const kind = el.dataset.sdLatest;
    if (known[kind]) el.textContent = known[kind];
    if (FLASH[kind] || (!known[kind] && !params.has(kind))) el.closest(".sd-scene-label").hidden = true;
  }
  // Sample alerts (?demo) show but never become the remembered names.
  scene.addEventListener("sd:alert", (event) => showLatest(event.detail.kind, event.detail.name, { live: true, keep: !params.has("demo") }));
  // ?twitch=<client id> runs the live feed; #rt= carries a new sign-in once.
  const clientId = params.get("twitch");
  if (clientId) {
    startTwitch({
      clientId,
      seed: new URLSearchParams(location.hash.slice(1)).get("rt") ?? undefined,
      onEvent(event) {
        if (event.type === "alert") streams[source].alert(event.alert);
        else if (event.type === "latest") showLatest(event.kind, event.name);
        else if (event.type === "goal") showGoal(event.kind, event.value);
        else if (event.type === "status") {
          document.documentElement.dataset.twitch = event.ok ? "live" : "error";
          feedState(event.ok);
        }
        if (event.type === "status" && !event.ok) console.warn("twitch:", event.note);
      },
    });
  }
}

// IRIS on the camera frame: a mood for each alert, a look around between
// them, asleep after a long quiet spell, offline while the Twitch feed is down.
const REACT = { follow: "happy", sub: "happy", bits: "curious", raid: "alert" };
const QUIET = 20 * 60000;
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const irises = [];

for (const el of document.querySelectorAll(".st-cam-mascot")) {
  const iris = { el, rest: "calm", back: 0, quiet: 0 };
  const show = (mood, tone) => {
    setMood(el, mood);
    el.setAttribute("aria-label", `IRIS, ${mood}`);
    if (tone) el.dataset.tone = tone;
    else delete el.dataset.tone;
  };
  iris.settle = () => {
    el.removeAttribute("aria-busy");
    show(iris.rest);
    clearTimeout(iris.quiet);
    iris.quiet = setTimeout(() => iris.rest === "calm" && show("sleepy"), QUIET);
  };
  iris.feed = (ok) => {
    const rest = ok ? "calm" : "offline";
    if (rest === iris.rest) return;
    iris.rest = rest;
    if (!el.hasAttribute("aria-busy")) iris.settle();
  };
  el.closest("[data-scene]").addEventListener("sd:alert", (event) => {
    clearTimeout(iris.back);
    show(REACT[event.detail.kind] ?? "happy", event.detail.tone);
    el.setAttribute("aria-busy", "true");
    lookAt(el, 1, -1);
    iris.back = setTimeout(iris.settle, 6000);
  });
  if (!still) walk(el);
  iris.settle();
  irises.push(iris);
}

// Back and forth along the frame in pixel steps with a bob, eyes on the way
// ahead. It stops to look around at an edge now and then, and stands still
// while it reacts or sleeps.
function walk(el) {
  const frame = el.closest(".sd-cam");
  let x = 0;
  let dir = 1;
  let bob = false;
  let rest = 0;
  setInterval(() => {
    const u = frame.getBoundingClientRect().width / 480;
    const max = Math.max(0, frame.getBoundingClientRect().width - el.getBoundingClientRect().width - 32 * u);
    const standing = el.hasAttribute("aria-busy") || el.dataset.mood === "sleepy" || el.dataset.mood === "offline";
    if (standing || rest > 0) {
      rest = Math.max(0, rest - 1);
      bob = false;
      if (rest && !standing && rest % 12 === 0) lookAt(el, Math.floor(Math.random() * 3) - 1, -Math.round(Math.random()));
    } else {
      x += dir * 4 * u;
      bob = !bob;
      lookAt(el, dir, 0);
      if (x <= 0 || x >= max) {
        x = Math.min(max, Math.max(0, x));
        dir = -dir;
        if (Math.random() < 0.4) rest = 20 + Math.floor(Math.random() * 30);
      }
    }
    el.style.translate = `${Math.round(x)}px ${bob ? Math.round(-3 * u) : 0}px`;
  }, 110);
}

function feedState(ok) {
  for (const iris of irises) iris.feed(ok);
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
