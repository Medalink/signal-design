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

// What is wrong with each field, in words that say how to fix it.
const messages = {
  name: (v) => (v.valueMissing ? "Enter a workspace name." : "Use at least 3 characters."),
  slug: (v) => (v.valueMissing ? "Enter an address." : "Only lowercase letters, numbers and dashes."),
  seats: () => "Choose between 1 and 50 seats.",
  terms: () => "Agree to the terms to continue.",
};

// A control points at its hint while valid and at its error while invalid,
// so a screen reader never reads an error that is not showing.
function describe(field) {
  const message = field.closest(".sd-field")?.querySelector(".sd-field-error");
  if (!message) return;
  const target = field.hasAttribute("aria-invalid") ? message : message.parentElement.querySelector(".sd-field-hint");
  if (target) field.setAttribute("aria-describedby", target.id);
  else field.removeAttribute("aria-describedby");
}

function validate(field) {
  const valid = field.checkValidity();
  field.toggleAttribute("aria-invalid", !valid);
  if (!valid) {
    field.setAttribute("aria-invalid", "true");
    const message = field.closest(".sd-field")?.querySelector(".sd-field-error");
    if (message && messages[field.name]) message.textContent = messages[field.name](field.validity);
  }
  describe(field);
}

const fields = () => [...form.querySelectorAll("input, select, textarea")];

// The banner follows the fields once it has been shown.
function summarize() {
  const count = form.querySelectorAll('[aria-invalid="true"]').length;
  error.hidden = !count;
  error.textContent = count === 1 ? "1 field needs fixing." : `${count} fields need fixing.`;
  return count;
}

fields().forEach(describe);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  // Show every field's error, not only the ones the user touched.
  fields().forEach(validate);
  if (summarize()) {
    // Center the field so its label, its message and the sticky banner all stay in view.
    const firstBad = form.querySelector('[aria-invalid="true"]');
    (firstBad.closest(".sd-field") ?? firstBad).scrollIntoView({ block: "center" });
    firstBad.focus({ preventScroll: true });
    return;
  }
  toast("Workspace saved. Next: invite your team.", { tone: "success" });
});

// Check a field when the user leaves it, and again as they fix it.
form.addEventListener("focusout", (event) => {
  if (event.target.matches?.("input, select, textarea")) validate(event.target);
  if (!error.hidden) summarize();
});
form.addEventListener("input", (event) => {
  if (event.target.matches?.("input, select, textarea") && event.target.hasAttribute("aria-invalid")) validate(event.target);
  if (!error.hidden) summarize();
});

form.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches('.sd-dropzone input[type="file"]') && input.files.length) {
    input.closest(".sd-dropzone").querySelector("[data-file-names]").textContent = [...input.files].map((f) => f.name).join(" · ");
  }
});
