/**
 * Art: pixel pieces drawn from the same square cells as the ornaments, in the
 * theme's text color, and the mascots: IRIS, the watcher, plus an eagle, a
 * squirrel and an elephant for the outdoors.
 *
 *   <span class="sd-art" data-sd-art="server" role="img" aria-label="Server"></span>
 *   <span class="sd-mascot" data-sd-mascot="eagle" data-mood="happy" role="img" aria-label="Eagle, happy"></span>
 *   <button class="sd-mascot" data-sd-mascot="squirrel" aria-label="Squirrel"></button>   presses react (or data-sd-mascot-press)
 *   <span class="sd-iris" data-sd-iris data-mood="calm"></span>                          IRIS shorthand
 *
 * Pieces are grids of characters, one per cell: "#" ink, "+" mid, ":" faint,
 * "o" signal (the tone, or the ink without one), "." empty. Runs of cells in a
 * row merge into one rect, drawn with crisp edges.
 *
 * Every mascot reads data-mood (idle, calm, happy, curious, focused, sleepy,
 * alert, offline); writing data-sd-mascot swaps the character and keeps the
 * mood. With the attribute, init() draws it, turns its eyes one cell toward
 * the pointer, and hops once when a button mascot is pressed. aria-busy="true"
 * is the only loop: the status light blinks and IRIS scans, the eagle beats
 * its wings, the squirrel waves, the elephant flaps its ears. A blink now and
 * then is the one idle motion; it pauses while the page scrolls and stops
 * under reduced motion or with data-sd-mascot-still.
 */
import { TECH, NATURE } from "./art-pieces.js";
import { MASCOTS, MOODS, EYES, MOUTHS, MARKS } from "./art-mascots.js";

export { MASCOTS };
export const MASCOT_MOODS = MOODS;
/** @deprecated name kept for IRIS; same list as MASCOT_MOODS. */
export const IRIS_MOODS = MOODS;

const OPACITY = { "#": 1, "+": 0.55, ":": 0.28, o: 1 };

const piece = (layers) => {
  const rows = Object.values(layers).flat();
  return { w: Math.max(...rows.map((r) => r.length)), h: Object.values(layers)[0].length, layers };
};

/** Every piece by name: { w, h, layers }. defineArt() adds more. */
export const ART = {};
/** Which pieces belong to which set, for pickers and docs. */
export const ART_SETS = { tech: Object.keys(TECH), nature: Object.keys(NATURE) };
for (const [name, rows] of Object.entries({ ...TECH, ...NATURE })) ART[name] = piece({ body: rows });

/**
 * The rects of one grid at an offset: runs of the same cell in a row merge into one. `only` maps
 * listed characters to ink. A rect is { x, y, width, signal, opacity }; `signal` cells take the tone.
 */
function runs(rows, dx = 0, dy = 0, only = null) {
  const out = [];
  rows.forEach((row, y) => {
    const at = (x) => (only ? (only.includes(row[x]) ? "#" : ".") : row[x]);
    for (let x = 0; x < row.length; ) {
      const ch = at(x);
      if (!(ch in OPACITY)) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && at(x + run) === ch) run++;
      out.push({ x: x + dx, y: y + dy, width: run, signal: ch === "o", opacity: OPACITY[ch] });
      x += run;
    }
  });
  return out;
}

function cells(rows, dx = 0, dy = 0, only = null) {
  return runs(rows, dx, dy, only)
    .map(({ x, y, width, signal, opacity }) => {
      const fill = signal ? ' class="sd-art-signal"' : opacity < 1 ? ` fill-opacity="${opacity}"` : "";
      return `<rect x="${x}" y="${y}" width="${width}" height="1"${fill}/>`;
    })
    .join("");
}

/**
 * A piece as data, for frameworks that render their own elements: its size and, per layer, the
 * rects artSVG draws. Null for an unknown name.
 */
export function artRects(name) {
  const p = typeof name === "string" ? ART[name] : name;
  if (!p) return null;
  return { w: p.w, h: p.h, layers: Object.entries(p.layers).map(([layer, rows]) => ({ layer, rects: runs(rows) })) };
}

/** Rects for a list of [x, y] cells. */
const dots = (list) => list.map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1"/>`).join("");

const svg = (w, h, body) =>
  `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${body}</svg>`;

/** The SVG markup for a piece (by name or a piece object). */
export function artSVG(name) {
  const p = typeof name === "string" ? ART[name] : name;
  if (!p) return "";
  return svg(p.w, p.h, Object.entries(p.layers).map(([layer, rows]) => `<g class="sd-art-${layer}">${cells(rows)}</g>`).join(""));
}

