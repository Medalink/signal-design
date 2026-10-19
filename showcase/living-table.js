import { mountLivingTable } from "../src/js/index.js";

export function mountLivingTableDemo() {
  const root = document.getElementById("living-table-demo");
  const table = mountLivingTable(root);
  for (const button of document.getElementById("living-table-widths").querySelectorAll("[data-living-width]")) {
    button.addEventListener("click", () => {
      const value = button.dataset.livingWidth;
      table.resize({ width: value === "fluid" ? null : Number(value) });
    });
  }
}
