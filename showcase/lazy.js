/**
 * Showcase helper: build a chart only when it comes near the screen, so a
 * page with many charts doesn't pay for all of them at load.
 */
import { createChart } from "../src/js/charts/index.js";

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      e.target.makeChart?.();
    }
  },
  { rootMargin: "300px 0px" },
);

export function lazyChart(canvas, options, ready) {
  canvas.makeChart = () => {
    delete canvas.makeChart;
    const chart = createChart(canvas, options);
    ready?.(chart);
  };
  io.observe(canvas);
}
