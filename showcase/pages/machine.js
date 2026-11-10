import { mountMachine } from "../../src/js/machine.js";
import { mountLibrary } from "../library.js";

mountLibrary();

const deploy = {
  seed: 7,
  size: [40, 14],
  clock: { period: 40 },
  nodes: [
    { id: "writers", kind: "source", at: [1, 2], size: [5, 8], agents: 3, every: [5, 9], to: "build", label: "writers", labelSide: "top-start" },
    {
      id: "build", kind: "box", at: [9, 3], size: [4, 6], capacity: 2, hold: [2, 4], label: "build", meta: "2 at a time",
      out: { pass: { to: "deploy", weight: 9 }, fail: { to: "writers", weight: 1, status: "failed" } },
    },
    { id: "deploy", kind: "press", at: [16, 3], size: [5, 6], hold: [0.6, 1.2], label: "deploy", meta: "one at a time", note: "{done} deployed", out: "prod" },
    { id: "prod", kind: "line", at: [24, 5], size: [15, 2], label: "prod", labelSide: "top-start", note: "waiting", notes: { done: "healthy", failed: "failing" } },
    {
      id: "verify", kind: "scan", at: [27, 10], size: [12, 3], queue: "latest", judge: true, hold: [3, 5], label: "verify", meta: "newest only", labelSide: "top-start",
      out: { pass: { weight: 5, status: "done" }, fail: { weight: 1, status: "failed" } },
    },
  ],
  wires: [
    { from: "writers", to: "build" },
    { from: "build", to: "deploy" },
    { from: "deploy", to: "prod" },
    { from: "prod", to: "verify", start: [25, 6], via: [[25, 11.5]] },
    { from: "build", to: "writers", start: [11, 3], via: [[11, 1], [3.5, 1]], end: [3.5, 2], dashed: true },
  ],
};

const rings = {
  seed: 3,
  size: [40, 16],
  clock: { period: 60 },
  nodes: [
    { id: "pushes", kind: "source", at: [1, 2], size: [5, 6], agents: 3, every: [1.2, 2.4], to: "main", label: "pushes", labelSide: "top-start" },
    { id: "main", kind: "line", at: [9, 4], size: [30, 2], label: "main", labelSide: "top-start", note: "", notes: { done: "green", failed: "red" } },
    {
      id: "lab", kind: "checks", at: [14, 8], size: [20, 3], queue: "latest", judge: true, hold: [4, 6], items: ["chromium", "webkit", "a11y", "perf"],
      label: "lab", meta: "folds what waits", labelSide: "top-start",
      out: { pass: { weight: 4, status: "done" }, fail: { weight: 1, status: "failed" } },
    },
    { id: "release", kind: "scan", at: [14, 12], size: [12, 3], queue: "latest", hold: [2, 3], label: "release", labelSide: "top-start", out: { tag: { to: "tag" } } },
    { id: "tag", kind: "sink", at: [30, 12], size: [5, 3], format: "v1.4.{n}", start: 56, label: "tag", labelSide: "top" },
  ],
  wires: [
    { from: "pushes", to: "main" },
    { from: "main", to: "lab", start: [10, 5], via: [[10, 9.5]] },
    { from: "main", to: "release", start: [10, 5], via: [[10, 13.5]] },
    { from: "release", to: "tag" },
  ],
};

const STEPS = ["build", "a11y", "perf"];

