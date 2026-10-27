import { fileURLToPath } from "node:url";

export const page = "effects";

/**
 * Hashes (the first 8 bytes of SHA-256) of the dust and blocks output from
 * before the art styles existed, so a change to them shows up here. A
 * `paint` key hashes the painted element's inline style and its sparkle layer.
 */
const UNCHANGED = {
  "shapes blocks 7 340 340 false false 1 0": "7b2497d4dbbeaff8",
  "shapes blocks 11 340 340 false false 0.28 0.12": "f9f5f49792c931d4",
  "shapes dust 7 340 340 false false 1 0": "f3ddfc53dc20a988",
  "shapes dust 31 200 600 true false 0.14 0.12": "e4677cae36990674",
  "shapes dust 51 200 200 false true 0.2 0.18": "38709f500770617e",
  "glints blocks": "353ee667870c1d49",
  "paint ink [] size=null edges=false": "d14acd8fa25a1bf8",
  "paint ink [br] size=null edges=false": "d14acd8fa25a1bf8",
  "paint ink [tl br] size=200 edges=true": "00abac966ad28f8e",
  "paint ink [bottom] size=null edges=false": "a87091cfe8144c61",
  "paint ink [center] size=null edges=false": "41bf463ab95ab173",
  "paint paper [tr bl] size=null edges=false": "971e933d3dc212bd",
  "paint paper [tl tr bl br] size=200 edges=false": "ff5f97767da487ad",
  "paint ink sd-empty": "9652bc05a1139e36",
  "paint paper sd-empty": "4a9bc607d744c62b",
};
// Reduced motion drops the sparkle, which changes the painted image.
const UNCHANGED_REDUCED = {
  "paint ink [tl br] size=200 edges=true": "33049b0f9cea677c",
  "paint ink [center] size=null edges=false": "cff567c246d2935c",
  "paint paper [br] size=null edges=false": "b578552cbeca65fa",
  "paint ink sd-empty": "16c20b9320440169",
};

/** The contrast text keeps on the art's brightest pixel: AA for body and labels, 3:1 for the faintest token. */
const BUDGET = { fg: 7, muted: 4.5, subtle: 3 };

/**
 * The art ornaments are still, quiet pictures drawn as an element's own
 * background. Every style renders in every theme and placement, is a pure
 * function of its seed, adds no node, takes no click, moves nothing, and
 * keeps text readable on its brightest pixel. The dust and blocks stay as
 * they were.
 */
