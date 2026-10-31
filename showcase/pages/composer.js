import { mountLibrary } from "../library.js";

mountLibrary();

// The live level and the clock of the recording demo: one bar per sample while it records.
const rec = document.getElementById("demo-recording");
if (rec && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const wave = rec.querySelector(".sd-composer-rec-wave");
  const time = rec.querySelector(".sd-composer-rec-time");
  const started = performance.now();
  let level = 0.4;
  setInterval(() => {
    level = Math.min(1, Math.max(0.08, level + (Math.random() - 0.5) * 0.6));
    const bar = document.createElement("i");
    bar.style.setProperty("--h", level.toFixed(2));
    wave.append(bar);
    while (wave.childElementCount > 200) wave.firstElementChild.remove();
    const seconds = 7 + Math.floor((performance.now() - started) / 1000);
    time.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    time.dateTime = `PT${seconds}S`;
  }, 100);
}
