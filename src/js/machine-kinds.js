/**
 * The node kinds a machine spec can use. A kind draws one node and reacts to
 * the tokens it holds; the engine in machine.js owns time, queues, outcomes
 * and wires. Every hook is optional:
 *
 *   build(n, h)              fill n.body (n.w × n.h px) once
 *   capacity(n)              a fixed slot count; otherwise spec.capacity (1)
 *   slots(n, count)          where held tokens rest, [x, y] px inside the node
 *   decorate(n, h)           draw the slots, after build and after a capacity change
 *   ready(n, h)              once every node and wire exists
 *   accept(n, token, h)      take an arriving token yourself; return true when you did
 *   start(n, slot, token, h) a hold began
 *   progress(n, slot, p, h)  every frame of a hold, p from 0 to 1
 *   finish(n, slot, token, outcome, h)
 *   tick(n, h)               every frame
 *   patch(n, patch, h)       machine.set() changed the spec
 *   judged(n, h)             a dot of this line was judged (line only)
 *
 * h holds the engine's helpers: t, rand, span, el, svg, place, spawn,
 * despawn, send, move, emit, setStatus, mark, refresh, nodes, reduced.
 * Kinds write data-* state only; machine.css draws it.
 */

const SLOT = 22;
const HEX = "0123456789abcdef";

const sha = (h) => Array.from({ length: 7 }, () => HEX[Math.floor(h.rand() * 16)]).join("");

function flash(element, status, h) {
  element.dataset.result = status || "done";
  element.dataset.resultAt = String(h.t);
}

function clearFlash(element, h, after = 0.9) {
  if (element.dataset.result && h.t - Number(element.dataset.resultAt) > after) {
    delete element.dataset.result;
    delete element.dataset.resultAt;
  }
}

/** Square slots with a perimeter trace that fills as the hold runs. */
function drawSlots(n, h) {
  for (const old of n.body.querySelectorAll(":scope > .sd-machine-slot")) old.remove();
  for (const slot of n.slots) {
    const box = h.el("span", "sd-machine-slot", n.body);
    box.style.left = `${slot.at[0] - SLOT / 2}px`;
    box.style.top = `${slot.at[1] - SLOT / 2}px`;
    const frame = h.svg("svg", { viewBox: `0 0 ${SLOT} ${SLOT}`, "aria-hidden": "true" }, box);
    slot.trace = h.svg("rect", { class: "sd-machine-trace", x: 0.75, y: 0.75, width: SLOT - 1.5, height: SLOT - 1.5, pathLength: 1 }, frame);
    slot.box = box;
  }
}

function gridSlots(n, count) {
  const spec = n.spec;
  const cols = spec.cols ?? (n.w >= n.h ? count : 1);
  const rows = Math.ceil(count / cols) || 1;
  return Array.from({ length: count }, (_, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    return [(n.w * (c + 1)) / (cols + 1), (n.h * (r + 1)) / (rows + 1)];
  });
}

const box = {
  slots: gridSlots,
  decorate: drawSlots,
  start(n, slot) {
    slot.box.dataset.busy = "";
    slot.trace.style.strokeDashoffset = "1";
  },
  progress(n, slot, p) {
    slot.trace.style.strokeDashoffset = String(1 - p);
  },
  finish(n, slot, tok, outcome, h) {
    delete slot.box.dataset.busy;
    slot.trace.style.strokeDashoffset = "";
    flash(slot.box, outcome.status, h);
  },
  tick(n, h) {
    for (const slot of n.slots) if (slot.box) clearFlash(slot.box, h, 0.5);
  },
};

/** One at a time: two plates close on the token while it runs. */
const press = {
  ...box,
  capacity: () => 1,
  slots: (n) => [[n.w / 2, n.h / 2]],
  build(n, h) {
    h.el("i", "sd-machine-plate", n.body).dataset.side = "top";
    h.el("i", "sd-machine-plate", n.body).dataset.side = "bottom";
  },
  finish(n, slot, tok, outcome, h) {
    box.finish(n, slot, tok, outcome, h);
    n.el.dataset.stamp = "";
    n.state.stampAt = h.t;
  },
  tick(n, h) {
    box.tick(n, h);
    if ("stamp" in n.el.dataset && h.t - n.state.stampAt > 0.15) delete n.el.dataset.stamp;
  },
};

