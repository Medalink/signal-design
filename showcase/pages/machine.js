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
