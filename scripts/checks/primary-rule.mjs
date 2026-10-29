import { primaryRule } from "../../bin/rules.mjs";
import { probeRule } from "../rule-probe.mjs";

export const page = "type";

/** The primary rule fails a second primary button in one view (the page, an open dialog, an open popover), and lets one per view through. */
export default async function checkPrimaryRule(page, where, fail) {
  const at = `${where} primary rule`;
  const own = await page.evaluate(() => [...document.querySelectorAll(".sd-btn-primary")].filter((el) => el.getClientRects().length).length);
  if (own) return fail(at, `this page has ${own} primary button(s) of its own, so the control cannot tell the page view apart; pick another page`);
  const one = (label = "Save") => `<button class="rule-probe sd-btn sd-btn-primary">${label}</button>`;
  const found = await probeRule(page, primaryRule, {
    pageTwo: one("Save") + one("Send"),
    pageOne: one(),
    pageGhost: one() + `<button class="rule-probe sd-btn sd-btn-ghost">Cancel</button><button class="rule-probe sd-btn">Other</button>`,
    dialogOwn: `<dialog open id="probe-a">${one("Delete")}</dialog>` + one("Save"),
    dialogTwo: `<dialog open id="probe-b" class="rule-probe">${one("Delete")}${one("Keep")}</dialog>`,
    dialogClosed: `<dialog id="probe-c">${one("Delete")}</dialog>` + one("Save"),
    popoverOwn: `<div popover="manual" class="rule-probe">${one("Apply")}</div>` + one("Save"),
    popoverTwo: `<div popover="manual" id="probe-d" class="rule-probe">${one("Apply")}${one("Reset")}</div>`,
    hidden: one() + `<button hidden class="rule-probe sd-btn sd-btn-primary">Hidden</button>`,
    silent: `<div data-sd-check-ignore="primary">${one("A")}${one("B")}</div>`,
    half: `<div data-sd-check-ignore="primary">${one("A")}</div>${one("B")}`,
    otherRule: `<div data-sd-check-ignore="type">${one("A")}${one("B")}</div>`,
  });
  const says = (lines, text) => lines.length === 1 && lines[0].startsWith("primary: ") && text.every((t) => lines[0].includes(t));
  if (!says(found.pageTwo, ["the page has 2 primary buttons (one per view)", '"Save"', '"Send"'])) fail(at, `two primary buttons on the page were not reported once, by name: ${JSON.stringify(found.pageTwo)}`);
  if (!says(found.dialogTwo, ["dialog#probe-b", "has 2 primary buttons", '"Delete"', '"Keep"'])) fail(at, `two primary buttons in an open dialog were not reported: ${JSON.stringify(found.dialogTwo)}`);
  if (!says(found.popoverTwo, ["div#probe-d", "has 2 primary buttons", '"Apply"', '"Reset"'])) fail(at, `two primary buttons in an open popover were not reported: ${JSON.stringify(found.popoverTwo)}`);
  for (const name of ["pageOne", "pageGhost", "dialogOwn", "dialogClosed", "popoverOwn", "hidden", "silent", "half"]) {
    if (found[name].length) fail(at, `${name} was reported: ${JSON.stringify(found[name])}`);
  }
  if (!says(found.otherRule, ["the page has 2 primary buttons"])) fail(at, 'data-sd-check-ignore="type" silenced the primary rule');
}
