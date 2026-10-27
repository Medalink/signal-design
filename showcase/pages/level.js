import { mountLibrary } from "../library.js";

mountLibrary();

const levelMeter = document.getElementById("demo-level");
document.getElementById("demo-level-input").addEventListener("input", (e) => {
  levelMeter.style.setProperty("--level", e.target.value);
  levelMeter.setAttribute("aria-valuenow", Number(e.target.value).toFixed(2));
});
