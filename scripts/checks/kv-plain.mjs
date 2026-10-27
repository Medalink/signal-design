export const page = "stats";
/** sd-kv keeps its small-caps keys; sd-kv-plain shows sentence case and truncates a long key inside the list. */
export default async function checkKvPlain(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("components-key-value-list-with-long-keys");
    block.scrollIntoView();
    const [caps, plain] = [...block.querySelectorAll(".sd-kv")];
    const capsKey = getComputedStyle(caps.querySelector("dt"));
    const key = plain.querySelector("dt");
    const style = getComputedStyle(key);
    const box = plain.getBoundingClientRect();
    const value = plain.querySelector("dd").getBoundingClientRect();
    return {
      capsKept: capsKey.textTransform === "uppercase",
      plainCase: style.textTransform === "none" && ["normal", "0px"].includes(style.letterSpacing),
      truncated: key.scrollWidth > key.clientWidth && style.textOverflow === "ellipsis",
      noOverflow: plain.scrollWidth <= plain.clientWidth,
      valueInside: value.right <= box.right + 0.5 && value.width > 40,
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} kv plain`, key);
}
