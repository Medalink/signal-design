import { toast } from "../../src/js/index.js";
import { mountLibrary } from "../library.js";
import { mountLivingTableDemo } from "../living-table.js";

mountLibrary();
mountLivingTableDemo();

for (const el of document.querySelectorAll("[data-cells]")) {
  const on = Number(el.dataset.on);
  for (let i = 0; i < Number(el.dataset.cells); i++) {
    const cell = document.createElement("i");
    if (i < on) cell.dataset.on = "";
    el.append(cell);
  }
}

document.addEventListener("click", (event) => {
  const t = event.target.closest("[data-demo-toast]");
  if (t) {
    toast(t.dataset.demoToast, {
      tone: t.dataset.demoTone,
      action: "demoUndo" in t.dataset ? { label: "Undo", onClick: () => toast("Undone") } : undefined,
    });
  }
});

document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches('.sd-dropzone input[type="file"]') && input.files.length) {
    input.closest(".sd-dropzone").querySelector("[data-file-names]").textContent = [...input.files].map((f) => f.name).join(" · ");
  }
});