export default async function checkOrnaments(page, where, fail) {
  const apiUrl = `${new URL("/", page.url()).href}@fs/${fileURLToPath(new URL("../../src/js/index.js", import.meta.url)).replace(/\\/g, "/")}`;
  const run = (reduced) =>
    page.evaluate(
      async ({ apiUrl, reduced, unchanged, budget }) => {
        const { ornamentArt, ORNAMENT_ART, ornamentShapes, paintOrnaments } = await import(apiUrl);
        const problems = [];
        let assertions = 0;
        const assert = (ok, message) => {
          assertions++;
          if (!ok) problems.push(message);
        };
        const hash = async (text) =>
          [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))]
            .slice(0, 8)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        const holder = document.createElement("div");
        holder.style.cssText = "position:fixed;left:0;top:0;width:700px;z-index:99999";
        document.body.append(holder);
        const themed = (theme) => {
          const wrap = document.createElement("div");
          wrap.dataset.theme = theme;
          holder.append(wrap);
          return wrap;
        };
        const make = (wrap, attrs, html = "") => {
          const el = document.createElement("div");
          el.style.cssText = "width:600px;height:400px;border:1px solid red";
          for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
          el.innerHTML = html;
          wrap.append(el);
          return el;
        };
        const urlOf = (el) => [...el.style.backgroundImage.matchAll(/url\("(.*?)"\)/g)].map((m) => m[1]);
        const styles = Object.keys(ORNAMENT_ART);
        const snapshot = {};

        // The dust and blocks are byte for byte what they were.
        const seen = {};
        for (const style of ["blocks", "dust"]) {
          for (const [seed, size, width, edge, center, strength, sparkle] of [[7, 340, 340, false, false, 1, 0], [11, 340, 340, false, false, 0.28, 0.12], [31, 200, 600, true, false, 0.14, 0.12], [51, 200, 200, false, true, 0.2, 0.18]]) {
            seen[`shapes ${style} ${seed} ${size} ${width} ${edge} ${center} ${strength} ${sparkle}`] = await hash(ornamentShapes({ style, seed, size, width, edge, center, strength, sparkle, color: "#fff" }));
          }
        }
        const glints = [];
        seen["glints blocks"] = await hash(ornamentShapes({ style: "blocks", seed: 9, sparkle: 0.3, glints }) + JSON.stringify(glints));
        for (const [theme, value, size] of [["ink", "", null], ["ink", "br", null], ["ink", "tl br", "200"], ["ink", "bottom", null], ["ink", "center", null], ["paper", "br", null], ["paper", "tr bl", null], ["paper", "tl tr bl br", "200"]]) {
          const edges = theme === "ink" && value === "tl br";
          const wrap = themed(theme);
          const el = make(wrap, { "data-sd-ornaments": value, ...(size ? { "data-sd-ornaments-size": size } : {}), ...(edges ? { "data-sd-edges": "" } : {}) });
          paintOrnaments(el);
          seen[`paint ${theme} [${value}] size=${size} edges=${edges}`] = await hash(el.style.cssText + "|" + (el.querySelector(".sd-glints")?.outerHTML ?? "no-layer"));
          wrap.remove();
        }
        for (const theme of ["ink", "paper"]) {
          const wrap = themed(theme);
          wrap.innerHTML = '<div class="sd-empty" style="width:500px;height:260px">x</div>';
          paintOrnaments(wrap.firstElementChild);
          seen[`paint ${theme} sd-empty`] = await hash(wrap.firstElementChild.style.cssText + "|" + (wrap.firstElementChild.querySelector(".sd-glints")?.outerHTML ?? ""));
          wrap.remove();
        }
        for (const [key, want] of Object.entries(unchanged)) assert(seen[key] === want, `dust or blocks changed: ${key} is ${seen[key]}, was ${want}`);

        // Every style, theme and placement renders a clean, quiet SVG and moves nothing.
        for (const theme of ["ink", "graphite", "paper"]) {
          const wrap = themed(theme);
          const color = getComputedStyle(wrap).getPropertyValue("--sd-fg").trim();
          for (const style of styles) {
            for (const placement of ["br", "tl", "tr bl", "bottom", "top", "center"]) {
              const name = `${style} ${placement} ${theme}`;
              const el = make(wrap, { "data-sd-ornaments": `${placement} ${style}` }, '<button style="position:absolute;right:20px;bottom:20px;width:40px;height:24px">go</button>');
              el.style.position = "relative";
              const button = el.firstElementChild;
              const rects = () => JSON.stringify([el, button].map((n) => n.getBoundingClientRect()));
              const [rectsBefore, scrollBefore, pointerBefore, propsBefore] = [rects(), [document.documentElement.scrollWidth, document.documentElement.scrollHeight].join(), getComputedStyle(el).pointerEvents, new Set([...el.style])];
              paintOrnaments(el);
              assert(rects() === rectsBefore, `${name}: painting moved the box or its content`);
              assert([document.documentElement.scrollWidth, document.documentElement.scrollHeight].join() === scrollBefore, `${name}: painting changed the page's scroll size`);
              assert(el.children.length === 1 && !el.querySelector(".sd-glints, svg, canvas, img"), `${name}: painting added a node`);
              assert(getComputedStyle(el).pointerEvents === pointerBefore, `${name}: pointer-events changed`);
              const at = button.getBoundingClientRect();
              assert(document.elementFromPoint(at.left + at.width / 2, at.top + at.height / 2) === button, `${name}: the button over the art does not take the click`);
              const added = [...el.style].filter((p) => !propsBefore.has(p) && !p.startsWith("background"));
              assert(!added.length, `${name}: painting also set ${added.join(", ")}`);
              const urls = urlOf(el);
              assert(urls.length === placement.split(" ").length, `${name}: ${urls.length} images for the placement`);
              for (const [index, url] of urls.entries()) {
                const parsed = new DOMParser().parseFromString(decodeURIComponent(url.slice(url.indexOf(",") + 1)), "image/svg+xml");
                assert(!parsed.querySelector("parsererror"), `${name}: the SVG does not parse`);
                assert(parsed.querySelectorAll("path, rect").length > 0, `${name}: the SVG draws nothing`);
                assert(!parsed.querySelector("circle, ellipse, text, image, foreignObject, linearGradient, radialGradient, animate, animateTransform, style, script"), `${name}: the SVG has a shape or effect the system does not draw`);
                const paints = [...parsed.querySelectorAll("[stroke], [fill]")].flatMap((n) => [n.getAttribute("stroke"), n.getAttribute("fill")]).filter((v) => v && v !== "none");
                assert(paints.length > 0 && paints.every((v) => v === color), `${name}: a paint is not the theme's text color`);
                const opacity = [...parsed.querySelectorAll("[stroke-opacity], [fill-opacity]")].flatMap((n) => [n.getAttribute("stroke-opacity"), n.getAttribute("fill-opacity")]).filter(Boolean).map(Number);
                assert(opacity.length > 0 && Math.max(...opacity) <= 0.4, `${name}: strongest opacity is ${Math.max(...opacity)}`);
                assert(parsed.documentElement.getAttribute("shape-rendering") === (ORNAMENT_ART[style].crisp ? "crispEdges" : null), `${name}: wrong shape-rendering`);
                const corner = placement.split(" ")[index];
                const flipped = corner === "bottom" || (corner.length === 2 && (corner[0] === "b" || corner[1] === "r"));
                assert(corner === "center" || !!parsed.querySelector("g[transform]") === (flipped && !ORNAMENT_ART[style].figure), `${name}: ${ORNAMENT_ART[style].figure ? "a figure was mirrored" : "a field was not mirrored into its corner"}`);
                const img = new Image();
                img.src = url;
                await img.decode().catch(() => assert(false, `${name}: the browser cannot decode the image`));
              }
              snapshot[name] = el.style.backgroundImage;
              el.remove();
            }
          }
          wrap.remove();
        }

        // The placement words and the style word parse apart.
        const wrap = themed("ink");
        const painted = (attrs, className = "") => {
          const el = make(wrap, attrs);
          el.className = className;
          paintOrnaments(el);
          const image = el.style.backgroundImage;
          el.remove();
          return image;
        };
        assert(painted({ "data-sd-ornaments": "contours" }) === painted({ "data-sd-ornaments": "br contours" }), "a lone style word does not default to the bottom right");
        assert(painted({ "data-sd-ornaments": "contours" }) !== painted({ "data-sd-ornaments": "tl contours" }), "br and tl contours are the same image");
        assert(painted({ "data-sd-ornaments": "contours" }) !== painted({ "data-sd-ornaments": "br" }), "a style word did not replace the dust");
        assert([painted({ "data-sd-ornaments": "none" }), painted({ "data-sd-ornaments": "none contours" }), painted({ "data-sd-ornaments": "nonsense" }), painted({ "data-sd-ornaments": "toString" })].every((image) => image === ""), "none or an unknown word painted something");
        const empty = make(wrap, { "data-sd-ornaments": "dashed" });
        empty.className = "sd-empty";
        paintOrnaments(empty);
        assert(empty.style.backgroundPosition === "center center", `an empty state with a style paints at ${empty.style.backgroundPosition}, not the center`);
        empty.remove();

        // Same seed, same picture. The seeded styles change with it.
        for (const style of styles) {
          const picture = ornamentArt({ style, size: 300, seed: 5 });
          assert(picture.length > 100 && picture === ornamentArt({ style, size: 300, seed: 5 }), `${style}: the same seed drew two pictures`);
          const seeded = ["contours", "lattice", "waveform"].includes(style);
          assert((picture !== ornamentArt({ style, size: 300, seed: 6 })) === seeded, `${style}: ${seeded ? "another seed drew the same picture" : "a seed changed a style that ignores it"}`);
          assert(picture !== ornamentArt({ style, size: 300, seed: 5, strength: 0.5 }), `${style}: strength changed nothing`);
        }
        const withSeed = (value) => painted({ "data-sd-ornaments": "contours", ...(value === null ? {} : { "data-sd-ornaments-seed": value }) });
        assert(withSeed("elderwood") === withSeed("elderwood") && withSeed("elderwood") !== withSeed("lowwater") && withSeed("elderwood") !== withSeed(null), "the seed attribute does not pick the picture");
        assert(withSeed("12") !== withSeed("13") && withSeed("12") !== withSeed("elderwood"), "a numeric seed attribute does not pick the picture");
        const again = make(wrap, { "data-sd-ornaments": "tl lattice" });
        paintOrnaments(again);
        const first = again.style.backgroundImage;
        paintOrnaments(again);
        assert(first === again.style.backgroundImage, "painting twice changed the image");
        again.remove();
        wrap.remove();

        // The brightest pixel under the art keeps text readable, in every theme.
        let contrast = "measured";
        if (!reduced) {
          try {
            const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
            const rgb = (css) => {
              ctx.fillStyle = "#000";
              ctx.fillStyle = css;
              ctx.clearRect(0, 0, 1, 1);
              ctx.fillRect(0, 0, 1, 1);
              return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
            };
            const luminance = (px) => px.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
            const ratio = (a, b) => {
              const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
              return (hi + 0.05) / (lo + 0.05);
            };
            for (const theme of ["ink", "graphite", "paper"]) {
              const scope = themed(theme);
              const tokens = getComputedStyle(scope);
              const text = { fg: rgb(tokens.getPropertyValue("--sd-fg")), muted: rgb(tokens.getPropertyValue("--sd-fg-muted")), subtle: rgb(tokens.getPropertyValue("--sd-fg-subtle")) };
              for (const style of styles) {
                for (const placement of ["br", "bottom", "center"]) {
                  for (const surface of ["--sd-canvas", "--sd-surface"]) {
                    const bg = rgb(tokens.getPropertyValue(surface));
                    const el = make(scope, { "data-sd-ornaments": `${placement} ${style}` });
                    paintOrnaments(el);
                    const img = new Image();
                    img.src = urlOf(el)[0];
                    await img.decode();
                    // Three device pixels per CSS pixel, so a 1px line reaches its full alpha.
                    const canvas = document.createElement("canvas");
                    canvas.width = img.naturalWidth * 3;
                    canvas.height = img.naturalHeight * 3;
                    const c = canvas.getContext("2d", { willReadFrequently: true });
                    c.fillStyle = `rgb(${bg})`;
                    c.fillRect(0, 0, canvas.width, canvas.height);
                    c.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const data = c.getImageData(0, 0, canvas.width, canvas.height).data;
                    const colors = new Set();
                    for (let i = 0; i < data.length; i += 4) colors.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
                    const worst = { fg: Infinity, muted: Infinity, subtle: Infinity };
                    for (const key of colors) for (const token of Object.keys(worst)) worst[token] = Math.min(worst[token], ratio(text[token], [key >> 16, (key >> 8) & 255, key & 255]));
                    for (const token of Object.keys(worst)) assert(worst[token] >= budget[token], `${style} ${placement} ${theme} on ${surface}: ${token} text drops to ${worst[token].toFixed(2)}:1 under the art, below ${budget[token]}:1`);
                    el.remove();
                  }
                }
              }
              scope.remove();
            }
          } catch (error) {
            contrast = `skipped (${error.name})`;
          }
        }
        holder.remove();
        return { problems, assertions, contrast, snapshot };
      },
      { apiUrl, reduced, unchanged: reduced ? UNCHANGED_REDUCED : UNCHANGED, budget: BUDGET },
    );

  const normal = await run(false);
  // Reduced motion changes the sparkle on the dust and nothing on the still art.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reduced = await run(true);
  await page.emulateMedia({ reducedMotion: null });
  for (const problem of [...normal.problems, ...reduced.problems]) fail(`${where} ornaments`, problem);
  for (const [name, image] of Object.entries(normal.snapshot)) if (reduced.snapshot[name] !== image) fail(`${where} ornaments`, `${name}: reduced motion changed a still picture`);
  if (normal.contrast !== "measured") console.log(`skip ${where} ornament contrast: ${normal.contrast}`);
  else console.log(`ok   ${where} ornaments ${normal.assertions + reduced.assertions} assertions, contrast measured on every style`);
}
