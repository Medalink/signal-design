import { mountLibrary } from "../library.js";

mountLibrary();

/* ---- Motion replay ------------------------------------------------------- */

document.addEventListener("click", (event) => {
  if (event.target.closest('[data-demo="motion"]')) {
    const row = document.querySelector("[data-demo-row]");
    row.classList.remove("animate-slide-in");
    void row.offsetWidth;
    row.classList.add("animate-slide-in");
  }
});
