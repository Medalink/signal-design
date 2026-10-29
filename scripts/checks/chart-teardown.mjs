import { fileURLToPath } from "node:url";

export const page = "charts";

const charts = fileURLToPath(new URL("../../src/js/charts/index.js", import.meta.url)).replace(/\\/g, "/");

/** A chart destroyed before its font loads (a page that swaps charts, or leaves) throws nothing afterwards. */
export default async function checkChartTeardown(page, where, fail) {
  const thrown = await page.evaluate(async (path) => {
    const { createChart } = await import(`/@fs/${path}`);
    const errors = [];
    const onRejection = (e) => errors.push(String(e.reason?.message ?? e.reason));
    const onError = (e) => errors.push(e.message);
    addEventListener("unhandledrejection", onRejection);
    addEventListener("error", onError);
    const now = Date.now();
    const points = Array.from({ length: 20 }, (_, i) => ({ x: now - (20 - i) * 1000, y: i }));
    for (const options of [
      { series: [{ label: "Down", data: points }] },
      { type: "line", series: [{ label: "Count", data: points }] },
    ]) {
      const host = document.createElement("div");
      host.style.cssText = "position:fixed;left:0;top:0;width:320px;height:160px";
      host.innerHTML = "<canvas></canvas>";
      document.body.append(host);
      try {
        const chart = createChart(host.querySelector("canvas"), options);
        chart.destroy();
      } catch (e) {
        errors.push(`create or destroy threw: ${e.message}`);
      }
      host.remove();
    }
    await document.fonts.ready;
    await new Promise((resolve) => setTimeout(resolve, 100));
    removeEventListener("unhandledrejection", onRejection);
    removeEventListener("error", onError);
    return errors;
  }, charts);
  for (const e of thrown) fail(`${where} chart teardown`, e);
}
