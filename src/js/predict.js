/**
 * Pointer prediction. Reads where the mouse is heading and tells a target
 * before the pointer lands on it, so its work (a route, a chunk, an image)
 * can start early. Targets are `[data-sd-predict]` and `[data-sd-prefetch]`.
 * The predicted one gets `data-sd-predicted` and an `sd:predict` event that
 * bubbles, with `via` ("path", "hover", "touch" or "focus") and, on a path
 * prediction, `eta`: the milliseconds until the pointer arrives at its speed.
 * It fires once per approach: again only after the prediction has left.
 * `[data-sd-prefetch]` also adds `<link rel="prefetch">` for its URL
 * (the attribute's value, else the element's href), same origin only.
 */
const SELECTOR = "[data-sd-predict], [data-sd-prefetch]";
const WINDOW_MS = 80;
const MIN_DT = 4;
const MIN_SPEED = 0.3;
const LOOKAHEAD_MS = 160;
const MAX_REACH = 420;
const STEP = 24;
const THROTTLE_MS = 30;

let samples = [];
let lastPath = 0;
let targetsSeenAt = -Infinity;
let hasTargets = false;
let current = null;
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

// Walk the line the pointer is drawing and return the first target on it.
function onPath(x, y, vx, vy, speed) {
  const reach = Math.min(speed * LOOKAHEAD_MS, MAX_REACH);
  const ux = vx / speed;
  const uy = vy / speed;
  for (let d = STEP; d <= reach; d += STEP) {
    const px = x + ux * d;
    const py = y + uy * d;
    if (px < 0 || py < 0 || px >= innerWidth || py >= innerHeight) return null;
    const el = targetAt(document.elementFromPoint(px, py));
    if (el) return { el, eta: Math.round(d / speed) };
  }
  return null;
}

function onMove(event) {
  if (event.pointerType === "touch" || event.buttons !== 0) return;
  const t = event.timeStamp;
  samples.push({ x: event.clientX, y: event.clientY, t });
  while (samples.length > 2 && t - samples[0].t > WINDOW_MS) samples.shift();
  if (t - lastPath < THROTTLE_MS || !anyTargets(t)) return;
  const first = samples[0];
  const dt = t - first.t;
  if (dt < MIN_DT) return;
  const vx = (event.clientX - first.x) / dt;
  const vy = (event.clientY - first.y) / dt;
  const speed = Math.hypot(vx, vy);
  if (speed < MIN_SPEED) return;
  lastPath = t;
  if (targetAt(event.target)) return;
  const hit = onPath(event.clientX, event.clientY, vx, vy, speed);
  if (hit) settle(hit.el, { via: "path", eta: hit.eta });
  else settle(null);
}

function onOver(event) {
  if (event.pointerType === "touch") return;
  const el = targetAt(event.target);
  if (el) settle(el, { via: "hover" });
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
