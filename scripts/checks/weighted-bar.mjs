export const page = "charts";

/** A weighted bar sizes each segment by its share of the weights, outlines the current one and dashes the open one. */
export default async function checkWeightedBar(page, where, fail) {
  const got = await page.evaluate(() => {
    const bar = document.getElementById("demo-weighted");
    bar.scrollIntoView();
    const segments = [...bar.children];
    const weights = segments.map((s) => Number(getComputedStyle(s).getPropertyValue("--weight")));
    const widths = segments.map((s) => s.getBoundingClientRect().width);
    const gaps = (segments.length - 1) * parseFloat(getComputedStyle(bar).columnGap);
    const total = weights.reduce((a, b) => a + b, 0);
    const shares = widths.map((w, i) => Math.abs(w - ((bar.getBoundingClientRect().width - gaps) * weights[i]) / total));
    const style = (state) => getComputedStyle(bar.querySelector(`[data-state="${state}"]`));
    return {
      proportional: Math.max(...shares) <= 1,
      widths: widths.map(Math.round).join(),
      named: bar.getAttribute("role") === "img" && /41,200 of 80,000/.test(bar.getAttribute("aria-label") || ""),
      currentOutline: style("current").outlineStyle === "solid" && style("current").outlineWidth === "1px",
      openDashed: style("open").outlineStyle === "dashed" && style("open").backgroundColor === "rgba(0, 0, 0, 0)",
      fills: new Set(["drafted", "current", "planned"].map((state) => style(state).backgroundColor)).size === 3,
    };
  });
  const { widths, ...checks } = got;
  for (const [key, passed] of Object.entries(checks)) if (!passed) fail(`${where} weighted bar`, `${key} (widths ${widths})`);
}
