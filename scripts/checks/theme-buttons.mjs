export const page = "color";

/** data-sd-theme switches and remembers the theme, and "light" still means paper. */
export default async function checkThemeButtons(page, where, fail) {
  await page.click('[data-sd-theme="paper"]');
  if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== "paper") fail(where, "theme button failed");
  await page.evaluate(() => {
    const b = document.createElement("button");
    b.dataset.sdTheme = "light";
    document.body.append(b);
    b.click();
    b.remove();
  });
  const aliased = await page.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem("sd-theme")].join(","));
  if (aliased !== "paper,paper") fail(where, `data-sd-theme="light" gave ${aliased}`);
}
