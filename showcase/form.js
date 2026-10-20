import { mountBar, savedScrollbars } from "./viewport.js";
import { init, toast } from "../src/js/index.js";

mountBar();
init({ scrollbars: savedScrollbars() });

const form = document.querySelector("[data-form]");
const error = document.querySelector("[data-form-error]");
const seats = document.getElementById("ws-seats");
const price = document.querySelector("[data-price]");

const updatePrice = () => (price.textContent = `$${Number(seats.value || 0) * 8}`);
seats.addEventListener("change", updatePrice);
seats.addEventListener("input", updatePrice);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  // Show every field's error, not only the ones the user touched.
  for (const field of form.querySelectorAll("input, select, textarea")) {
    field.toggleAttribute("aria-invalid", !field.checkValidity());
    if (field.hasAttribute("aria-invalid")) field.setAttribute("aria-invalid", "true");
  }
  const firstBad = form.querySelector('[aria-invalid="true"]');
  error.hidden = !firstBad;
  if (firstBad) {
    firstBad.focus();
    return;
  }
  toast("Workspace saved. Next: invite your team.", { tone: "success" });
});

form.addEventListener("input", (event) => {
  if (event.target.checkValidity?.()) event.target.removeAttribute("aria-invalid");
});

form.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches('.sd-dropzone input[type="file"]') && input.files.length) {
    input.closest(".sd-dropzone").querySelector("[data-file-names]").textContent = [...input.files].map((f) => f.name).join(" · ");
  }
});
