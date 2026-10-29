import { sweep } from "../../bin/rules.mjs";

export const page = "surfaces";

/** The flat-rule sweep fails a gradient used as a mask, the way it fails one used as a background, and lets a mask image through. */
export default async function checkFlatMasks(page, where, fail) {
  const found = await page.evaluate(
    (source) => {
      const run = new Function(`return (${source})()`);
      const sample = (style, extra = "") => {
        const el = document.createElement("div");
        el.setAttribute("style", style);
        el.innerHTML = extra;
        document.body.append(el);
        const result = run().filter((line) => line.includes("div"));
        el.remove();
        return result;
      };
      const svg = "url(&quot;data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'%3E%3Crect%20width='1'%20height='1'/%3E%3C/svg%3E&quot;)";
      return {
        linear: sample("width:40px;height:20px;background:#444;-webkit-mask-image:linear-gradient(to right,#000,transparent);mask-image:linear-gradient(to right,#000,transparent)"),
        radial: sample("width:40px;height:20px;background:#444;-webkit-mask-image:radial-gradient(#000,transparent);mask-image:radial-gradient(#000,transparent)"),
        image: sample(`width:40px;height:20px;background:#444;-webkit-mask-image:${svg};mask-image:${svg}`),
        background: sample("width:40px;height:20px;background-image:linear-gradient(#000,#fff)"),
        scene: sample("", `<div class="sd-scene-fade" style="width:40px;height:20px;background:#444;-webkit-mask-image:linear-gradient(90deg,#000,transparent);mask-image:linear-gradient(90deg,#000,transparent)"></div>`),
      };
    },
    sweep.toString(),
  );
  const says = (lines, text) => lines.some((line) => line.includes(text));
  if (!says(found.linear, "CSS gradient mask")) fail(`${where} flat masks`, `a linear-gradient mask passed the sweep: ${JSON.stringify(found.linear)}`);
  if (!says(found.radial, "CSS gradient mask")) fail(`${where} flat masks`, `a radial-gradient mask passed the sweep: ${JSON.stringify(found.radial)}`);
  if (found.image.length) fail(`${where} flat masks`, `a mask image was flagged: ${JSON.stringify(found.image)}`);
  if (!says(found.background, "CSS gradient (Signal is flat)")) fail(`${where} flat masks`, "a background gradient passed the sweep");
  if (found.scene.length) fail(`${where} flat masks`, `the stream scene fade layer was flagged: ${JSON.stringify(found.scene)}`);
}
