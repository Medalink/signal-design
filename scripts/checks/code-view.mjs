export const page = "buttons";

/** The toolbar's Code view shows a block's HTML in place of its preview, and Preview brings every preview back. */
export default async function checkCodeView(page, where, fail) {
  const buttons = page.locator("#components-buttons");
  await page.locator(".doc-preview-bar [data-code-all='code']").click();
  const view = await buttons.evaluate((b) => ({
    code: b.querySelector(".demo-code pre")?.textContent ?? "",
    preview: getComputedStyle(b.querySelector(".sd-actions")).display,
  }));
  if (!view.code.startsWith('<div class="sd-actions">') || view.preview !== "none") fail(where, `code view ${JSON.stringify({ start: view.code.slice(0, 30), preview: view.preview })}`);
  await page.locator(".doc-preview-bar [data-code-all='preview']").click();
}
