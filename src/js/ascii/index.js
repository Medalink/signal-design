/**
 * signal-design/ascii: pieces from ascii-magic-art (an optional peer
 * dependency; nothing in signal-design/js imports this module) as text in
 * Signal's rules.
 *
 *   import { mountAscii } from "signal-design/ascii";
 *   const piece = await import("ascii-magic-art/pieces/spinning-torus.js");
 *   const art = mountAscii(document.querySelector(".sd-ascii"), piece, { look: "dots" });
 *   art.busy(true);   // play while work runs; art.busy() follows aria-busy again
 *   art.destroy();
 *
 * Signal's motion rule holds: a piece is a still frame and plays only while
 * it is busy, meaning its element or the closest ancestor that has aria-busy
 * says aria-busy="true" (or busy(true) was called). prefers-reduced-motion
 * keeps it still, and it pauses while it is off screen or the tab is hidden.
 * When it stops, it keeps the frame it is on.
 *
 * The art is DOM text in a <pre>, so it is selectable and inherits the theme.
 * The piece's palette is not painted: each color becomes one of three greys by
 * its brightness (see ascii.css), and data-tone colors the brightest.
 * Square-cell pieces (photos) are not supported.
 */
import { withLook } from "ascii-magic-art/runtime/glyphs.js";

const HI = 2;
const MID = 1;
const LO = 0;
const CLASS = ["sd-ascii-lo", "", "sd-ascii-hi"];

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
// Glyphs the mono face is sure to draw at one column: ASCII, Latin-1, general
// punctuation, box drawing and block elements, and the dot and square shapes
// the looks use. Anything else (braille, arrows, symbols) falls back to
// another font of another width and is boxed to one column.
const BOXED = /[^\0-~ -ÿ -⁯─-▟■-▫○-●◦]/;
const cells = new Map();
function cellHTML(ch) {
  let html = cells.get(ch);
  if (html === undefined) {
    html = ESCAPES[ch] ?? (BOXED.test(ch) ? `<i>${ch}</i>` : ch);
    cells.set(ch, html);
  }
  return html;
}

const levels = new WeakMap();
const brightness = (hex) => (/^#[0-9a-f]{6}$/i.test(hex) ? (0.2126 * parseInt(hex.slice(1, 3), 16) + 0.7152 * parseInt(hex.slice(3, 5), 16) + 0.0722 * parseInt(hex.slice(5, 7), 16)) / 255 : NaN);
/** Palette key to grey level, split in thirds of the palette's own brightness range. A flat palette, or a color that is not #rrggbb, stays in the middle. */
function levelsOf(palette) {
  let table = levels.get(palette);
  if (!table) {
    const entries = Object.entries(palette)
      .map(([key, hex]) => [key, brightness(hex)])
      .filter(([, b]) => !Number.isNaN(b));
    const lows = Math.min(...entries.map(([, b]) => b));
    const span = Math.max(...entries.map(([, b]) => b)) - lows;
    table = Object.fromEntries(entries.map(([key, b]) => [key, span ? Math.min(HI, Math.floor(((b - lows) / span) * 3)) : MID]));
    levels.set(palette, table);
  }
  return table;
}

/** A frame (string, or { text, color } with each color char a palette key) as HTML. */
function frameHTML(frame, palette) {
  if (typeof frame === "string") return [...frame].map(cellHTML).join("");
  const table = palette ? levelsOf(palette) : {};
  const colors = frame.color.split("\n");
  return frame.text
    .split("\n")
    .map((row, y) => {
      const keys = [...colors[y]];
      let out = "";
      let run = "";
      let level = MID;
      const flush = () => {
        if (run) out += CLASS[level] ? `<span class="${CLASS[level]}">${run}</span>` : run;
        run = "";
      };
      [...row].forEach((ch, x) => {
        // A space has no ink, so it joins whatever run it sits in.
        const next = ch === " " ? level : (table[keys[x]] ?? MID);
        if (next !== level) {
          flush();
          level = next;
        }
        run += cellHTML(ch);
      });
      flush();
      return out;
    })
    .join("\n");
}

const mounts = new Map(); // element to mount
let observers = null;

function sync() {
  for (const mount of mounts.values()) mount.sync();
}

function watch(mount) {
  mounts.set(mount.el, mount);
  if (observers) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const intersection = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const mount = mounts.get(entry.target);
      if (mount) mount.visible = entry.isIntersecting;
    }
    sync();
  });
  const mutation = new MutationObserver(sync);
  mutation.observe(document.documentElement, { attributes: true, attributeFilter: ["aria-busy"], subtree: true });
  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  observers = { reduced, intersection, mutation };
}

function unwatch(mount) {
  mounts.delete(mount.el);
  observers.intersection.unobserve(mount.el);
  if (mounts.size) return;
  observers.intersection.disconnect();
  observers.mutation.disconnect();
  observers.reduced.removeEventListener("change", sync);
  document.removeEventListener("visibilitychange", sync);
  observers = null;
}

/**
 * Mount a piece module in an element. Returns { render, busy, destroy }.
 * @param {HTMLElement} el
 * @param {{ meta: object, default: () => (t: number) => string | { text: string, color: string, palette?: object } }} piece
 * @param {{ at?: number, look?: string, speed?: number }} [opts]
 */
export function mountAscii(el, piece, { at = 0, look, speed = 1 } = {}) {
  const { meta } = piece;
  if (meta.cell === "square") throw new TypeError(`${meta.slug} is a photo piece; mountAscii draws text pieces`);
  mounts.get(el)?.destroy();
  const draw = withLook(piece.default(), meta.palette, look ? { look } : undefined);
  const pre = document.createElement("pre");
  el.classList.add("sd-ascii");
  el.style.setProperty("--cols", meta.cols);
  el.style.setProperty("--rows", meta.rows);
  el.replaceChildren(pre);

  let elapsed = at;
  let shown = "";
  let forced = null;
  let raf = 0;
  let previous = null;
  let drawn = 0;

  function render(t) {
    elapsed = t;
    const frame = draw(t);
    const html = frameHTML(frame, frame.palette ?? meta.palette);
    if (html !== shown) pre.innerHTML = shown = html;
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    elapsed = Math.max(0, elapsed + ((now - (previous ?? now)) / 1000) * speed);
    previous = now;
    if (now - drawn < 1000 / meta.fps - 1) return;
    drawn = now;
    render(elapsed);
  }

  const mount = {
    el,
    visible: false,
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      if (mounts.get(el) === mount) unwatch(mount);
    },
    sync() {
      if (!el.isConnected) return mount.destroy();
      const busy = forced ?? el.closest("[aria-busy]")?.getAttribute("aria-busy") === "true";
      const playing = busy && this.visible && !observers.reduced.matches && !document.hidden && !meta.still;
      if (playing && !raf) {
        previous = null;
        raf = requestAnimationFrame(loop);
      } else if (!playing && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
  };

  render(at);
  watch(mount);
  observers.intersection.observe(el);
  mount.sync();

  return {
    render,
    /** Play while true, hold while false; with no argument, follow aria-busy again. */
    busy(on) {
      forced = on ?? null;
      if (mounts.get(el) === mount) mount.sync();
    },
    destroy: mount.destroy,
  };
}
