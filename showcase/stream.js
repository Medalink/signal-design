import { mountBar, savedScrollbars } from "./viewport.js";
import { init, mountStream, ALERT_KINDS } from "../src/js/index.js";

// As an OBS source (?scene=…) the page is the scene alone: no bar, no remembered theme.
const source = document.documentElement.dataset.source;
if (!source) mountBar();
init({ theme: !source, scrollbars: savedScrollbars() });

const SAMPLE = {
  follow: ["lumen_fox", "graywave", "kitebox", "ostrander"],
  sub: ["pixelmoth", "byteharbor", "fernlight"],
  raid: ["tidepool", "northdial", "moss_and_iron"],
  bits: ["quietkey", "sundial", "hexagram"],
};
const DETAIL = { sub: "Tier 1 · 3 months", raid: "Raiding with 42 viewers", bits: "Cheered 500 bits" };
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const sample = (kind) => ({ kind, name: pick(SAMPLE[kind]), detail: DETAIL[kind] ?? ALERT_KINDS[kind].detail });

const streams = {};
for (const scene of document.querySelectorAll("[data-scene]")) {
  streams[scene.dataset.scene] = mountStream(scene);
}

for (const group of document.querySelectorAll("[data-fire-for]")) {
  const stream = streams[group.dataset.fireFor];
  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fire]");
    if (button) stream.alert(sample(button.dataset.fire));
  });
}

if (source) {
  // The in-game preview shows a raid at rest; a live source starts clear.
  for (const card of document.querySelectorAll(".sd-stream-alert")) card.hidden = true;
  // A bot or a dock can call window.stream.alert({ kind, name, detail }).
  window.stream = streams[source];
  if (new URLSearchParams(location.search).has("demo")) {
    const kinds = Object.keys(SAMPLE).filter((k) => source === "game" || k !== "raid");
    setInterval(() => streams[source]?.alert(sample(pick(kinds))), 8000);
  }
}
