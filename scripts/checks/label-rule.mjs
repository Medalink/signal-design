import { labelRule } from "../../bin/rules.mjs";
import { probeRule } from "../rule-probe.mjs";

export const page = "fields";

/** The label rule fails a text field whose only name is its placeholder, and lets a label, an aria name, a title and the non-text inputs through. */
export default async function checkLabelRule(page, where, fail) {
  const at = `${where} label rule`;
  const found = await probeRule(page, labelRule, {
    input: `<input class="rule-probe" placeholder="Search tasks">`,
    email: `<input class="rule-probe" type="email" placeholder="you@example.com">`,
    textarea: `<textarea class="rule-probe" placeholder="Write a note"></textarea>`,
    emptyName: `<input class="rule-probe" placeholder="Name" aria-label="  ">`,
    forLabel: `<label for="probe-name">Name</label><input id="probe-name" class="rule-probe" placeholder="Jane Doe">`,
    wrapped: `<label>Name <input class="rule-probe" placeholder="Jane Doe"></label>`,
    ariaLabel: `<input class="rule-probe" placeholder="Search" aria-label="Search tasks">`,
    labelledby: `<span id="probe-title">Notes</span><textarea class="rule-probe" placeholder="Write a note" aria-labelledby="probe-title"></textarea>`,
    title: `<input class="rule-probe" placeholder="Search" title="Search tasks">`,
    noPlaceholder: `<input class="rule-probe">`,
    blankPlaceholder: `<input class="rule-probe" placeholder="  ">`,
    checkbox: `<input class="rule-probe" type="checkbox" placeholder="x">`,
    radio: `<input class="rule-probe" type="radio" placeholder="x">`,
    button: `<input class="rule-probe" type="submit" placeholder="x">`,
    hiddenInput: `<input class="rule-probe" type="hidden" placeholder="x">`,
    range: `<input class="rule-probe" type="range" placeholder="x">`,
    hiddenField: `<input class="rule-probe" placeholder="Search" hidden>`,
    silent: `<div data-sd-check-ignore="label"><input class="rule-probe" placeholder="Search"></div>`,
    otherRule: `<div data-sd-check-ignore="type"><input class="rule-probe" placeholder="Search"></div>`,
  });
  const says = (lines, text) => lines.length === 1 && lines[0].startsWith("label: ") && lines[0].includes(text);
  if (!says(found.input, 'input.rule-probe: the placeholder "Search tasks" is the only name')) fail(at, `an input named only by its placeholder was not reported once: ${JSON.stringify(found.input)}`);
  if (!says(found.email, 'the placeholder "you@example.com"')) fail(at, `an email input named only by its placeholder was not reported: ${JSON.stringify(found.email)}`);
  if (!says(found.textarea, 'textarea.rule-probe: the placeholder "Write a note"')) fail(at, `a textarea named only by its placeholder was not reported: ${JSON.stringify(found.textarea)}`);
  if (!says(found.emptyName, 'the placeholder "Name"')) fail(at, `a blank aria-label counted as a name: ${JSON.stringify(found.emptyName)}`);
  for (const name of ["forLabel", "wrapped", "ariaLabel", "labelledby", "title", "noPlaceholder", "blankPlaceholder", "checkbox", "radio", "button", "hiddenInput", "range", "hiddenField", "silent"]) {
    if (found[name].length) fail(at, `${name} was reported: ${JSON.stringify(found[name])}`);
  }
  if (!says(found.otherRule, 'the placeholder "Search"')) fail(at, 'data-sd-check-ignore="type" silenced the label rule');
}
