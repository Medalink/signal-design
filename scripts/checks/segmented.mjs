export const page = "fields";

/** data-sd-seg presses the clicked option. */
export default async function checkSegmented(page, where, fail) {
  await page.click("#components-fields [data-sd-seg] button:nth-child(2)");
  const seg = await page.evaluate(() => document.querySelector("#components-fields [data-sd-seg] button:nth-child(2)").getAttribute("aria-pressed"));
  if (seg !== "true") fail(where, "segmented did not select");
}
