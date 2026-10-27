import { toast } from "../../src/js/index.js";
import { ICON_NAMES, icon } from "../../src/js/icons.js";
import { mountLibrary } from "../library.js";
import { mountLivingTableDemo } from "../living-table.js";

mountLibrary();
mountLivingTableDemo();

document.getElementById("icon-set").innerHTML = ICON_NAMES.map((name) => `<li>${icon(name)}<code>${name}</code></li>`).join("");

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
