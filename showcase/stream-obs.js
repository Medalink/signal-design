// An OBS scene collection from stream.html: per scene, the page as a browser
// source with ?native, and an OBS Text source on every string it hid. Places,
// sizes, faces and colors are read from the page as it renders at 1920×1080,
// so the export follows broadcast.css. Keys follow obs-studio's
// libobs/obs-scene.c and plugins/obs-text/gdiplus/obs-text.cpp.

import { CHROME, nativeText } from "./stream-native.js";

const W = 1920;
const H = 1080;
const LABELS = {
  kicker: "Kicker",
  title: "Title",
  line: "Line",
  away: "Away",
  follow: "Latest follow",
  sub: "Latest sub",
  name: "Cam name",
  goallabel: "Goal label",
  socials: "Socials",
};
// Stack entries OBS cannot use: CSS keywords and the macOS system faces.
const SKIP_FACE = /^(-apple-system|BlinkMacSystemFont|SF Pro|SFMono|Menlo|system-ui|ui-|sans-serif|serif|monospace)/i;

const face = (family) =>
  family
    .split(",")
    .map((f) => f.trim().replace(/^["']|["']$/g, ""))
    .find((f) => f && !SKIP_FACE.test(f)) ?? "Arial";

// Windows has no Segoe UI at 500; the browser draws it with Segoe UI Semibold, and so does OBS.
function faceOf(cs) {
  const name = face(cs.fontFamily);
  return name === "Segoe UI" && Number(cs.fontWeight) >= 500 ? "Segoe UI Semibold" : name;
}

// OBS keeps colors as 0xAABBGGRR. Canvas resolves any CSS color (oklch included) to sRGB.
const paint = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
function obsColor(css) {
  paint.clearRect(0, 0, 1, 1);
  paint.fillStyle = css;
  paint.fillRect(0, 0, 1, 1);
  const [r, g, b] = paint.getImageData(0, 0, 1, 1).data;
  return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
}

function load(url) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText = `position:fixed;left:-${W * 2}px;top:0;width:${W}px;height:${H}px;border:0;visibility:hidden`;
    frame.addEventListener("load", () => resolve(frame), { once: true });
    frame.addEventListener("error", () => reject(new Error(`Could not load ${url}`)), { once: true });
    frame.src = url;
    document.body.append(frame);
  });
}

// Text next to page chrome (the live square, the timer) grows away from it.
function alignOf(el, cs) {
  if (el.dataset.native === "socials" || el.nextElementSibling?.matches(CHROME)) return "right";
  if (el.previousElementSibling?.matches(CHROME)) return "left";
  return cs.textAlign === "center" ? "center" : "left";
}

// Each hidden string as one text per line box: its text, box in scene pixels, and type.
async function measure(url, sceneKey) {
  const frame = await load(url);
  try {
    const doc = frame.contentDocument;
    await doc.fonts.ready;
    const scene = doc.querySelector(`[data-scene="${sceneKey}"]`);
    const frameBox = scene.getBoundingClientRect();
    const u = frameBox.width / W;
    const out = [];
    for (const el of scene.querySelectorAll("[data-native]")) {
      if (el.closest("[data-off]")) continue;
      const field = el.dataset.native;
      const cs = frame.contentWindow.getComputedStyle(el);
      const range = doc.createRange();
      range.selectNodeContents(el);
      // Group the text's boxes into lines.
      const lines = [];
      for (const r of range.getClientRects()) {
        if (!r.width || !r.height) continue;
        const line = lines.find((l) => Math.abs(l.top - r.top) < r.height / 2);
        if (line) {
          line.left = Math.min(line.left, r.left);
          line.right = Math.max(line.right, r.right);
          line.height = Math.max(line.height, r.height);
        } else lines.push({ top: r.top, left: r.left, right: r.right, height: r.height });
      }
      if (!lines.length) continue;
      lines.sort((a, b) => a.top - b.top);
      const text = nativeText(el);
      const words = text.split("\n").map((t) => t.trim());
      // A title over two lines becomes a text per line: OBS spaces lines wider than the page.
      const split = words.length > 1 && words.length === lines.length;
      const room = field === "follow" || field === "sub" ? el.getBoundingClientRect().width / u : 0;
      const style = {
        face: faceOf(cs),
        bold: Number(cs.fontWeight) >= 600,
        color: obsColor(cs.color),
        upper: cs.textTransform === "uppercase",
        align: alignOf(el, cs),
      };
      const parts = split ? lines.map((l, i) => [l, words[i]]) : [[lines.reduce((a, l) => ({ ...a, left: Math.min(a.left, l.left), right: Math.max(a.right, l.right) })), text]];
      parts.forEach(([line, value], i) => {
        out.push({
          field,
          part: split ? i : -1,
          text: value,
          ...style,
          size: Math.round(line.height / u),
          lines: split ? 1 : lines.length,
          x: (line.left - frameBox.left) / u,
          y: (line.top - frameBox.top) / u,
          w: (line.right - line.left) / u,
          room,
        });
      });
    }
    return out;
  } finally {
    frame.remove();
  }
}

