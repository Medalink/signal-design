import { colorRule } from "../../bin/rules.mjs";
import { probeRule } from "../rule-probe.mjs";

export const page = "color";

/** The color rule fails a color written by hand and lets tokens, tints of a token, a person's color and a themed subtree through. */
export default async function checkColorRule(page, where, fail) {
  const at = `${where} color rule`;
  const state = () => page.evaluate(() => ({
    theme: document.documentElement.getAttribute("data-theme"),
    styles: document.querySelectorAll("style").length,
    transitions: document.getAnimations().filter((animation) => animation instanceof CSSTransition).length,
  }));
  const before = await state();
  // A tint of a token written out by hand has the token's channels and a new alpha.
  const danger = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--sd-danger").trim());
  const box = (style, inner = "") => `<div class="rule-probe" style="width:20px;height:20px;${style}">${inner}</div>`;
  const found = await probeRule(page, colorRule, {
    background: box("background:#3b82f6"),
    oklch: box("background:oklch(0.6 0.2 30)"),
    text: `<p class="rule-probe" style="color:#ff00aa">text</p>`,
    border: box("border:2px solid #ee9900"),
    outline: box("outline:2px solid #00aa55"),
    token: box("background:var(--sd-fg);border:1px solid var(--sd-line)"),
    tint: box(`background:color-mix(in oklab, ${danger} 12%, transparent)`),
    tintSrgb: box(`background:color-mix(in srgb, ${danger} 40%, transparent)`),
    clear: box("background:transparent;border:2px solid transparent"),
    noBorder: box("border:0 solid #ee9900;outline:0 solid #00aa55;outline-style:none"),
    who: `<p class="rule-probe" style="--who:#12ab34;color:var(--who)">name</p>`,
    edge: box("--edge:#ab12cd;border-left:2px solid var(--edge)"),
    themed: `<div data-theme="paper">${box("background:#3b82f6")}</div>`,
    inherited: `<div style="color:#ff00aa"><p class="rule-probe">one</p><p class="rule-probe">two</p></div>`,
    parent: `<div class="rule-probe" style="color:#ff00aa"><p>one</p><p>two</p></div>`,
    silent: `<div data-sd-check-ignore="color">${box("background:#3b82f6")}</div>`,
    otherRule: `<div data-sd-check-ignore="type">${box("background:#3b82f6")}</div>`,
  });
  const says = (lines, text) => lines.some((line) => line.startsWith("color: ") && line.includes(text));
  if (!says(found.background, "div.rule-probe: background-color rgb(59, 130, 246) is the same in every theme (use a --sd-* token)")) fail(at, `a hard-coded background was not reported: ${JSON.stringify(found.background)}`);
  if (!found.oklch.length) fail(at, "a hard-coded oklch() background was not reported");
  if (!says(found.text, "p.rule-probe: color rgb(255, 0, 170)")) fail(at, `a hard-coded text color was not reported: ${JSON.stringify(found.text)}`);
  if (!says(found.border, "border-top-color rgb(238, 153, 0)")) fail(at, `a hard-coded border was not reported: ${JSON.stringify(found.border)}`);
  if (!says(found.outline, "outline-color rgb(0, 170, 85)")) fail(at, `a hard-coded outline was not reported: ${JSON.stringify(found.outline)}`);
  if (found.parent.length !== 1) fail(at, `a color set on a parent should be reported once, on the parent: ${JSON.stringify(found.parent)}`);
  for (const name of ["token", "tint", "tintSrgb", "clear", "noBorder", "who", "edge", "themed", "inherited", "silent"]) {
    if (found[name].length) fail(at, `${name} was reported: ${JSON.stringify(found[name])}`);
  }
  if (!says(found.otherRule, "background-color rgb(59, 130, 246)")) fail(at, 'data-sd-check-ignore="type" silenced the color rule');

  const after = await state();
  if (after.theme !== before.theme) fail(at, `the rule left data-theme at ${after.theme}, was ${before.theme}`);
  if (after.transitions > before.transitions) fail(at, `the rule left ${after.transitions - before.transitions} transition(s) running on the page`);
  if (after.styles !== before.styles) fail(at, `the rule left ${after.styles - before.styles} <style> element(s) on the page`);
}