/** Add a piece: defineArt("switch", { body: ["###", "#o#", "###"] }), or a bare array of rows. */
export function defineArt(name, layers) {
  ART[name] = piece(Array.isArray(layers) ? { body: layers } : layers);
  return ART[name];
}

/** Add or replace a mascot (see art-mascots.js for the shape). */
export function defineMascot(name, mascot) {
  MASCOTS[name] = mascot;
  return mascot;
}

/** The eyes and mouth of an animal for one mood, as cell lists. */
function animalFace(m, mood) {
  const shape = EYES[mood] ?? EYES.idle;
  const [left, right] = Array.isArray(shape) ? [shape, shape.map(([dx, dy]) => [-dx, dy])] : [shape.left, shape.right];
  // A profile has one eye, facing right: it takes the right eye's shape.
  const pairs = m.eyes.length === 1 ? [[m.eyes[0], right]] : [[m.eyes[0], left], [m.eyes[1], right]];
  const eyes = pairs.flatMap(([[x, y], shape]) => shape.map(([dx, dy]) => [x + dx, y + dy]));
  const mouth = m.mouth ? (MOUTHS[mood] ?? MOUTHS.idle).map(([dx, dy]) => [m.mouth[0] + dx, m.mouth[1] + dy]) : [];
  return { eyes: dots(eyes), mouth: dots(mouth) };
}

/** A mascot as SVG markup for one mood. Frameworks can render this themselves. */
export function mascotSVG(name = "iris", mood = "idle") {
  const m = MASCOTS[name] ?? MASCOTS.iris;
  if (!MOODS.includes(mood)) mood = "idle";
  let face;
  if (m.faces) {
    const grid = m.faces[mood] ?? m.faces.idle;
    face = { eyes: cells(grid, m.face[0], m.face[1], "e"), mouth: cells(grid, m.face[0], m.face[1], "m") };
  } else face = animalFace(m, mood);
  let marks = MARKS[mood];
  if (marks && m.flipMarks) marks = marks.map((r) => [...r].reverse().join(""));
  const body =
    `<g class="sd-mascot-body">` +
    cells(m.body) +
    (m.busy === "scan" ? `<g class="sd-mascot-scan"><rect x="2" y="4" width="11" height="1" fill-opacity="0.28"/></g>` : "") +
    (m.alt ? `<g class="sd-mascot-alt">${cells(m.alt)}</g>` : "") +
    `<g class="sd-mascot-look"><g class="sd-mascot-eyes">${face.eyes}</g></g>` +
    `<g class="sd-mascot-mouth">${face.mouth}</g>` +
    `</g>` +
    (marks ? `<g class="sd-mascot-marks">${cells(marks)}</g>` : "") +
    `<g class="sd-mascot-ground">${cells(m.ground ?? [], 0, 14)}</g>`;
  return svg(15, 15, body);
}

/** IRIS as SVG markup for one mood. */
export const irisSVG = (mood = "idle") => mascotSVG("iris", mood);

/* ---- Behavior ------------------------------------------------------------ */

const ART_SELECTOR = "[data-sd-art]";
const MASCOT_SELECTOR = "[data-sd-mascot], [data-sd-iris]";
/** Moods whose eyes are already closed, so they never blink. */
const CLOSED = new Set(["calm", "happy", "sleepy", "offline"]);
const visible = new Set();
let seen = null;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const nameOf = (el) => (MASCOTS[el.dataset.sdMascot] ? el.dataset.sdMascot : "iris");
const moodOf = (el) => (MOODS.includes(el.dataset.mood) ? el.dataset.mood : "idle");
const still = (el) => "sdMascotStill" in el.dataset || "sdIrisStill" in el.dataset;

function drawArt(el) {
  const name = el.dataset.sdArt;
  if (el.dataset.sdArtDrawn === name) return;
  el.innerHTML = artSVG(name);
  el.dataset.sdArtDrawn = name;
  if (ART[name]) el.style.setProperty("--sd-art-rows", String(ART[name].h));
}

function drawMascot(el) {
  const key = `${nameOf(el)}:${moodOf(el)}`;
  if (el.dataset.sdMascotDrawn === key) return;
  el.innerHTML = mascotSVG(nameOf(el), moodOf(el));
  el.dataset.sdMascotDrawn = key;
  el.toggleAttribute("data-closed", CLOSED.has(moodOf(el)));
  if (!el.style.getPropertyValue("--sd-mascot-blink")) {
    // Each mascot blinks on its own slow rhythm, so a row of them never blinks in step.
    el.style.setProperty("--sd-mascot-blink", `${(5 + Math.random() * 4).toFixed(1)}s`);
    el.style.setProperty("--sd-mascot-blink-at", `-${(Math.random() * 5).toFixed(1)}s`);
  }
}

