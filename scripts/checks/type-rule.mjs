import { typeRule } from "../../bin/rules.mjs";
import { probeRule } from "../rule-probe.mjs";

export const page = "type";

/** The type rule fails a weight outside 400 and 500 and a family that is not a Signal token, and lets Signal's own text through. */
export default async function checkTypeRule(page, where, fail) {
  const at = `${where} type rule`;
  const probe = (extra, tag = "p", inner = "text") => `<${tag} class="rule-probe" style="${extra}">${inner}</${tag}>`;
  const found = await probeRule(page, typeRule, {
    bold: probe("font-weight:700", "h2"),
    semibold: probe("font-weight:600"),
    family: probe("font-family:Inter, sans-serif"),
    field: probe("font-weight:700", "input", ""),
    button: probe("font-family:Courier", "button"),
    both: probe("font-weight:700;font-family:Inter, sans-serif"),
    regular: probe("font-weight:400"),
    medium: probe("font-weight:500"),
    sans: probe("font-family:var(--sd-font-sans)"),
    mono: probe("font-family:var(--sd-font-mono)"),
    reading: probe("font-family:var(--sd-font-reading);font-weight:600"),
    readingBold: probe("font-family:var(--sd-font-reading);font-weight:700"),
    face: `<div data-font="leon-sans">${probe("font-family:var(--sd-font-sans)")}</div>`,
    graphic: `<svg><text class="rule-probe" style="font-weight:700;font-family:Inter">s</text></svg>`,
    silent: `<div data-sd-check-ignore="type">${probe("font-weight:700;font-family:Inter")}</div>`,
    otherRule: `<div data-sd-check-ignore="color">${probe("font-weight:700")}</div>`,
  });
  const says = (lines, text) => lines.some((line) => line.startsWith("type: ") && line.includes(text));
  if (!says(found.bold, "h2.rule-probe: font-weight 700 (Signal uses 400 and 500)")) fail(at, `a bold heading was not reported: ${JSON.stringify(found.bold)}`);
  if (!says(found.semibold, "font-weight 600")) fail(at, `weight 600 in the text face was not reported: ${JSON.stringify(found.semibold)}`);
  if (!says(found.family, 'font-family "Inter" (set it with font-sans or font-mono)')) fail(at, `a family named directly was not reported: ${JSON.stringify(found.family)}`);
  if (!says(found.field, "input.rule-probe: font-weight 700")) fail(at, `a bold input was not reported: ${JSON.stringify(found.field)}`);
  if (!says(found.button, 'font-family "Courier"')) fail(at, `a button in another family was not reported: ${JSON.stringify(found.button)}`);
  if (found.both.length !== 2) fail(at, `a bold text in another family should give two findings: ${JSON.stringify(found.both)}`);
  if (!says(found.readingBold, "font-weight 700")) fail(at, `weight 700 in the reading face was not reported: ${JSON.stringify(found.readingBold)}`);
  for (const name of ["regular", "medium", "sans", "mono", "reading", "face", "graphic", "silent"]) {
    if (found[name].length) fail(at, `${name} was reported: ${JSON.stringify(found[name])}`);
  }
  if (!says(found.otherRule, "font-weight 700")) fail(at, 'data-sd-check-ignore="color" silenced the type rule');
}
