export const page = "overlays";

/** data-sd-open opens a dialog and data-sd-close closes it. */
export default async function checkDialog(page, where, fail) {
  await page.click('[data-sd-open="demo-dialog"]');
  if (!(await page.evaluate(() => document.getElementById("demo-dialog").open))) fail(where, "dialog did not open");
  await page.click("#demo-dialog [data-sd-close]");
  if (await page.evaluate(() => document.getElementById("demo-dialog").open)) fail(where, "dialog did not close");
}
