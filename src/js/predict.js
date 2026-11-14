/**
 * Pointer prediction. Reads where the mouse is heading and tells a target
 * before the pointer lands on it, so its work (a route, a chunk, an image)
 * can start early. Targets are `[data-sd-predict]` and `[data-sd-prefetch]`.
 * The predicted one gets `data-sd-predicted` and an `sd:predict` event that
 * bubbles, with `via` ("path", "hover", "touch" or "focus") and, on a path
 * prediction, `eta`: the milliseconds until the pointer arrives.
 * It fires once per approach: again only after the prediction has left.
 * `[data-sd-prefetch]` also adds `<link rel="prefetch">` for its URL
 * (the attribute's value, else the element's href), same origin only, and a
 * low-priority fetch() where the engine ignores rel="prefetch".
 */
const SELECTOR = "[data-sd-predict], [data-sd-prefetch]";
const WINDOW_MS = 80;
const MIN_DT = 4;
const MIN_SPEED = 0.3;
const MAX_REACH = 480;
const STEP = 24;
const THROTTLE_MS = 30;
const DWELL_MS = 60;
const REST_PX = 6;

let samples = [];
let lastPath = 0;
let targetsSeenAt = -Infinity;
let hasTargets = false;
let current = null;
let dwell = 0;
let candidate = null;
const fetched = new Set();

function anyTargets(now) {
  if (now - targetsSeenAt > 500) {
    hasTargets = document.querySelector(SELECTOR) !== null;
    targetsSeenAt = now;
  }
  return hasTargets;
}

function targetAt(node) {
  return node instanceof Element ? node.closest(SELECTOR) : null;
}

function settle(el, detail) {
  if (el === current) return;
  current?.removeAttribute("data-sd-predicted");
  current = el;
  if (!el) return;
  el.setAttribute("data-sd-predicted", "");
  const url = el.getAttribute("data-sd-prefetch") || el.getAttribute("href");
  if (el.hasAttribute("data-sd-prefetch") && url) prefetch(url);
  el.dispatchEvent(new CustomEvent("sd:predict", { bubbles: true, detail }));
}

// Where a slowing pointer comes to rest, nearest target first, walking back toward the pointer.
function landing(x, y, ux, uy, stop) {
  for (let d = stop; d > -STEP; d -= STEP) {
    const px = x + ux * Math.max(d, 0);
    const py = y + uy * Math.max(d, 0);
    if (px < 0 || py < 0 || px >= innerWidth || py >= innerHeight) continue;
    const el = targetAt(document.elementFromPoint(px, py));
    if (el) return { el, d: Math.max(d, 0) };
  }
  return null;
}

const velocity = (a, b) => ({ x: (b.x - a.x) / (b.t - a.t), y: (b.y - a.y) / (b.t - a.t) });

// A pointer that is still speeding up or cruising could be going anywhere, so
// only a slowing one predicts: the deceleration says where it will stop.
function onMove(event) {
  if (event.pointerType === "touch" || event.buttons !== 0) return;
  const t = event.timeStamp;
  samples.push({ x: event.clientX, y: event.clientY, t });
  while (samples.length > 3 && t - samples[0].t > WINDOW_MS) samples.shift();
  if (t - lastPath < THROTTLE_MS || !anyTargets(t)) return;
  const first = samples[0];
  const last = samples.at(-1);
  const mid = samples.reduce((m, s) => (Math.abs(s.t - (first.t + last.t) / 2) < Math.abs(m.t - (first.t + last.t) / 2) ? s : m));
  if (mid.t - first.t < MIN_DT || last.t - mid.t < MIN_DT) return;
  const before = velocity(first, mid);
  const now = velocity(mid, last);
  const speed = Math.hypot(now.x, now.y);
  if (speed < MIN_SPEED) return;
  lastPath = t;
  const slowing = (Math.hypot(before.x, before.y) - speed) / ((last.t - first.t) / 2);
  if (slowing <= 0) return;
  const stop = Math.min((speed * speed) / (2 * slowing), MAX_REACH);
  const hit = landing(last.x, last.y, now.x / speed, now.y / speed, stop);
  const el = hit?.el ?? null;
  // Time to cover the distance while slowing at this rate.
  const eta = hit && (speed - Math.sqrt(Math.max(0, speed * speed - 2 * slowing * hit.d))) / slowing;
  // The same landing twice in a row, so one noisy sample does not fire a guess.
  if (el && el === candidate) settle(el, { via: "path", eta: Math.round(eta) });
  else if (!el && candidate === null && current && !heading(current, last, now)) settle(null);
  candidate = el;
}

