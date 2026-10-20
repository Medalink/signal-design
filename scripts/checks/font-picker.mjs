/** The font picker swaps the text face only, loads it first, and the last pick wins. */
export default async function checkFontPicker(page, where, fail) {
  const got = await page.evaluate(async () => {
    const root = document.documentElement;
    // WebKit drops the quotes around family names; compare without them.
    const family = (el) => getComputedStyle(el).fontFamily.replaceAll("\"", "");
    const code = document.querySelector("main code, .sd-shell-content code");
    const button = (name) => document.querySelector(`[data-sd-font="${name}"]`);
    const settled = () => new Promise((r) => setTimeout(r, 600));

    const defaultFamily = family(document.body);
    const codeBefore = family(code);
    const card = document.querySelector('.sd-card[data-font="leon-sans"]');
    const subtree = family(card.querySelector(".font-semibold"));

    button("leon-sans").click();
    await new Promise((r) => document.addEventListener("sd:font", r, { once: true }));
    await document.fonts.ready;
    const picked = {
      body: family(document.body),
      code: family(code),
      loaded: document.fonts.check('500 1em "Leon Sans"'),
      pressed: button("leon-sans").getAttribute("aria-pressed"),
      saved: localStorage.getItem("sd-font"),
    };

    button("source-code-pro").click();
    button("system").click();
    await settled();
    const raced = root.dataset.font;
    localStorage.removeItem("sd-font");

    return { defaultFamily, codeBefore, subtree, picked, raced };
  });

  const { defaultFamily, codeBefore, subtree, picked, raced } = got;
  if (!defaultFamily.startsWith("-apple-system")) fail(`${where} font picker`, `default text face is ${defaultFamily}`);
  if (!subtree.startsWith("Leon Sans")) fail(`${where} font picker`, `data-font subtree is ${subtree}`);
  if (!picked.body.startsWith("Leon Sans")) fail(`${where} font picker`, `picked leon-sans, body is ${picked.body}`);
  if (!picked.loaded) fail(`${where} font picker`, "Leon Sans 500 did not load");
  if (picked.code !== codeBefore) fail(`${where} font picker`, `code face changed to ${picked.code}`);
  if (picked.pressed !== "true" || picked.saved !== "leon-sans") fail(`${where} font picker`, `pressed ${picked.pressed}, saved ${picked.saved}`);
  if (raced !== "system") fail(`${where} font picker`, `last pick was system, page is ${raced}`);
}
