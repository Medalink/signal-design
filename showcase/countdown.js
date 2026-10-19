import { mountCountdown } from "../src/js/index.js";

export function mountCountdownDemo() {
  const root = document.getElementById("demo-countdown");
  const countdown = mountCountdown(root);
  let remainingMs = 5000;
  let startedAt = null;
  root.addEventListener("sd:countdown", ({ detail }) => {
    document.getElementById("countdown-state").textContent = detail.state;
    if (detail.state === "complete") { remainingMs = 0; startedAt = null; }
  });
  function set(running) {
    if (startedAt !== null) remainingMs = Math.max(0, remainingMs - (performance.now() - startedAt));
    startedAt = running ? performance.now() : null;
    countdown.set({ remainingMs, running });
  }
  set(false);
  document.getElementById("countdown-resume").onclick = () => set(true);
  document.getElementById("countdown-pause").onclick = () => set(false);
  document.getElementById("countdown-resync").onclick = () => {
    remainingMs = 5000;
    startedAt = null;
    set(false);
  };
}
