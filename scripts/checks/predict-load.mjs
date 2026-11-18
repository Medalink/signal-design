export const page = "predict";
/** data-sd-prefetch adds one prefetch link once its target is predicted, not before. data-sd-prerender adds a speculation rule, or a prefetch where the engine cannot prerender. */
export default async function checkPredictLoad(page, where, fail) {
  const block = "#js-predict-prefetch";
  await page.locator(block).scrollIntoViewIfNeeded();
  const count = (name) =>
    page.evaluate((name) => {
      const prefetch = [...document.head.querySelectorAll('link[rel="prefetch"]')].filter((l) => l.href.endsWith(name)).length;
      const rule = [...document.head.querySelectorAll('script[type="speculationrules"]')].filter((s) => s.textContent.includes(name)).length;
      return { prefetch, rule };
    }, name);
  const wait = (name, key) => page.waitForFunction(([name, key]) => (key === "rule" ? [...document.head.querySelectorAll('script[type="speculationrules"]')].some((s) => s.textContent.includes(name)) : [...document.head.querySelectorAll('link[rel="prefetch"]')].some((l) => l.href.endsWith(name))), [name, key], { timeout: 2000 }).then(() => true, () => false);

  const before = await count("lib-charts.html");
  if (before.prefetch + before.rule) fail(`${where} predict load`, "a prefetch link exists before any prediction");

  await page.locator(`${block} a[data-sd-prefetch]`, { hasText: "Charts" }).hover();
  if (!(await wait("lib-charts.html", "prefetch"))) fail(`${where} predict load`, "hovering a data-sd-prefetch link added no prefetch link");
  await page.mouse.move(0, 0);
  await page.locator(`${block} a[data-sd-prefetch]`, { hasText: "Charts" }).hover();
  if ((await count("lib-charts.html")).prefetch !== 1) fail(`${where} predict load`, "a second hover prefetched the link again");
  const untouched = await count("lib-buttons.html");
  if (untouched.prefetch + untouched.rule) fail(`${where} predict load`, "a link nobody approached was prefetched");

  await page.locator(`${block} a[data-sd-prerender]`).hover();
  const rule = await wait("lib-type.html", "rule");
  const prefetched = rule || (await wait("lib-type.html", "prefetch"));
  if (!prefetched) fail(`${where} predict load`, "hovering a data-sd-prerender link added neither a speculation rule nor a prefetch");
  await page.mouse.move(0, 0);
}
