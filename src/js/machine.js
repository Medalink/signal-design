/**
 * Machine: a live state machine drawn on a dot grid. Stations hold tokens for
 * a while, pick an outcome, and send them down wires to the next station.
 * The whole machine is one plain JSON spec, so swapping it, editing it live or
 * pasting a new one never touches code.
 *
 *   import { mountMachine } from "signal-design/js";
 *   const machine = mountMachine(figure, spec);
 *   machine.speed = 0.25;
 *   machine.set("gate", { hold: [2, 6], out: { pass: { to: "main", weight: 9 }, fail: { to: "fix", weight: 1, status: "failed" } } });
 *
 * Spec, in grid cells (spec.cell px each, 20 by default):
 *   { seed, size: [cols, rows], travel, clock,
 *     nodes: [{ id, kind, at: [c, r], size: [w, h], label, meta, note, hold, capacity, queue, out, ... }],
 *     wires: [{ from, to, via: [[c, r]], start: [c, r], end: [c, r], dashed }],
 *     text: [{ at: [c, r], lines: ["…"], align }] }
 *
 * One clock drives every frame, in machine seconds: speed scales it, pause
 * stops it, and the loop sleeps while the machine is off screen or the tab is
 * hidden. Under prefers-reduced-motion nothing plays until asked, and tokens
 * jump instead of gliding.
 *
 * A spec with `driven: true` decides nothing by itself: sources stay quiet,
 * holds never end and lines send no copies. The host says what happened
 * (emit, start, finish, land, by a key it picks) and the machine animates it,
 * so a live system can drive the board from its own events.
 */
import { KINDS } from "./machine-kinds.js";

const kinds = new Map(Object.entries(KINDS));
const SVG = "http://www.w3.org/2000/svg";
const TRAIL = 36;
const QUEUE_GAP = 14;
const QUEUE_SHOWN = 7;

/** Add or replace a node kind. See machine-kinds.js for the hooks a kind may define. */
export function defineKind(name, kind) {
  kinds.set(name, kind);
}

/** The names of every kind a spec can use. */
export function machineKinds() {
  return [...kinds.keys()];
}

function random(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function el(tag, className, parent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (parent) parent.append(node);
  return node;
}

function svg(tag, attrs, parent) {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
  if (parent) parent.append(node);
  return node;
}

/** Corner points between two points, so every wire runs in straight lines and right angles. */
function orthogonal(points) {
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [px, py] = out[out.length - 1];
    const [qx, qy] = points[i];
    if (px !== qx && py !== qy) {
      const mx = Math.round((px + qx) / 2);
      out.push([mx, py], [mx, qy]);
    }
    out.push([qx, qy]);
  }
  return out.filter((p, i) => i === 0 || p[0] !== out[i - 1][0] || p[1] !== out[i - 1][1]);
}

function measure(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  return { points, cum, len: cum[cum.length - 1] };
}

function pointAt({ points, cum, len }, d) {
  if (d <= 0 || len === 0) return points[0];
  if (d >= len) return points[points.length - 1];
  let i = 1;
  while (cum[i] < d) i++;
  const f = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  const [ax, ay] = points[i - 1];
  const [bx, by] = points[i];
  return [ax + (bx - ax) * f, ay + (by - ay) * f];
}

const pathD = (points) => points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");
const ease = (p) => 0.5 - Math.cos(Math.PI * p) / 2;
/** A driven hold's progress: true to the estimate up to 90%, then creeping, never done until told. */
const guess = (f) => (f < 0.9 ? Math.max(0, f) : 0.9 + 0.08 * (1 - Math.exp((0.9 - f) * 3)));
const span = (v, rand) => (Array.isArray(v) ? v[0] + (v[1] - v[0]) * rand() : Number(v) || 0);

/** `out` as a table of outcomes: "main" means one outcome, pass, to main. */
function outcomes(out) {
  if (!out) return [];
  if (typeof out === "string") return [{ key: "pass", to: out, weight: 1 }];
  return Object.entries(out).map(([key, o]) => ({ key, weight: 1, ...(typeof o === "string" ? { to: o } : o) }));
}

