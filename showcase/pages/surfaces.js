import { mountLibrary } from "../library.js";

mountLibrary();

const out = document.getElementById("sweep-progress");
document.getElementById("sweep-progress-input")?.addEventListener("input", (event) => {
  const value = Number(event.target.value);
  out.style.setProperty("--sd-sweep", value / 100);
  out.textContent = `Uploading ${value}%`;
});