function item(source, id, { x, y }) {
  return {
    name: source.name,
    source_uuid: source.uuid,
    visible: true,
    locked: false,
    rot: 0,
    pos: { x: Math.round(x), y: Math.round(y) },
    scale: { x: 1, y: 1 },
    align: 5,
    bounds_type: 0,
    bounds_align: 0,
    bounds: { x: 0, y: 0 },
    crop_left: 0,
    crop_top: 0,
    crop_right: 0,
    crop_bottom: 0,
    id,
    group_item_backup: false,
    scale_filter: "disable",
    blend_method: "default",
    blend_type: "normal",
    private_settings: {},
  };
}

// Where the OBS text box goes. Centered and right-aligned text gets a box, so
// longer text typed in OBS grows the way the page would.
function place(t) {
  const height = Math.ceil(t.size * t.lines * 1.4);
  if (t.align === "center") {
    const mid = t.x + t.w / 2;
    const width = Math.round(2 * Math.min(mid, W - mid));
    return { x: mid - width / 2, y: t.y, extents: { cx: width, cy: height } };
  }
  if (t.align === "right") {
    const right = t.x + t.w;
    const width = Math.round(Math.max(t.w + 240, right - W / 2));
    return { x: right - width, y: t.y, extents: { cx: width, cy: height } };
  }
  if (t.room) return { x: t.x, y: t.y, extents: { cx: Math.round(t.room), cy: height } };
  return { x: t.x, y: t.y, extents: null };
}

function textSource(name, t, extents) {
  return {
    id: "text_gdiplus",
    versioned_id: "text_gdiplus_v3",
    name,
    uuid: crypto.randomUUID(),
    enabled: true,
    settings: {
      text: t.text,
      font: { face: t.face, size: t.size, style: t.bold ? "Bold" : "Regular", flags: t.bold ? 1 : 0 },
      color: t.color,
      opacity: 100,
      align: t.align,
      valign: "top",
      transform: t.upper ? 1 : 0,
      antialiasing: true,
      extents: Boolean(extents),
      extents_cx: extents?.cx ?? 100,
      extents_cy: extents?.cy ?? 100,
      extents_wrap: false,
    },
  };
}

/**
 * @param {{ name: string, scenes: { key: string, title: string, url: string }[] }} options
 *   url is the stream.html URL OBS loads for that scene, with ?native.
 */
export async function obsCollection({ name, scenes }) {
  const measured = [];
  for (const scene of scenes) measured.push({ ...scene, texts: await measure(scene.url, scene.key) });

  // A string that reads the same in several scenes is one OBS source: edit a
  // name or the socials once and every scene shows it.
  const sig = (t, spot) => JSON.stringify([t.field, t.part, t.text, t.face, t.size, t.bold, t.color, t.upper, t.align, spot.extents]);
  const uses = new Map();
  for (const { texts } of measured) for (const t of texts) uses.set(sig(t, place(t)), (uses.get(sig(t, place(t))) ?? 0) + 1);

  const sources = [];
  const sceneSources = [];
  const made = new Map();
  const faces = new Set();

  for (const { title, url, texts } of measured) {
    const items = [];
    let id = 0;

    const overlay = {
      id: "browser_source",
      versioned_id: "browser_source",
      name: `${title} · Overlay`,
      uuid: crypto.randomUUID(),
      enabled: true,
      settings: { url, width: W, height: H },
    };
    sources.push(overlay);
    items.push(item(overlay, ++id, { x: 0, y: 0 }));

    for (const t of texts) {
      faces.add(t.face);
      const spot = place(t);
      const key = sig(t, spot);
      let source = made.get(key);
      if (!source) {
        const label = LABELS[t.field] + (t.part > 0 ? ` ${t.part + 1}` : "");
        let named = uses.get(key) > 1 ? label : `${title} · ${label}`;
        for (let n = 2; sources.some((s) => s.name === named); n++) named = `${title} · ${label} ${n}`;
        source = textSource(named, t, spot.extents);
        made.set(key, source);
        sources.push(source);
      }
      items.push(item(source, ++id, spot));
    }

    sceneSources.push({
      id: "scene",
      versioned_id: "scene",
      name: title,
      uuid: crypto.randomUUID(),
      enabled: true,
      settings: { items, id_counter: id, custom_size: false },
    });
  }

  const first = sceneSources[0]?.name ?? "";
  return {
    collection: {
      name,
      current_scene: first,
      current_program_scene: first,
      scene_order: sceneSources.map((s) => ({ name: s.name })),
      sources: [...sceneSources, ...sources],
      groups: [],
      quick_transitions: [],
      transitions: [],
      saved_projectors: [],
      current_transition: "Fade",
      transition_duration: 300,
    },
    faces: [...faces],
  };
}
