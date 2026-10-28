export const page = "charts";

/**
 * The words Signal's JS writes, and a chart's dates, can be replaced and keep
 * their English defaults. The modules are imported by the URL the page itself
 * loaded, so the table checked here is the one the page's listeners read.
 */
export default async function checkLabels(page, where, fail) {
  const labelsUrl = await page.evaluate(() => performance.getEntriesByType("resource").map((e) => e.name).find((n) => /\/src\/js\/labels\.js/.test(n)));
  if (!labelsUrl) return fail(where, "the page did not load src/js/labels.js");
  const urls = { labels: labelsUrl, index: labelsUrl.replace("labels.js", "index.js"), charts: labelsUrl.replace("labels.js", "charts/index.js") };

  const vanilla = await page.evaluate(async (urls) => {
    const errors = [];
    const is = (got, want, what) => got !== want && errors.push(`${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    const { DEFAULT_LABELS, getLabel } = await import(urls.labels);

    // The English defaults, written out so a change to the table shows here.
    const english = {
      "copy.done": "Copied", "copy.failed": "Copy unavailable. Select the line instead.", "list.empty": "No matches",
      "table.resize": "Resize table width", "shell.pin": "Pin sidebar open", "shell.collapse": "Collapse sidebar",
      "window.maximize": "Maximize", "window.restore": "Restore", "stream.follow.label": "New follower", "stream.bits.detail": "Thanks for the bits",
    };
    for (const [key, want] of Object.entries(english)) is(getLabel(key), want, `default ${key}`);
    is(getLabel("tags.remove", { value: "x" }), "Remove x", "default tags.remove");
    is(getLabel("fps.value", { value: 60 }), "60 frames per second", "default fps.value");
    is(getLabel("table.width", { value: 480 }), "480 pixels wide", "default table.width");
    is(Object.isFrozen(DEFAULT_LABELS), true, "DEFAULT_LABELS is read-only");

    // The tags remove button, written when a chip is added.
    const tags = document.createElement("div");
    tags.className = "sd-tags";
    tags.dataset.sdTags = "";
    tags.innerHTML = "<input>";
    document.body.append(tags);
    window.labelsProbe = { tags };
    return errors;
  }, urls);
  for (const error of vanilla) fail(where, error);

  const addTag = async (text) => {
    await page.locator(".sd-tags[data-sd-tags] input").last().focus();
    await page.keyboard.type(text);
    await page.keyboard.press("Enter");
  };
  const removeLabels = () => page.evaluate(() => [...window.labelsProbe.tags.querySelectorAll(".sd-chip button")].map((b) => b.getAttribute("aria-label")));
  await addTag("alpha");
  if ((await removeLabels()).join() !== "Remove alpha") fail(where, `a new tag's remove button reads ${(await removeLabels()).join()} by default`);

  const overridden = await page.evaluate(async (urls) => {
    const errors = [];
    const is = (got, want, what) => got !== want && errors.push(`${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    const { getLabel, setLabels } = await import(urls.labels);
    const { drawSpark, mountCountdown } = await import(urls.index);
    const countdown = (state) => {
      const root = document.createElement("div");
      root.innerHTML = '<span data-sd-countdown-value></span><div class="sd-progress" role="progressbar"></div>';
      document.body.append(root);
      const timer = mountCountdown(root);
      timer.set(state);
      const text = root.querySelector('[role="progressbar"]').getAttribute("aria-valuetext");
      timer.dispose();
      root.remove();
      return text;
    };
    const spark = (own) => {
      const el = document.createElement("span");
      el.className = "sd-spark";
      el.dataset.values = "1 2 3";
      if (own) el.setAttribute("aria-label", own);
      document.body.append(el);
      drawSpark(el);
      const label = el.getAttribute("aria-label");
      el.remove();
      return label;
    };

    is(spark(), "Trend: 1, 2, 3", "default spark.trend");
    is(countdown({ remainingMs: 1000, running: false }), "1 second remaining, paused", "default countdown, one second");
    is(countdown({ remainingMs: 3000, running: false }), "3 seconds remaining, paused", "default countdown, three seconds");

    setLabels({
      "tags.remove": "{value} entfernen",
      "spark.trend": "Verlauf: {values}",
      "countdown.paused": "angehalten",
      "countdown.remaining": ({ count, state }) => `noch ${count} s, ${state}`,
    });
    is(getLabel("tags.remove", { value: "b" }), "b entfernen", "override tags.remove");
    is(spark(), "Verlauf: 1, 2, 3", "override spark.trend");
    is(spark("Mine"), "Mine", "an aria-label already on the element wins over spark.trend");
    is(countdown({ remainingMs: 3000, running: false }), "noch 3 s, angehalten", "override countdown with a function and a state word");
    let thrown = "";
    try { setLabels({ "no.such.key": "x" }); } catch (error) { thrown = error.name; }
    is(thrown, "RangeError", "an unknown label key throws");
    return errors;
  }, urls);
  for (const error of overridden) fail(where, error);

  await addTag("beta");
  const after = await removeLabels();
  if (after.join() !== "Remove alpha,beta entfernen") fail(where, `after an override the next tag's remove button reads ${after.join()}`);

  // Copy toast through the page's own listener.
  const copy = async () => {
    await page.evaluate(() => {
      document.querySelector(".sd-toaster")?.replaceChildren();
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.resolve() } });
      const button = document.createElement("button");
      button.id = "labels-copy";
      button.dataset.sdCopy = "text";
      document.body.append(button);
    });
    await page.locator("#labels-copy").click();
    await page.waitForFunction(() => document.querySelector(".sd-toaster .sd-toast"), null, { timeout: 2000 });
    const text = await page.evaluate(() => document.querySelector(".sd-toaster .sd-toast").textContent.trim());
    await page.evaluate(() => document.getElementById("labels-copy").remove());
    return text;
  };
  await page.evaluate(async (urls) => (await import(urls.labels)).setLabels({ "copy.done": "Kopiert" }), urls);
  const copied = await copy();
  if (copied !== "Kopiert") fail(where, `the copy toast reads ${JSON.stringify(copied)} after copy.done was set`);
  await page.evaluate(async (urls) => {
    (await import(urls.labels)).setLabels({ "copy.done": undefined, "tags.remove": undefined, "spark.trend": undefined, "countdown.paused": undefined, "countdown.remaining": undefined });
  }, urls);
  const restored = await copy();
  if (restored !== "Copied") fail(where, `the copy toast reads ${JSON.stringify(restored)} after copy.done was set back to undefined`);
  await page.evaluate(() => { window.labelsProbe.tags.remove(); document.querySelector(".sd-toaster")?.replaceChildren(); });

  // Charts: month names follow the locale; English is what it was.
  const charts = await page.evaluate(async (urls) => {
    const errors = [];
    const is = (got, want, what) => JSON.stringify(got) !== JSON.stringify(want) && errors.push(`${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    const { createChart, setChartDefaults, formatTime, DEFAULT_CHART_TEXT } = await import(urls.charts);

    const start = new Date(2024, 2, 1).getTime();
    const end = new Date(2024, 9, 31).getTime();
    const data = [];
    for (let x = start; x <= end; x += 5 * 864e5) data.push({ x, y: 100 + ((x - start) / 864e5) % 40 });
    const ticksOf = (options) => {
      const figure = document.createElement("figure");
      figure.className = "sd-chart";
      figure.style.cssText = "--h: 220px; width: 900px";
      figure.innerHTML = '<div class="sd-chart-plot"><canvas role="img" aria-label="Locale probe"></canvas></div>';
      document.body.append(figure);
      const api = createChart(figure.querySelector("canvas"), { series: [{ label: "Core ↓", data }], xMin: start, xMax: end, legend: false, ...options });
      api.chart.update("none");
      const ticks = api.chart.scales.x.ticks.map((t) => ({ label: t.label, value: t.value }));
      const title = api.chart.options.plugins.tooltip.callbacks.title([{ raw: { x: new Date(2024, 2, 5, 15, 7, 9).getTime() } }]);
      api.destroy();
      figure.remove();
      return { ticks, title };
    };
    const month = (locale, value) => `${new Date(value).toLocaleString(locale, { month: "short" })} ${new Date(value).getDate()}`;

    const en = ticksOf({});
    if (!en.ticks.length) errors.push("the default chart has no x ticks");
    is(en.ticks.map((t) => t.label), en.ticks.map((t) => month("en", t.value)), "default chart tick labels are English");
    is(en.title, "Mar 5, 3:07:09 → 3:07:19 · 10s bucket", "default tooltip title");

    const de = ticksOf({ locale: "de" });
    is(de.ticks.map((t) => t.label), de.ticks.map((t) => month("de", t.value)), "locale de tick labels");
    if (de.ticks.every((t, i) => t.label === en.ticks[i]?.label)) errors.push("locale de left every tick label as in English");
    is(de.title, `${formatTime(new Date(2024, 2, 5, 15, 7, 9).getTime(), "MMM d, HH:mm:ss", "de")} → 15:07:19 · 10s bucket`, "locale de tooltip title");
    is(formatTime(new Date(2024, 9, 5, 15, 7).getTime(), "MMM d, h:mm a", "en"), "Oct 5, 3:07 pm", "formatTime en");
    is(formatTime(new Date(2024, 9, 5, 15, 7).getTime(), "MMM d, h:mm a", "de"), `${new Date(2024, 9, 5).toLocaleString("de", { month: "short" })} 5, 15:07`, "formatTime de");

    const custom = ticksOf({ locale: "de", text: { bucket: "{seconds}s Intervall" } });
    if (!custom.title.endsWith("· 10s Intervall")) errors.push(`text.bucket did not apply: ${custom.title}`);

    setChartDefaults({ locale: "de" });
    is(ticksOf({}).ticks.map((t) => t.label), de.ticks.map((t) => t.label), "setChartDefaults locale reaches a chart with no locale of its own");
    is(ticksOf({ locale: "en" }).ticks.map((t) => t.label), en.ticks.map((t) => t.label), "a chart's own locale beats the default");
    setChartDefaults({ locale: undefined, text: { total: "Gesamt {value}" } });
    is(ticksOf({}).ticks.map((t) => t.label), en.ticks.map((t) => t.label), "locale: undefined restores English");
    setChartDefaults({ text: { total: undefined } });
    let thrown = "";
    try { setChartDefaults({ text: { nope: "x" } }); } catch (error) { thrown = error.name; }
    is(thrown, "RangeError", "an unknown chart text key throws");
    is(DEFAULT_CHART_TEXT.forecast, "FORECAST", "default forecast text");
    return errors;
  }, urls);
  for (const error of charts) fail(where, error);

  // The one word the stylesheet draws: the muted mark on a call tile.
  const tile = await page.evaluate(() => {
    const el = document.createElement("div");
    el.className = "sd-tile";
    el.dataset.muted = "";
    el.innerHTML = '<span class="sd-tile-name">x</span>';
    document.body.append(el);
    const name = el.querySelector(".sd-tile-name");
    const read = () => getComputedStyle(name, "::after").content;
    const english = read();
    el.style.setProperty("--sd-tile-muted-label", '"stumm"');
    const german = read();
    el.remove();
    return { english, german };
  });
  if (tile.english !== '"muted"') fail(where, `tile muted label default: got ${tile.english}`);
  if (tile.german !== '"stumm"') fail(where, `--sd-tile-muted-label did not apply: got ${tile.german}`);
}
