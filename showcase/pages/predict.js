import { mountLibrary } from "../library.js";

mountLibrary();

const out = (id, text) => (document.getElementById(id).textContent = text);
let predictedAt = 0;

document.getElementById("predict-field").addEventListener("sd:predict", (event) => {
  predictedAt = event.timeStamp;
  out("predict-name", event.target.textContent);
  out("predict-via", event.detail.via);
  out("predict-eta", event.detail.eta == null ? "now" : `${event.detail.eta} ms`);
  out("predict-lead", "waiting for a click");
});

document.getElementById("predict-field").addEventListener("click", (event) => {
  if (event.target.closest("[data-sd-predict]") && predictedAt) out("predict-lead", `${Math.round(event.timeStamp - predictedAt)} ms`);
});

document.getElementById("predict-parts").addEventListener("sd:predict", (event) => {
  out("parts-name", event.target.className || event.target.textContent.trim());
  out("parts-via", event.detail.via);
});

const list = document.getElementById("predict-fetched");
new MutationObserver(() => {
  const prefetched = [...document.head.querySelectorAll('link[rel="prefetch"]')].map((l) => new URL(l.href).pathname);
  const prerendered = [...document.head.querySelectorAll('script[type="speculationrules"]')].flatMap((s) => JSON.parse(s.textContent).prerender[0].urls.map((u) => `${new URL(u).pathname} (prerendered)`));
  const urls = [...prefetched, ...prerendered];
  if (urls.length) list.replaceChildren(...urls.map((u) => Object.assign(document.createElement("li"), { textContent: u })));
}).observe(document.head, { childList: true });
