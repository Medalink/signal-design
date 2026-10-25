import { ICON_NAMES, icon } from "../../src/js/icons.js";

export const page = "components";

/** Every icon of the set is drawn inside the 24 grid's 4-unit inset with square caps, the same size, decorative until labeled. */
export default async function checkIcons(page, where, fail) {
  const got = await page.evaluate(() => {
    const cells = [...document.querySelectorAll("#icon-set > li")];
    const boxes = cells.map((cell) => {
      const svg = cell.querySelector("svg.sd-icon");
      const box = svg.querySelector("path").getBBox();
      const style = getComputedStyle(svg);
      return {
        name: cell.querySelector("code").textContent,
        attr: svg.dataset.icon,
        inside: box.x >= 3.5 && box.y >= 3.5 && box.x + box.width <= 20.5 && box.y + box.height <= 20.5,
        spans: Math.max(box.width, box.height) >= 7,
        bare: svg.getAttribute("aria-hidden") === "true" && !svg.hasAttribute("role"),
        caps: style.strokeLinecap === "square" && style.strokeLinejoin === "miter" && style.fill === "none",
        size: Math.round(svg.getBoundingClientRect().width * 10),
      };
    });
    return { names: boxes.map((b) => b.name), boxes };
  });
  const expected = ICON_NAMES.join();
  if (got.names.join() !== expected) fail(`${where} icons`, `the grid lists ${got.names.length} icons, ICON_NAMES has ${ICON_NAMES.length}`);
  for (const box of got.boxes) {
    for (const key of ["inside", "spans", "bare", "caps"]) if (!box[key]) fail(`${where} icons`, `${box.name}: ${key}`);
    if (box.attr !== box.name) fail(`${where} icons`, `${box.name}: data-icon is ${box.attr}`);
  }
  if (new Set(got.boxes.map((b) => b.size)).size !== 1) fail(`${where} icons`, "icons differ in size");
  if (!/role="img" aria-label="Undo &amp; redo"/.test(icon("undo", "Undo & redo"))) fail(`${where} icons`, "icon(name, label) is not an image with that name");
  try {
    icon("nope");
    fail(`${where} icons`, "icon() accepted a name that is not in the set");
  } catch (error) {
    if (!(error instanceof RangeError)) fail(`${where} icons`, `icon("nope") threw ${error}`);
  }
}