/** Throw, naming the bad id, before a broken spec touches the board. */
function validate(spec) {
  if (!spec || !Array.isArray(spec.nodes)) throw new Error("A machine spec needs a nodes list");
  const ids = new Set();
  for (const node of spec.nodes) {
    if (!node?.id) throw new Error("Every machine node needs an id");
    if (ids.has(node.id)) throw new Error(`Two machine nodes are named "${node.id}"`);
    ids.add(node.id);
    if (!kinds.has(node.kind || "box")) throw new Error(`Node "${node.id}" has an unknown kind "${node.kind}". Known: ${machineKinds().join(", ")}`);
  }
  const known = (id, where) => {
    if (!ids.has(id)) throw new Error(`${where} names a missing node "${id}"`);
  };
  for (const node of spec.nodes) {
    for (const o of outcomes(node.out)) for (const to of [o.to ?? []].flat()) known(to, `Node "${node.id}", outcome "${o.key}",`);
    if (node.to != null) known(node.to, `Node "${node.id}"`);
    for (const to of node.emit ?? []) known(to, `Node "${node.id}"`);
  }
  for (const wire of spec.wires ?? []) {
    known(wire.from, `A wire from "${wire.from}"`);
    known(wire.to, `A wire to "${wire.to}"`);
  }
}

/**
 * Mount a machine
 into `root`: a `.sd-machine` figure (the board is its
 * `.sd-machine-board`) or the board itself.
 */
