import { toast } from "../src/js/index.js";

/** Buttons with data-demo-toast show a toast; data-demo-undo adds an Undo action. */
export function mountToastDemo() {
  document.addEventListener("click", (event) => {
    const t = event.target.closest("[data-demo-toast]");
    if (t) {
      toast(t.dataset.demoToast, {
        tone: t.dataset.demoTone,
        action: "demoUndo" in t.dataset ? { label: "Undo", onClick: () => toast("Undone") } : undefined,
      });
    }
  });
}