/** One at a time: the token itself rides a track from end to end. */
const scan = {
  capacity: () => 1,
  slots: (n) => [[16, n.h / 2]],
  build(n, h) {
    n.track = h.el("span", "sd-machine-track", n.body);
    n.track.style.top = `${n.h / 2 - 1}px`;
    n.fill = h.el("span", "sd-machine-track-fill", n.track);
  },
  progress(n, slot, p, h) {
    const tok = slot.tok;
    const span = n.w - 32;
    n.fill.style.scale = `${p} 1`;
    if (!tok.then) h.place(tok, n.x + 16 + span * p, n.y + n.h / 2);
  },
  finish(n, slot, tok, outcome, h) {
    n.fill.style.scale = "";
    flash(n.track, outcome.status, h);
  },
  tick(n, h) {
    clearFlash(n.track, h, 0.8);
  },
};

/** One at a time, with a row of named checks that finish at their own pace. */
const checks = {
  capacity: () => 1,
  slots: (n) => [[16, n.h / 2]],
  build(n, h) {
    const row = h.el("div", "sd-machine-checks", n.body);
    n.items = (n.spec.items || ["check"]).map((name) => {
      const chip = h.el("span", "sd-machine-check", row);
      chip.textContent = name;
      chip.dataset.status = "queued";
      return { chip, at: 1 };
    });
  },
  start(n, slot, tok, h) {
    for (const item of n.items) {
      item.at = 0.3 + h.rand() * 0.7;
      item.chip.dataset.status = "running";
    }
    n.state.resetAt = Infinity;
  },
  progress(n, slot, p) {
    for (const item of n.items) {
      if (p >= item.at && item.chip.dataset.status === "running") item.chip.dataset.status = "done";
    }
  },
  finish(n, slot, tok, outcome, h) {
    for (const item of n.items) item.chip.dataset.status = "done";
    if (outcome.status === "failed") n.items[Math.floor(h.rand() * n.items.length)].chip.dataset.status = "failed";
    n.state.resetAt = h.t + 1.2;
  },
  tick(n, h) {
    if (h.t < n.state.resetAt || !n.items) return;
    n.state.resetAt = Infinity;
    if (!n.slots[0]?.holding) for (const item of n.items) item.chip.dataset.status = "queued";
  },
};

/**
 * A branch: each token that lands becomes a dot, newest first. A copy of it
 * leaves on every wire out of the line. A node with `judge: true` that holds
 * a copy colors the dot with its outcome, and the line takes the status of
 * its newest judged dot.
 */
const line = {
  ports: false,
  capacity: () => 0,
  build(n, h) {
    n.rule = h.el("span", "sd-machine-rule", n.body);
    n.rule.style.top = `${n.h / 2}px`;
    h.el("span", "sd-machine-cap", n.body).style.top = `${n.h / 2 - 9}px`;
    n.dots = [];
    n.gap = n.spec.gap ?? 26;
    n.keep = Math.max(1, Math.floor((n.w - 30) / n.gap) + 1);
  },
  accept(n, tok, h) {
    const x = 12;
    const y = n.h / 2;
    const dot = h.el("i", "sd-machine-dot", n.body);
    dot.dataset.line = n.id;
    dot.dataset.label = tok.label;
    dot.dataset.new = "";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    h.move(tok, [[n.x + x, n.y + y]], () => {
      h.despawn(tok, "merge");
      n.dots.unshift(dot);
      n.dots.forEach((d, i) => {
        d.style.translate = `${i * n.gap}px 0`;
        if (i >= n.keep) {
          d.dataset.gone = "";
          setTimeout(() => d.remove(), 200);
        }
      });
      n.dots.length = Math.min(n.dots.length, n.keep);
      requestAnimationFrame(() => delete dot.dataset.new);
      n.count.done++;
      h.emit("land", { node: n.id, token: { id: tok.id, label: tok.label, status: tok.status, count: tok.count } });
      for (const to of n.spec.emit ?? h.wiresFrom(n.id)) {
        const copy = h.spawn({ x: n.x + x, y: n.y + y, label: tok.label, ref: dot, kind: "signal" });
        h.send(copy, n, to);
      }
      h.refresh(n);
    });
    return true;
  },
  judged(n, h) {
    const newest = n.dots.find((d) => d.dataset.status);
    if (newest) n.el.dataset.status = newest.dataset.status;
    h.refresh(n);
  },
};

