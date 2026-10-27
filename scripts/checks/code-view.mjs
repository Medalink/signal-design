export const page = "buttons";

/** A block's Code view shows its HTML in place of the preview, and Preview brings the preview back. */
export default async function checkCodeView(page, where, fail) {
  const buttons = page.locator("#components-buttons");
  await buttons.locator(".demo-head [data-view='code']").click();
  const view = await buttons.evaluate((b) => ({
    code: b.querySelector(".demo-code pre")?.textContent ?? "",
    preview: getComputedStyle(b.querySelector(".sd-actions")).display,
  }));
  if (!view.code.startsWith('<div class="sd-actions">') || view.preview !== "none") fail(where, `code view ${JSON.stringify({ start: view.code.slice(0, 30), preview: view.preview })}`);
  await buttons.locator(".demo-head [data-view='preview']").click();
}
