export const page = "layout";
/** Panels: the default stays at 560px; -wide caps at 1024px; -fluid has no cap and fills its parent. */
export default async function checkPanelWidths(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("components-panel-widths");
    block.scrollIntoView();
    const [narrow, wide, fluid] = [...block.querySelectorAll(".sd-panel")];
    const cap = (el) => getComputedStyle(el).maxWidth;
    return {
      narrow: cap(narrow) === "560px",
      wide: cap(wide) === "1024px",
      fluid: cap(fluid) === "none" && Math.abs(fluid.getBoundingClientRect().width - block.getBoundingClientRect().width) < 1,
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} panel widths`, key);
}
