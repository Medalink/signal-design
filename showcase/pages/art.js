import { setMood, setMascot, toast, MASCOTS } from "../../src/js/index.js";
import { mountLibrary } from "../library.js";

mountLibrary();

const stage = document.getElementById("mascot-demo");
const label = () => `${MASCOTS[stage.dataset.sdMascot].label}, ${stage.dataset.mood}. Press to say hello.`;
const pick = (id, fn) =>
  document.getElementById(id)?.addEventListener("click", (event) => {
    const button = event.target.closest("button[value]");
    if (button) fn(button.value);
  });

/* ---- The stage: mascot, mood and status light --------------------------- */

pick("mascot-pick", (name) => {
  setMascot(stage, name);
  stage.setAttribute("aria-label", label());
  // The moods grid follows the stage.
  for (const el of document.querySelectorAll("#mood-grid [data-sd-mascot]")) el.dataset.sdMascot = name;
});
pick("mascot-moods", (mood) => {
  setMood(stage, mood);
  stage.setAttribute("aria-label", label());
});
pick("mascot-tones", (tone) => {
  if (tone) stage.dataset.tone = tone;
  else delete stage.dataset.tone;
});

/* ---- Work: aria-busy runs the beacon and the mascot's own motion -------- */

document.getElementById("mascot-busy")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  if (stage.getAttribute("aria-busy") === "true") return;
  const before = stage.dataset.mood;
  button.setAttribute("aria-pressed", "true");
  stage.setAttribute("aria-busy", "true");
  setMood(stage, "focused");
  setTimeout(() => {
    stage.removeAttribute("aria-busy");
    button.setAttribute("aria-pressed", "false");
    setMood(stage, before === "focused" ? "happy" : before);
    toast("Done", { tone: "success" });
  }, 5000);
});

/* ---- Scenes: swap every scene's mascot, or put back the one drawn ------- */

const scenes = [...document.querySelectorAll("#scenes .sd-art-scene [data-sd-mascot]")];
for (const el of scenes) el.dataset.drawnAs = el.dataset.sdMascot;
pick("scene-pick", (name) => {
  for (const el of scenes) el.dataset.sdMascot = name || el.dataset.drawnAs;
});
