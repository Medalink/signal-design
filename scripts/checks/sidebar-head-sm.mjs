export const page = "effects";
/** sd-sidebar-head-sm: a smaller title step, so "Direct Messages" and an action fit a 240px sidebar head. */
export default async function checkSidebarHeadSm(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("effects-sidebar-head-sizes");
    block.scrollIntoView();
    const title = (id) => document.querySelector(`#${id} .sd-sidebar-title`);
    const fits = (el) => el.scrollWidth <= el.clientWidth;
    const small = title("demo-head-sm");
    return {
      defaultSize: getComputedStyle(title("demo-head-default")).fontSize === "18px",
      smallSize: getComputedStyle(small).fontSize === "16px",
      smallFits: fits(small),
      actionInside: document.querySelector("#demo-head-sm .sd-btn").getBoundingClientRect().right <= document.getElementById("demo-head-sm").getBoundingClientRect().right,
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} sidebar head sm`, key);
}