const tell = (el, reason) =>
  el.dispatchEvent(new CustomEvent("sd:mascot", { bubbles: true, detail: { mascot: nameOf(el), mood: moodOf(el), reason } }));

/** Set a mascot's mood from code. Same as writing data-mood. */
export function setMood(el, mood) {
  el.dataset.mood = MOODS.includes(mood) ? mood : "idle";
  drawMascot(el);
  tell(el, "mood");
}

/** Swap the character (iris, eagle, squirrel, elephant); the mood stays. */
export function setMascot(el, name) {
  el.dataset.sdMascot = MASCOTS[name] ? name : "iris";
  drawMascot(el);
  tell(el, "mascot");
}

/** Turn a mascot's eyes: x and y are -1, 0 or 1 cells. */
export function lookAt(el, x = 0, y = 0) {
  const clamp = (v) => String(Math.max(-1, Math.min(1, Math.round(v))));
  const [cx, cy] = [clamp(x), clamp(y)];
  if (el.style.getPropertyValue("--sd-mascot-x") === cx && el.style.getPropertyValue("--sd-mascot-y") === cy) return;
  el.style.setProperty("--sd-mascot-x", cx);
  el.style.setProperty("--sd-mascot-y", cy);
}

let pointer = null;
let frame = 0;
let rest = 0;

function follow() {
  frame = 0;
  for (const el of visible) {
    if (!el.isConnected || still(el)) continue;
    if (!pointer) {
      lookAt(el, 0, 0);
      continue;
    }
    const box = el.getBoundingClientRect();
    const dx = pointer.x - (box.left + box.width / 2);
    const dy = pointer.y - (box.top + box.height / 2);
    // A dead zone the size of the mascot: nearby, it looks straight out.
    const zone = Math.max(box.width, 24) * 0.6;
    lookAt(el, Math.abs(dx) < zone ? 0 : Math.sign(dx), Math.abs(dy) < zone ? 0 : Math.sign(dy));
  }
}

function onPointerMove(event) {
  if (event.pointerType === "touch") return;
  pointer = { x: event.clientX, y: event.clientY };
  if (!frame) frame = requestAnimationFrame(follow);
  // After a quiet spell the mascots look back out at the reader.
  clearTimeout(rest);
  rest = setTimeout(() => {
    pointer = null;
    follow();
  }, 4000);
}

function onPointerLeave(event) {
  if (event.relatedTarget) return;
  pointer = null;
  if (!frame) frame = requestAnimationFrame(follow);
}

/** A pressed mascot (a button, or anything with data-sd-mascot-press) hops and smiles. */
export function onMascotClick(event) {
  const el = event.target.closest?.(MASCOT_SELECTOR);
  if (!el || !(el.matches("button, a[href]") || "sdMascotPress" in el.dataset || el.dataset.sdIris === "press")) return;
  if (!reduced()) {
    el.querySelector(".sd-mascot-body")?.animate([{ transform: "translateY(0)" }, { transform: "translateY(-1px)" }, { transform: "translateY(0)" }], { duration: 200, easing: "steps(2, jump-none)" });
  }
  const before = moodOf(el);
  if (before !== "happy" && !el.dataset.sdMascotReturn) {
    el.dataset.sdMascotReturn = before;
    el.dataset.mood = "happy";
    drawMascot(el);
    setTimeout(() => {
      if (el.dataset.mood === "happy") el.dataset.mood = el.dataset.sdMascotReturn;
      delete el.dataset.sdMascotReturn;
      drawMascot(el);
    }, 1200);
  }
  tell(el, "press");
}
/** @deprecated alias */
export const onIrisClick = onMascotClick;

function mount(root) {
  const list = (sel) => [...(root.matches?.(sel) ? [root] : []), ...(root.querySelectorAll?.(sel) ?? [])];
  for (const el of list(ART_SELECTOR)) drawArt(el);
  for (const el of list(MASCOT_SELECTOR)) {
    drawMascot(el);
    seen.observe(el);
  }
}

let started = false;

export function initArt(root = document) {
  seen ??= new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) isIntersecting ? visible.add(target) : visible.delete(target);
  });
  mount(root);
  if (started) return;
  started = true;
  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerout", onPointerLeave, { passive: true });
  // Markup added later, and data-mood, data-sd-mascot or data-sd-art written by app code.
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes") {
        const el = r.target;
        if (el.matches(MASCOT_SELECTOR)) drawMascot(el);
        else if (el.matches(ART_SELECTOR)) drawArt(el);
      } else for (const node of r.addedNodes) if (node.nodeType === 1) mount(node);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-mood", "data-sd-art", "data-sd-mascot"] });
}
