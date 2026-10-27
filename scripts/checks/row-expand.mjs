export const page = "rows";

/** data-sd-toggle opens a row's detail. */
export default async function checkRowExpand(page, where, fail) {
  await page.click('[data-sd-toggle="detail-21"]');
  await page.waitForFunction(() => document.getElementById("detail-21").getBoundingClientRect().height >= 100, null, { timeout: 2000 }).catch(() => {});
  const h = await page.evaluate(() => document.getElementById("detail-21").getBoundingClientRect().height);
  if (h < 100) fail(where, `expand did not open (height ${h})`);
}
