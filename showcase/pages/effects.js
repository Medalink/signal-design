import { rain, toast } from "../../src/js/index.js";
import { mountLibrary } from "../library.js";

mountLibrary();

/* ---- A job that animates the rain while it runs ------------------------- */

document.querySelector("[data-demo-busy]")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  if (button.getAttribute("aria-busy") === "true") return;
  button.setAttribute("aria-busy", "true");
  rain.busy(true);
  setTimeout(() => {
    rain.busy(false);
    button.removeAttribute("aria-busy");
    toast("Job finished", { tone: "success" });
  }, 6000);
});