export function mountMachine(root, spec, options = {}) {
  const board = root.matches(".sd-machine-board") ? root : root.querySelector(".sd-machine-board") || root;
  const figure = root.closest(".sd-machine") || root;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const selectable = options.select ?? false;

  let s;
  let cell;
  let rand;
  let t = 0;
  let speed = options.speed ?? 1;
  let playing = options.autoplay ?? !reduced.matches;
  let visible = true;
  let frame = 0;
  let last = 0;
  let ids = 0;
  let selected = null;
  let snap = false;
  let canvas;
  let fit;
  let wiresLayer;
  let trailsLayer;
  let tokensLayer;
  let hand;
  const nodes = new Map();
  const wires = [];
  const tokens = new Set();
  const keyed = new Map();
  const moving = new Set();

  const px = ([c, r]) => [c * cell, r * cell];
  const emit = (type, detail = {}) =>
    figure.dispatchEvent(new CustomEvent("sd:machine", { bubbles: true, detail: { type, t, ...detail } }));
  const info = (tok) => tok && { id: tok.id, key: tok.key, label: tok.label, status: tok.status, count: tok.count };

  /* ---- Tokens ---------------------------------------------------------- */

  function place(tok, x, y) {
    tok.x = x;
    tok.y = y;
    tok.el.style.transform = `translate(${x}px, ${y}px)`;
  }

  function spawn({ x, y, label, status, origin, ref, kind, key, count } = {}) {
    const tok = {
      id: ++ids, key, label: label ?? "", status: status ?? "", origin, refs: ref ? [ref] : [], count: Math.max(1, count ?? 1),
      el: el("i", "sd-machine-token", tokensLayer),
    };
    if (kind) tok.el.dataset.kind = kind;
    if (tok.status) tok.el.dataset.status = tok.status;
    if (tok.count > 1) tok.el.dataset.count = String(tok.count);
    place(tok, x, y);
    tokens.add(tok);
    if (key != null) keyed.set(key, tok);
    return tok;
  }

  function despawn(tok, how = "fade") {
    moving.delete(tok);
    tokens.delete(tok);
    if (keyed.get(tok.key) === tok) keyed.delete(tok.key);
    dropTrail(tok);
    tok.el.dataset.gone = how;
    setTimeout(() => tok.el.remove(), 200);
  }

  function setStatus(tok, status) {
    if (!status) return;
    tok.status = status;
    tok.el.dataset.status = status;
  }

  function dropTrail(tok) {
    const trail = tok.trail;
    if (!trail) return;
    tok.trail = null;
    trail.style.opacity = "0";
    setTimeout(() => trail.remove(), 200);
  }

  /** Glide a token along points (canvas px) from where it is, then call `then`. */
  function move(tok, points, then, min = 0.18) {
    const path = measure(orthogonal([[tok.x, tok.y], ...points]));
    dropTrail(tok);
    tok.path = path;
    tok.then = then;
    tok.t0 = t;
    const jump = reduced.matches || snap;
    tok.dur = jump ? 0 : Math.max(min, path.len / (s.travel ?? 300));
    if (!jump && path.len > TRAIL * 1.5) {
      tok.trail = svg("path", { class: "sd-machine-trail", d: pathD(path.points), "stroke-dasharray": `${TRAIL} ${path.len + TRAIL}` }, trailsLayer);
      if (tok.status) tok.trail.dataset.status = tok.status;
      tok.trail.style.strokeDashoffset = String(TRAIL);
    }
    moving.add(tok);
    if (tok.dur === 0) step(tok);
  }

  function step(tok) {
    const p = tok.dur ? Math.min(1, (t - tok.t0) / tok.dur) : 1;
    const d = ease(p) * tok.path.len;
    const [x, y] = pointAt(tok.path, d);
    place(tok, x, y);
    if (tok.trail) tok.trail.style.strokeDashoffset = String(TRAIL - d);
    if (p >= 1) {
      moving.delete(tok);
      dropTrail(tok);
      const then = tok.then;
      tok.then = null;
      then?.();
    }
  }

  /* ---- Routing --------------------------------------------------------- */

  function wireBetween(from, to) {
    return wires.find((w) => w.from === from && w.to === to);
  }

  /** Send a token from node `from` to node `to`, along their wire when one is drawn. */
  function send(tok, from, to, lead = []) {
    const target = nodes.get(to);
    if (!target) return despawn(tok);
    const wire = wireBetween(from.id, to);
    const points = wire ? wire.points : [from.port.out, target.port.in];
    tok.node = null;
    target.inbound++;
    move(tok, [...lead, ...points], () => {
      target.inbound--;
      accept(target, tok);
    });
  }

  function accept(n, tok) {
    n.count.in++;
    emit("enter", { node: n.id, token: info(tok) });
    if (n.kind.accept?.(n, tok, helpers)) return refresh(n);
    const free = n.slots.find((slot) => !slot.tok);
    if (free && n.queue.length === 0) seat(n, free, tok);
    else enqueue(n, tok);
    refresh(n);
  }

  function queuePoint(n, i) {
    const [x, y] = n.port.in;
    return [x - 8 - QUEUE_GAP * i, y];
  }

  /** The first QUEUE_SHOWN waiting tokens line up at the port; the rest wait out of sight, counted on the last. */
  function layoutQueue(n) {
    const more = n.queue.length - QUEUE_SHOWN;
    n.queue.forEach((tok, i) => {
      if (i >= QUEUE_SHOWN) {
        tok.el.dataset.hidden = "";
        delete tok.el.dataset.more;
        tok.qi = -1;
        if (!moving.has(tok)) place(tok, ...queuePoint(n, QUEUE_SHOWN - 1));
        return;
      }
      delete tok.el.dataset.hidden;
      if (i === QUEUE_SHOWN - 1 && more > 0) tok.el.dataset.more = String(more);
      else delete tok.el.dataset.more;
      if (tok.qi === i) return;
      tok.qi = i;
      move(tok, [queuePoint(n, i)]);
    });
  }

  function enqueue(n, tok) {
    tok.node = n;
    const newest = n.queue[n.queue.length - 1];
    if (n.spec.queue === "latest" && newest) {
      move(tok, [[newest.x, newest.y]], () => {
        if (!n.queue.includes(newest)) {
          tokens.has(tok) && enqueue(n, tok);
          return;
        }
        newest.count += tok.count;
        newest.refs.push(...tok.refs);
        newest.el.dataset.count = String(newest.count);
        newest.el.dataset.pop = String(newest.count % 2);
        despawn(tok, "merge");
        emit("fold", { node: n.id, token: info(newest) });
        refresh(n);
      });
      return;
    }
    n.queue.push(tok);
    tok.el.dataset.queued = "";
    layoutQueue(n);
  }

  function seat(n, slot, tok) {
    slot.tok = tok;
    tok.node = n;
    delete tok.el.dataset.queued;
    delete tok.el.dataset.hidden;
    delete tok.el.dataset.more;
    tok.qi = undefined;
    for (const ref of tok.refs) ref.dataset.busy = String((Number(ref.dataset.busy) || 0) + 1);
    const [x, y] = slot.at;
    move(tok, [[n.x + x, n.y + y]], () => {
      slot.t0 = t - (tok.since ?? 0);
      slot.t1 = slot.t0 + Math.max(0.001, span(tok.hold ?? n.spec.hold ?? 1, rand));
      slot.holding = true;
      tok.el.dataset.held = "";
      n.kind.start?.(n, slot, tok, helpers);
      n.el.dataset.busy = "";
      emit("start", { node: n.id, token: info(tok) });
      if (tok.verdict) finish(n, slot, resolve(n, tok.verdict));
    });
  }

  function pick(n) {
    const table = outcomes(n.spec.out);
    if (!table.length) return { key: "end" };
    const total = table.reduce((sum, o) => sum + Math.max(0, Number(o.weight) || 0), 0);
    let r = rand() * total;
    for (const o of table) {
      r -= Math.max(0, Number(o.weight) || 0);
      if (r < 0) return o;
    }
    return table[table.length - 1];
  }

  /** An outcome by name from the node's out table, or a plain { status, to }. */
  function resolve(n, outcome) {
    if (outcome && typeof outcome === "object") return { key: outcome.key ?? "custom", ...outcome };
    const key = String(outcome ?? "pass");
    return outcomes(n.spec.out).find((o) => o.key === key) ?? { key, status: key === "fail" ? "failed" : "done" };
  }

  function finish(n, slot, chosen) {
    const tok = slot.tok;
    const outcome = chosen ?? pick(n);
    slot.tok = null;
    slot.holding = false;
    delete tok.el.dataset.held;
    setStatus(tok, outcome.status);
    n.count[outcome.status === "failed" ? "failed" : "done"]++;
    for (const ref of tok.refs) {
      const holders = (Number(ref.dataset.busy) || 1) - 1;
      if (holders) ref.dataset.busy = String(holders);
      else delete ref.dataset.busy;
      if (n.spec.judge) helpers.mark(ref, outcome.status || "done");
    }
    n.kind.finish?.(n, slot, tok, outcome, helpers);
    if (!n.slots.some((other) => other.holding)) delete n.el.dataset.busy;
    emit("finish", { node: n.id, outcome: outcome.key, token: info(tok) });
    const targets = [outcome.to ?? []].flat();
    if (!targets.length) despawn(tok);
    targets.forEach((to, i) => {
      const sent = i === 0 ? tok : spawn({ x: tok.x, y: tok.y, label: tok.label, status: tok.status, origin: tok.origin, kind: tok.el.dataset.kind });
      if (i > 0) sent.refs = [...tok.refs];
      send(sent, n, to);
    });
    pull(n);
  }

  function pull(n) {
    for (const slot of n.slots) {
      if (slot.tok || !n.queue.length) continue;
      seat(n, slot, n.queue.shift());
    }
    layoutQueue(n);
    refresh(n);
  }

  /* ---- Nodes ----------------------------------------------------------- */

  function fill(text, n) {
    return String(text ?? "").replace(/\{(\w+)\}/g, (_, key) => {
      if (key === "queue") return n.queue.length;
      if (key === "busy") return n.slots.filter((slot) => slot.tok).length;
      return n.count[key] ?? n.state?.[key] ?? "";
    });
  }

  function refresh(n) {
    const busy = n.slots.filter((slot) => slot.tok).length;
    n.el.dataset.queue = String(n.queue.length);
    if (n.noteEl) {
      const text = fill(n.spec.notes?.[n.el.dataset.status] ?? n.spec.note, n);
      if (n.noteEl.textContent !== text) n.noteEl.textContent = text;
    }
    if (n.metaEl) {
      const text = fill(n.spec.meta, n);
      if (n.metaEl.textContent !== text) n.metaEl.textContent = text;
    }
    n.el.setAttribute("aria-description", `${busy} working, ${n.queue.length} waiting`);
  }

  function buildNode(spec) {
    const kind = kinds.get(spec.kind || "box");
    if (!kind) throw new Error(`Unknown machine kind "${spec.kind}". Known: ${machineKinds().join(", ")}`);
    const [x, y] = px(spec.at || [0, 0]);
    const [w, h] = px(spec.size || [4, 4]);
    const n = {
      id: spec.id, spec, kind, x, y, w, h, queue: [], slots: [], inbound: 0,
      count: { in: 0, done: 0, failed: 0 }, state: {},
      port: { in: [x, y + h / 2], out: [x + w, y + h / 2] },
    };
    n.el = el("div", "sd-machine-node", canvas);
    n.el.dataset.kind = spec.kind || "box";
    n.el.dataset.id = spec.id;
    if (spec.bare) n.el.dataset.bare = "";
    if (spec.tone) n.el.dataset.tone = spec.tone;
    Object.assign(n.el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    n.body = el("div", "sd-machine-body", n.el);
    if (spec.ports !== false && kind.ports !== false && !spec.bare) {
      el("span", "sd-machine-port", n.el).dataset.side = "in";
      el("span", "sd-machine-port", n.el).dataset.side = "out";
    }
    if (spec.label || spec.note != null || spec.notes) {
      const label = el("div", "sd-machine-label", n.el);
      label.dataset.side = spec.labelSide || "top";
      const head = el("div", "", label);
      if (spec.label) el("b", "", head).textContent = spec.label;
      if (spec.meta) n.metaEl = el("span", "", head);
      if (spec.note != null || spec.notes) {
        n.noteEl = el("div", "sd-machine-note", label);
        if (spec.noteTone) n.noteEl.dataset.tone = spec.noteTone;
      }
    }
    if (selectable) {
      n.el.tabIndex = 0;
      n.el.setAttribute("role", "button");
      n.el.setAttribute("aria-pressed", String(selected === spec.id));
      n.el.setAttribute("aria-label", spec.label || spec.id);
    } else {
      n.el.setAttribute("role", "group");
      n.el.setAttribute("aria-label", spec.label || spec.id);
    }
    kind.build?.(n, helpers);
    const capacity = kind.capacity ? kind.capacity(n) : Math.max(0, spec.capacity ?? 1);
    const at = kind.slots ? kind.slots(n, capacity) : defaultSlots(n, capacity);
    n.slots = at.map((p) => ({ at: p, tok: null, holding: false, t0: 0, t1: 0 }));
    kind.decorate?.(n, helpers);
    nodes.set(spec.id, n);
    refresh(n);
    return n;
  }

  function defaultSlots(n, count) {
    const across = n.w >= n.h;
    return Array.from({ length: count }, (_, i) => {
      const f = (i + 1) / (count + 1);
      return across ? [n.w * f, n.h / 2] : [n.w / 2, n.h * f];
    });
  }

  function buildWire(spec) {
    const from = nodes.get(spec.from);
    const to = nodes.get(spec.to);
    if (!from || !to) throw new Error(`Machine wire ${spec.from} → ${spec.to} names a missing node`);
    const start = spec.start ? px(spec.start) : from.port.out;
    const end = spec.end ? px(spec.end) : to.port.in;
    const points = orthogonal([start, ...(spec.via || []).map(px), end]);
    const path = svg("path", { class: "sd-machine-wire", d: pathD(points) }, wiresLayer);
    if (spec.dashed) path.dataset.dashed = "";
    wires.push({ from: spec.from, to: spec.to, points, path });
  }

  function buildText(spec) {
    const block = el("div", "sd-machine-text", canvas);
    const [x, y] = px(spec.at);
    block.style.left = `${x}px`;
    block.style.top = `${y}px`;
    block.dataset.align = spec.align || "left";
    if (spec.tone) block.dataset.tone = spec.tone;
    for (const line of [spec.lines ?? spec.text].flat()) el("div", "", block).textContent = line;
  }

  /* ---- Build ----------------------------------------------------------- */

  function build(next) {
    validate(next);
    s = structuredClone(next);
    cell = s.cell ?? 20;
    rand = random(s.seed ?? 1);
    t = 0;
    ids = 0;
    nodes.clear();
    wires.length = 0;
    tokens.clear();
    keyed.clear();
    moving.clear();
    board.replaceChildren();
    const [W, H] = px(s.size || [48, 24]);
    fit = el("div", "sd-machine-fit", board);
    canvas = el("div", "sd-machine-canvas", fit);
    Object.assign(canvas.style, { width: `${W}px`, height: `${H}px`, "--cell": `${cell}px` });
    const layer = svg("svg", { class: "sd-machine-wires", width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true" }, canvas);
    wiresLayer = svg("g", {}, layer);
    trailsLayer = svg("g", {}, layer);
    for (const node of s.nodes || []) buildNode(node);
    for (const wire of s.wires || []) buildWire(wire);
    for (const text of s.text || []) buildText(text);
    tokensLayer = el("div", "sd-machine-tokens", canvas);
    tokensLayer.setAttribute("aria-hidden", "true");
    for (const n of nodes.values()) n.kind.ready?.(n, helpers);
    hand = figure.querySelector(".sd-machine-clock > i");
    resize();
    loop();
  }

  function resize() {
    if (!canvas) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const room = board.clientWidth;
    const scale = room ? Math.max(options.minScale ?? 0.5, Math.min(1, room / W)) : 1;
    // A tab stop on the board while it overflows, so keyboard users can scroll
    // it (WCAG 2.1.1); the stop goes away when the machine fits again.
    if (room > 0 && W * scale > room + 1) {
      if (!board.hasAttribute("tabindex")) {
        board.tabIndex = 0;
        board.dataset.sdScrollTabbed = "";
      }
    } else if ("sdScrollTabbed" in board.dataset) {
      board.removeAttribute("tabindex");
      delete board.dataset.sdScrollTabbed;
    }
    const width = `${W * scale}px`;
    if (fit.style.width === width) return;
    canvas.style.scale = scale === 1 ? "" : String(scale);
    fit.style.width = width;
    fit.style.height = `${H * scale}px`;
  }

  /* ---- Clock ----------------------------------------------------------- */

  function tick(now) {
    frame = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    run(dt * speed);
    loop();
  }

  function run(dt) {
    t += dt;
    for (const n of nodes.values()) {
      for (const slot of n.slots) {
        if (!slot.holding) continue;
        if (s.driven) {
          n.kind.progress?.(n, slot, guess((t - slot.t0) / (slot.t1 - slot.t0 || 1)), helpers);
          continue;
        }
        const p = slot.t1 > slot.t0 ? Math.min(1, (t - slot.t0) / (slot.t1 - slot.t0)) : 1;
        n.kind.progress?.(n, slot, p, helpers);
        if (p >= 1) finish(n, slot);
      }
      n.kind.tick?.(n, helpers);
    }
    for (const tok of [...moving]) step(tok);
    if (hand) hand.style.setProperty("--turn", `${((t / (s.clock?.period ?? 60)) % 1).toFixed(4)}turn`);
  }

  function loop() {
    const run = playing && visible && !document.hidden;
    if (run && !frame) frame = requestAnimationFrame(tick);
    if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    if (!run) last = 0;
  }

  /* ---- Helpers handed to kinds ---------------------------------------- */

  const helpers = {
    get t() {
      return t;
    },
    get reduced() {
      return reduced.matches;
    },
    get driven() {
      return Boolean(s.driven);
    },
    rand: () => rand(),
    span: (v) => span(v, rand),
    el,
    svg,
    place,
    spawn,
    despawn,
    send,
    move,
    emit,
    setStatus,
    nodes,
    wiresFrom: (id) => wires.filter((w) => w.from === id).map((w) => w.to),
    /** Judge a line dot: its status, then the line's own status from its newest judged dot. */
    mark(dot, status) {
      if (dot.dataset.status === "failed" && status !== "failed") return;
      dot.dataset.status = status;
      const line = nodes.get(dot.dataset.line);
      if (line) line.kind.judged?.(line, helpers);
    },
    refresh,
  };

  /** Run `fn` with every move it starts landing at once when `instant`. */
  function now(instant, fn) {
    if (!instant) return fn();
    const was = snap;
    snap = true;
    try {
      return fn();
    } finally {
      snap = was;
    }
  }

  /* ---- Input ----------------------------------------------------------- */

  function select(id) {
    selected = nodes.has(id) ? id : null;
    for (const n of nodes.values()) if (selectable) n.el.setAttribute("aria-pressed", String(n.id === selected));
    emit("select", { node: selected });
  }

  const onClick = (e) => {
    const node = e.target.closest?.(".sd-machine-node");
    if (selectable && node && board.contains(node)) select(node.dataset.id === selected ? null : node.dataset.id);
  };
  const onKey = (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches?.(".sd-machine-node")) {
      e.preventDefault();
      onClick(e);
    }
  };
  board.addEventListener("click", onClick);
  board.addEventListener("keydown", onKey);

  let sizing = 0;
  const sizes = new ResizeObserver(() => {
    cancelAnimationFrame(sizing);
    sizing = requestAnimationFrame(resize);
  });
  sizes.observe(board);
  const seen = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    loop();
  });
  seen.observe(board);
  const onVisibility = () => loop();
  document.addEventListener("visibilitychange", onVisibility);

  build(spec);
  figure.dataset.playing = String(playing);

  /* ---- Public API ------------------------------------------------------ */

  return {
    get time() {
      return t;
    },
    get playing() {
      return playing;
    },
    get speed() {
      return speed;
    },
    set speed(value) {
      speed = Math.max(0, Number(value) || 0);
      emit("state", { playing, speed });
    },
    get spec() {
      return structuredClone(s);
    },
    get selected() {
      return selected;
    },
    play() {
      playing = true;
      figure.dataset.playing = "true";
      loop();
      emit("state", { playing, speed });
    },
    pause() {
      playing = false;
      figure.dataset.playing = "false";
      loop();
      emit("state", { playing, speed });
    },
    toggle() {
      if (playing) this.pause();
      else this.play();
    },
    /** Run the clock forward by `seconds` of machine time in small steps, playing or not. */
    advance(seconds = 1) {
      for (let left = seconds; left > 0; left -= 0.05) run(Math.min(0.05, left));
      last = 0;
    },
    /** Swap the whole machine. */
    load(next) {
      validate(next);
      for (const tok of tokens) tok.el.remove();
      build(next);
      board.dataset.swap = String((Number(board.dataset.swap) || 0) + 1);
      emit("load", { nodes: [...nodes.keys()] });
    },
    /** Change one node's behavior while it runs: hold, capacity, out, every and the rest. */
    set(id, patch) {
      const n = nodes.get(id);
      if (!n) return;
      Object.assign(n.spec, patch);
      const original = s.nodes.find((node) => node.id === id);
      if (original) Object.assign(original, structuredClone(patch));
      if ("capacity" in patch && !n.kind.capacity) {
        const held = n.slots.map((slot) => slot.tok).filter(Boolean);
        for (const tok of held) {
          for (const ref of tok.refs) {
            const holders = (Number(ref.dataset.busy) || 1) - 1;
            if (holders) ref.dataset.busy = String(holders);
            else delete ref.dataset.busy;
          }
        }
        const count = Math.max(0, patch.capacity);
        const at = n.kind.slots ? n.kind.slots(n, count) : defaultSlots(n, count);
        n.slots = at.map((p) => ({ at: p, tok: null, holding: false, t0: 0, t1: 0 }));
        n.kind.decorate?.(n, helpers);
        n.queue.unshift(...held);
        pull(n);
      }
      n.kind.patch?.(n, patch, helpers);
      refresh(n);
    },
    /** One node's live numbers. */
    node(id) {
      const n = nodes.get(id);
      return n && {
        id, spec: structuredClone(n.spec), count: { ...n.count }, queue: n.queue.length,
        busy: n.slots.filter((slot) => slot.tok).length, capacity: n.slots.length, state: { ...n.state },
      };
    },
    /** True while a token with this key is on the board. */
    has(key) {
      return keyed.has(key);
    },
    /**
     * A token leaves a node (a source's row, or any node's out side) for the
     * node's `to` or its first wire. False when the node is missing or the key is taken.
     */
    emit(id, { key, label, row, status, kind = "change", instant } = {}) {
      const n = nodes.get(id);
      if (!n || (key != null && keyed.has(key))) return false;
      return now(instant, () => {
        if (n.kind.emit) return n.kind.emit(n, { key, label, row, status, kind }, helpers) !== false;
        const to = n.spec.to ?? helpers.wiresFrom(n.id)[0];
        if (!to) return false;
        const tok = spawn({ x: n.port.out[0], y: n.port.out[1], label, status, kind, key });
        n.count.done++;
        emit("emit", { node: n.id, token: info(tok) });
        send(tok, n, to);
        return true;
      });
    },
    /**
     * A token enters a node and starts there. `from` is where it comes from:
     * a line (from the dot with the same key or label), another node, or
     * nowhere (it appears by the queue). `hold` is the expected time in
     * seconds, `since` how long it has already run, `count` how many it covers.
     */
    start(id, { key, label, from, count, hold, since, status, kind = "signal", instant } = {}) {
      const n = nodes.get(id);
      if (!n || (key != null && keyed.has(key))) return false;
      return now(instant, () => {
        const src = from != null ? nodes.get(from) : null;
        let x = n.port.in[0] - 8;
        let y = n.port.in[1];
        let ref;
        if (src?.dots) {
          const i = src.dots.findIndex((d) => (key != null && d.dataset.key === String(key)) || (label && d.dataset.label === label));
          ref = src.dots[i];
          const wire = wireBetween(src.id, n.id);
          [x, y] = ref ? [src.x + 12 + i * src.gap, src.y + src.h / 2] : wire ? wire.points[0] : src.port.out;
        } else if (src) {
          [x, y] = src.port.out;
        }
        const tok = spawn({ x, y, label, status, kind, key, count, ref });
        tok.hold = hold;
        tok.since = since;
        if (src) send(tok, src, n.id);
        else accept(n, tok);
        return true;
      });
    },
    /** End a keyed token's hold with an outcome from its node's out table ("pass", "fail") or { status, to }. */
    finish(key, outcome = "pass") {
      const tok = keyed.get(key);
      if (!tok) return false;
      const n = tok.node;
      if (!n) {
        tok.verdict = outcome;
        return true;
      }
      const chosen = resolve(n, outcome);
      const slot = n.slots.find((x) => x.tok === tok);
      if (slot?.holding) finish(n, slot, chosen);
      else if (slot) tok.verdict = chosen;
      else {
        n.queue.splice(n.queue.indexOf(tok), 1);
        setStatus(tok, chosen.status);
        despawn(tok);
        pull(n);
      }
      return true;
    },
    /** Put a dot on a line at once, with a status when it is already judged. */
    land(id, { key, label, status } = {}) {
      const n = nodes.get(id);
      if (!n?.dots) return false;
      return now(true, () => {
        const tok = spawn({ x: n.x + 12, y: n.y + n.h / 2, label, kind: "change" });
        accept(n, tok);
        const dot = n.dots[0];
        if (key != null && dot) dot.dataset.key = String(key);
        if (status && dot) helpers.mark(dot, status);
        return true;
      });
    },
    select,
    destroy() {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(sizing);
      frame = 0;
      sizes.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      board.removeEventListener("click", onClick);
      board.removeEventListener("keydown", onKey);
      board.removeAttribute("tabindex");
      delete board.dataset.sdScrollTabbed;
      board.replaceChildren();
    },
  };
}