const hand = {
  driven: true,
  size: [52, 17],
  nodes: [
    { id: "agents", kind: "source", at: [1, 2], size: [5, 6], agents: 3, to: "main", label: "agents", labelSide: "top-start" },
    { id: "main", kind: "line", at: [9, 4], size: [30, 2], label: "main", labelSide: "top-start", note: "", notes: { done: "green", failed: "red" } },
    {
      id: "lab", kind: "checks", at: [14, 8], size: [18, 3], judge: true, keep: true, hold: 8, items: STEPS, link: "ring/lab",
      label: "lab", labelSide: "top-start", out: { pass: { status: "done" }, fail: { status: "failed" } },
    },
    { id: "runs", kind: "box", at: [14, 13], size: [10, 3], capacity: 2, hold: 30, label: "runs", labelSide: "top-start" },
    { id: "tag", kind: "sink", at: [36, 8], size: [5, 3], format: "v1.4.{n}", start: 59, label: "tag", labelSide: "top" },
    { id: "site", kind: "box", at: [46, 4], size: [5, 3], label: "site", labelSide: "top" },
    { id: "app", kind: "box", at: [46, 12], size: [5, 3], label: "app", labelSide: "top" },
  ],
  wires: [
    { from: "agents", to: "main" },
    { from: "main", to: "lab", start: [10, 5], via: [[10, 9.5]] },
    { from: "tag", to: "site" },
    { from: "tag", to: "app" },
  ],
};

{
  const figure = document.getElementById("machine-hand");
  const machine = mountMachine(figure, hand);
  const log = figure.querySelector("[data-machine-log]");
  let pushed = 0;
  let newest = null;
  let running = null;
  let runs = 0;
  let released = 0;
  const live = [];
  const sha = () => Math.floor(Math.random() * 0xfffffff).toString(16).padStart(7, "0");
  const onBoard = () => live.filter((key) => machine.has(key));
  const act = {
    push() {
      newest = sha();
      machine.emit("agents", { key: newest, label: newest, row: pushed++ });
    },
    run() {
      if (!newest || (running && machine.has(running))) return;
      running = `lab:${newest}`;
      machine.start("lab", { key: running, label: newest, from: "main" });
    },
    pass: () => running && machine.finish(running, "pass"),
    fail: () => running && machine.finish(running, { outcome: "fail", items: { build: "done", a11y: "failed", perf: "skipped" } }),
    freeze(button) {
      const frozen = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(frozen));
      machine.set("lab", { frozen });
    },
    agent() {
      runs++;
      live.push(`run:${runs}`);
      machine.start("runs", { key: `run:${runs}`, label: `run ${runs}`, link: `thread/${runs}` });
    },
    stall() {
      const run = onBoard().at(-1);
      if (run && machine.status(run, "waiting")) machine.set("runs", { meta: "stalled" });
    },
    join() {
      const [older, newer] = onBoard().slice(-2);
      if (newer && machine.fold(newer, older)) machine.set("runs", { meta: "joined" });
    },
    tag() {
      released++;
      const key = `tag:${released}`;
      machine.set("tag", { value: `v1.4.${59 + released}` });
      if (machine.emit("tag", { key })) for (const to of ["site", "app"]) machine.finish(`${key}:${to}`, "pass");
    },
    clear() {
      machine.clear();
      machine.set("lab", { frozen: false });
      machine.set("runs", { meta: "" });
      machine.set("tag", { value: null });
      figure.querySelector('[data-drive="freeze"]').setAttribute("aria-pressed", "false");
      newest = running = null;
      live.length = 0;
      if (log) log.textContent = "";
    },
  };
  for (const button of figure.querySelectorAll("[data-drive]")) {
    button.addEventListener("click", () => {
      machine.play();
      act[button.dataset.drive](button);
    });
  }
  figure.addEventListener("sd:machine", (event) => {
    const { type, node, key, link } = event.detail;
    if (type === "open" && log) log.textContent = `open ${link}${key != null ? ` (${key})` : node ? ` (${node})` : ""}`;
  });
}

for (const [id, spec] of [["machine-deploy", deploy], ["machine-fold", rings]]) {
  const figure = document.getElementById(id);
  const machine = mountMachine(figure, spec);
  const toggle = figure.querySelector("[data-machine-toggle]");
  const label = () => {
    if (toggle) toggle.textContent = machine.playing ? "Pause" : "Play";
  };
  label();
  toggle?.addEventListener("click", () => {
    machine.toggle();
    label();
  });
  for (const button of figure.querySelectorAll("[data-speed]")) {
    button.addEventListener("click", () => {
      machine.speed = Number(button.dataset.speed);
      for (const other of figure.querySelectorAll("[data-speed]")) other.setAttribute("aria-pressed", String(other === button));
    });
  }
}
