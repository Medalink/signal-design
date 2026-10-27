import { mountLibrary } from "../library.js";

mountLibrary();

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* ---- Type scale ---------------------------------------------------------- */

const SCALE = [
  ["2xs", "labels, status lines"],
  ["xs", "nav, wordmark, kbd"],
  ["sm", "meta, hints"],
  ["base", "body"],
  ["md", "dense lead"],
  ["lg", "row outcome, lead"],
  ["xl", "page title"],
  ["2xl", "display on phones"],
  ["3xl", "display"],
  ["4xl", "landing"],
  ["5xl", "hero"],
];
document.querySelector("[data-type-scale]").innerHTML =
  `<thead><tr><th>Token</th><th class="sd-num">Size</th><th>Use</th><th>Sample</th></tr></thead><tbody>` +
  SCALE.map(([t, use]) => {
    const px = parseFloat(css(`--text-${t}`)) * 16;
    return `<tr><td><code>text-${t}</code></td><td class="sd-num">${px}px</td><td class="text-fg-subtle">${use}</td><td class="whitespace-nowrap" style="font-size:var(--text-${t});line-height:1.2">Signal</td></tr>`;
  }).join("") +
  `</tbody>`;
