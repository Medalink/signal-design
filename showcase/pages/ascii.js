import { mountAscii } from "../../src/js/ascii/index.js";
import { mountLibrary } from "../library.js";

mountLibrary();

/** The pieces this page plays. Spelled out so only these load, and the two Unsplash photo pieces never do. */
const pieces = {
  "spinning-torus": () => import("ascii-magic-art/pieces/spinning-torus.js"),
  "ci-pipeline": () => import("ascii-magic-art/pieces/ci-pipeline.js"),
  "torus-knot": () => import("ascii-magic-art/pieces/torus-knot.js"),
  "dijkstra-path": () => import("ascii-magic-art/pieces/dijkstra-path.js"),
  "terminal-session": () => import("ascii-magic-art/pieces/terminal-session.js"),
  "gauge-cluster": () => import("ascii-magic-art/pieces/gauge-cluster.js"),
  "spiral-galaxy": () => import("ascii-magic-art/pieces/spiral-galaxy.js"),
  "owl-blink": () => import("ascii-magic-art/pieces/owl-blink.js"),
  "extruded-word-spin": () => import("ascii-magic-art/pieces/extruded-word-spin.js"),
  tunnel: () => import("ascii-magic-art/pieces/tunnel.js"),
  "lorenz-attractor": () => import("ascii-magic-art/pieces/lorenz-attractor.js"),
  "sort-race": () => import("ascii-magic-art/pieces/sort-race.js"),
  "sleeping-cat": () => import("ascii-magic-art/pieces/sleeping-cat.js"),
  "empty-payment-failed": () => import("ascii-magic-art/pieces/empty-payment-failed.js"),
  "empty-payment-success": () => import("ascii-magic-art/pieces/empty-payment-success.js"),
};

/** Load a piece when its element comes near the screen, then mount it still. */
const lazy = new IntersectionObserver(
  (entries) => {
    for (const { isIntersecting, target } of entries) {
      if (!isIntersecting) continue;
      lazy.unobserve(target);
      pieces[target.dataset.piece]().then((piece) => mountAscii(target, piece, { at: Number(target.dataset.at ?? 0) }));
    }
  },
  { rootMargin: "300px 0px" },
);
/* ---- Looks: the same piece in other characters, and a Run switch ------- */

for (const el of document.querySelectorAll("[data-piece]")) if (!el.closest("#ascii-stage")) lazy.observe(el);

const stage = document.getElementById("ascii-stage");
const stageArt = stage.querySelector(".sd-ascii");
const run = stage.querySelector("[data-ascii-run]");
const torus = pieces["spinning-torus"]();
let hero = null;

async function showLook(look) {
  const piece = await torus;
  hero?.destroy();
  hero = mountAscii(stageArt, piece, { at: Number(stageArt.dataset.at), look });
}
showLook("original");
stage.addEventListener("change", (event) => showLook(event.detail.value));
run.addEventListener("click", () => {
  const on = run.getAttribute("aria-pressed") !== "true";
  run.setAttribute("aria-pressed", String(on));
  if (on) stage.setAttribute("aria-busy", "true");
  else stage.removeAttribute("aria-busy");
});

/* ---- While work runs: the panel is busy, so its art plays -------------- */

const job = document.getElementById("ascii-job");
const jobButton = job.querySelector("[data-ascii-job]");
const bar = job.querySelector(".sd-progress");
const percent = job.querySelector("[data-ascii-percent]");
const JOB_MS = 8000;

jobButton.addEventListener("click", () => {
  const start = performance.now();
  jobButton.disabled = true;
  job.setAttribute("aria-busy", "true");
  const tick = (now) => {
    const done = Math.min(100, Math.round(((now - start) / JOB_MS) * 100));
    bar.style.setProperty("--value", done);
    bar.setAttribute("aria-valuenow", done);
    percent.textContent = done < 100 ? `${done}%` : "Done";
    if (done < 100) return requestAnimationFrame(tick);
    job.removeAttribute("aria-busy");
    jobButton.disabled = false;
  };
  requestAnimationFrame(tick);
});

/* ---- Gallery: hover, keyboard focus or the Play button plays a card ----- */

for (const card of document.querySelectorAll("[data-ascii-card]")) {
  const play = card.querySelector("button");
  const wants = { pointer: false, focus: false };
  const apply = () => {
    const on = wants.pointer || wants.focus || play.getAttribute("aria-pressed") === "true";
    if (on) card.setAttribute("aria-busy", "true");
    else card.removeAttribute("aria-busy");
  };
  card.addEventListener("pointerenter", (event) => {
    wants.pointer = event.pointerType === "mouse";
    apply();
  });
  card.addEventListener("pointerleave", () => {
    wants.pointer = false;
    apply();
  });
  play.addEventListener("focus", () => {
    wants.focus = play.matches(":focus-visible");
    apply();
  });
  play.addEventListener("blur", () => {
    wants.focus = false;
    apply();
  });
  play.addEventListener("click", () => {
    play.setAttribute("aria-pressed", String(play.getAttribute("aria-pressed") !== "true"));
    apply();
  });
}
