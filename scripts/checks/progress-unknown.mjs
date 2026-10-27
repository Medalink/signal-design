export const page = "feedback";

/** Unknown progress is a static, pending-toned full bar that becomes a value bar. */
export default async function checkProgressUnknown(page, where, fail) {
  const got = await page.evaluate(async () => {
    const bar = document.querySelector('.sd-progress[data-state="indeterminate"]');
    bar.scrollIntoView();
    const fill = () => getComputedStyle(bar, "::before");
    const probe = document.createElement("span");
    probe.style.color = "var(--sd-pending)";
    bar.append(probe);
    const pending = getComputedStyle(probe).color;
    probe.remove();
    const unknown = { laidOut: bar.clientWidth > 100, full: Math.abs(parseFloat(fill().width) - bar.clientWidth) <= 1, dashed: fill().borderTopStyle === "dashed", pending: fill().borderTopColor === pending, still: fill().animationName === "none" };
    bar.removeAttribute("data-state");
    bar.style.setProperty("--value", "30");
    const atValue = () => Math.abs(parseFloat(fill().width) - bar.clientWidth * 0.3) <= 1;
    for (const end = performance.now() + 2000; !atValue() && performance.now() < end; ) await new Promise((r) => setTimeout(r, 20));
    const known = { value: atValue(), plain: fill().borderTopWidth === "0px" };
    bar.dataset.state = "indeterminate";
    bar.style.removeProperty("--value");
    return { ...unknown, ...known };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} progress unknown`, key);
}
