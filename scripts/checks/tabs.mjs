export const page = "nav-bars";

/** Clicking a tab shows its panel and hides the others. */
export default async function checkTabs(page, where, fail) {
  await page.click("#t-checks");
  const tabs = await page.evaluate(() => [document.getElementById("tab-checks").hidden, document.getElementById("tab-proof").hidden]);
  if (tabs[0] || !tabs[1]) fail(where, "tabs did not switch");
}