// Whether the pointer is still moving toward el, so a short guess about where it stops does not drop it.
function heading(el, at, v) {
  const r = el.getBoundingClientRect();
  return (r.x + r.width / 2 - at.x) * v.x + (r.y + r.height / 2 - at.y) * v.y > 0;
}

// The pointer has hardly moved over the last DWELL_MS.
function resting() {
  const last = samples.at(-1);
  if (!last || performance.now() - last.t >= DWELL_MS) return true;
  const then = samples.findLast((s) => last.t - s.t >= DWELL_MS) ?? samples[0];
  return Math.hypot(last.x - then.x, last.y - then.y) <= REST_PX;
}

// A pointer passing over a target on its way elsewhere is not a hover: it has to come to rest there.
function settleWhenResting(el) {
  dwell = setTimeout(() => {
    if (!el.matches(":hover")) return;
    if (resting()) settle(el, { via: "hover" });
    else settleWhenResting(el);
  }, DWELL_MS);
}

function onOver(event) {
  if (event.pointerType === "touch") return;
  const el = targetAt(event.target);
  clearTimeout(dwell);
  if (el && el !== current) settleWhenResting(el);
}

function onOut(event) {
  if (current && current.contains(event.target) && !current.contains(event.relatedTarget)) settle(null);
}

function onDown(event) {
  if (event.pointerType !== "touch") return;
  const el = targetAt(event.target);
  if (el) settle(el, { via: "touch" });
}

function onFocus(event) {
  const el = targetAt(event.target);
  if (el) settle(el, { via: "focus" });
}

function onBlur(event) {
  if (current && event.target === current && !current.matches(":hover")) settle(null);
}

/**
 * Prefetch a same-origin URL once, with `<link rel="prefetch">`. Returns
 * false when it skipped: Save-Data is on, the URL is another origin or this
 * page, or it was already fetched.
 */
export function prefetch(href) {
  if (typeof document === "undefined" || navigator.connection?.saveData) return false;
  let url;
  try {
    url = new URL(href, location.href);
  } catch {
    return false;
  }
  url.hash = "";
  const here = new URL(location.href);
  here.hash = "";
  if (url.origin !== location.origin || !/^https?:$/.test(url.protocol) || url.href === here.href) return false;
  if (fetched.has(url.href)) return false;
  fetched.add(url.href);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url.href;
  document.head.append(link);
  // WebKit (Safari, Tauri on macOS and Linux) keeps the link but never fetches it.
  if (!link.relList.supports("prefetch")) fetch(url.href, { priority: "low" }).catch(() => {});
  return true;
}

/**
 * Make `el` a prediction target and call `fn` with the `sd:predict` detail.
 * Returns a function that undoes both. Starts the prediction listeners, so it
 * works on pages that skip init().
 */
export function predict(el, fn) {
  initPredict();
  const marked = !el.hasAttribute("data-sd-predict");
  if (marked) el.setAttribute("data-sd-predict", "");
  targetsSeenAt = -Infinity;
  const listener = (event) => {
    if (event.target === el) fn(event.detail);
  };
  el.addEventListener("sd:predict", listener);
  return () => {
    el.removeEventListener("sd:predict", listener);
    if (marked) el.removeAttribute("data-sd-predict");
    if (current === el) settle(null);
  };
}

let started = false;

export function initPredict() {
  if (started || typeof document === "undefined") return;
  started = true;
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerout", onOut, { passive: true });
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("focusin", onFocus);
  document.addEventListener("focusout", onBlur);
}
