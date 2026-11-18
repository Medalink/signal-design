import { sweep } from "../../bin/rules.mjs";

export const page = "color";
/** data-sd-check-ignore exempts an element and its subtree from the rules it names, and only those. */
export default async function checkIgnore(page, where, fail) {
  await page.evaluate(() => {
    const box = 'style="width: 8px; height: 8px; border-radius: 6px !important"';
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="ignore-probe">
        <div id="probe-flagged" ${box}></div>
        <div id="probe-ignored" data-sd-check-ignore="corners" ${box}></div>
        <div id="probe-listed" data-sd-check-ignore="color corners" ${box}></div>
        <div id="probe-other-rule" data-sd-check-ignore="shadows" ${box}></div>
        <div data-sd-check-ignore="corners"><div id="probe-child" ${box}></div></div>
      </div>`,
    );
  });
  const found = await page.evaluate(sweep);
  await page.evaluate(() => document.getElementById("ignore-probe").remove());
  const flagged = (id) => found.some((f) => f.startsWith("corners:") && f.includes(`#${id}`));
  if (!flagged("probe-flagged")) fail(`${where} check-ignore`, "an element with no exemption was not flagged");
  if (!flagged("probe-other-rule")) fail(`${where} check-ignore`, "an exemption for another rule hid a rounded corner");
  for (const id of ["probe-ignored", "probe-listed", "probe-child"]) if (flagged(id)) fail(`${where} check-ignore`, `#${id} was flagged despite its exemption`);
}