/**
 * Where tokens come from: rows of workers, each writing at its own pace
 * (`every`, seconds) and sending what it wrote to `to`. A token sent back
 * here returns to the row that wrote it.
 */
const source = {
  ports: false,
  capacity: () => 0,
  build(n, h) {
    const count = n.spec.agents ?? 4;
    const pitch = n.h / count;
    n.rows = Array.from({ length: count }, (_, i) => {
      const row = h.el("div", "sd-machine-agent", n.body);
      row.style.top = `${pitch * i + pitch / 2 - 10}px`;
      h.el("span", "sd-machine-bot", row).innerHTML = "<i></i><i></i>";
      const chip = h.el("span", "sd-machine-chip", row);
      return { row, chip, y: pitch * i + pitch / 2, start: 0, next: 0, shown: -1 };
    });
    const fan = h.svg("svg", { class: "sd-machine-fan", width: n.w, height: n.h, "aria-hidden": "true" }, n.body);
    const bend = n.w - 10;
    for (const r of n.rows) {
      h.svg("path", { class: "sd-machine-wire", d: `M66 ${r.y}H${bend}V${n.h / 2}H${n.w}` }, fan);
    }
  },
  ready(n, h) {
    n.rows.forEach((r, i) => {
      r.start = 0;
      r.next = h.span(n.spec.every ?? [3, 6]) * ((i + 1) / n.rows.length);
    });
  },
  tick(n, h) {
    for (const [i, r] of n.rows.entries()) {
      const p = Math.min(1, (h.t - r.start) / (r.next - r.start || 1));
      const shown = Math.round(p * 20) / 20;
      if (shown !== r.shown) {
        r.shown = shown;
        r.chip.style.setProperty("--p", String(shown));
      }
      clearFlash(r.row, h, 1.2);
      if (h.t < r.next) continue;
      r.start = h.t;
      r.next = h.t + h.span(n.spec.every ?? [3, 6]);
      const tok = h.spawn({ x: n.x + 66, y: n.y + r.y, label: sha(h), origin: i, kind: "change" });
      n.count.done++;
      h.emit("emit", { node: n.id, token: { id: tok.id, label: tok.label, status: "", count: 1 } });
      h.send(tok, n, n.spec.to, [[n.x + n.w - 10, n.y + r.y], [n.x + n.w - 10, n.y + n.h / 2]]);
      h.refresh(n);
    }
  },
  accept(n, tok, h) {
    const r = n.rows[tok.origin] ?? n.rows[0];
    h.move(tok, [[n.x + 66, n.y + r.y]], () => {
      h.despawn(tok, "merge");
      flash(r.row, tok.status, h);
      r.start = h.t;
    });
    return true;
  },
};

/** The end of the road: counts what arrives and shows the latest (`format`, with {n}). */
const sink = {
  capacity: () => 0,
  build(n, h) {
    n.tag = h.el("span", "sd-machine-tag", n.body);
    n.state.n = n.spec.start ?? 0;
    n.tagText = h.el("b", "", n.tag);
    n.tagText.textContent = (n.spec.format ?? "{n}").replace("{n}", n.state.n);
  },
  accept(n, tok, h) {
    h.move(tok, [[n.x + n.w / 2, n.y + n.h / 2]], () => {
      h.despawn(tok, "merge");
      n.state.n++;
      n.count.done++;
      n.tagText.textContent = (n.spec.format ?? "{n}").replace("{n}", n.state.n);
      n.tag.dataset.flip = String(n.state.n % 2);
      flash(n.tag, tok.status, h);
      h.refresh(n);
    });
    return true;
  },
  tick(n, h) {
    clearFlash(n.tag, h, 0.6);
  },
};

export const KINDS = { box, press, scan, checks, line, source, sink };
