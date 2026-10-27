import { mountLibrary } from "../library.js";

mountLibrary();

document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches('.sd-dropzone input[type="file"]') && input.files.length) {
    input.closest(".sd-dropzone").querySelector("[data-file-names]").textContent = [...input.files].map((f) => f.name).join(" · ");
  }
});
