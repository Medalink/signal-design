export const page = "art";

/**
 * Mascots and art: drawn from square cells, a new mood swaps the face, a new
 * mascot keeps the mood, the eyes turn one cell toward the pointer and back,
 * a press hops and returns to the mood, busy runs the mascot's loop and stops
 * again, every piece draws, and scenes put whole pixels per cell.
 */
export default async function checkMascot(page, where, fail) {
  const bad = (key, detail = "") => fail(`${where} mascot`, detail ? `${key} (${detail})` : key);
  const stage = page.locator("#mascot-demo");
  await stage.scrollIntoViewIfNeeded();

  const drawn = await page.evaluate(() => {
    const el = document.getElementById("mascot-demo");
    const rects = [...el.querySelectorAll("rect")];
    const box = el.getBoundingClientRect();
    return {
      svg: el.querySelector("svg")?.getAttribute("shape-rendering") === "crispEdges",
      integer: rects.every((r) => ["x", "y", "width", "height"].every((a) => Number.isInteger(+r.getAttribute(a)))),
      eyes: el.querySelectorAll(".sd-mascot-eyes rect").length > 0,
      square: box.width === box.height,
      pieces: [...document.querySelectorAll("[data-sd-art]")].every((a) => a.querySelector("svg rect")),
      circuit: [...document.querySelectorAll('[data-sd-ornaments-style="circuit"]')].every((o) => o.style.backgroundImage.includes("data:image/svg")),
    };
  });
  for (const [key, ok] of Object.entries(drawn)) if (!ok) bad(key);

  // Scenes: the mascot is 15 whole-pixel cells, so every cell lands on whole pixels.
  const scenes = await page.evaluate(() =>
    [...document.querySelectorAll(".sd-art-scene")].every((scene) => {
      const w = scene.querySelector("[data-sd-mascot]").getBoundingClientRect().width;
      return w >= 30 && Number.isInteger(w) && w % 15 === 0;
    }),
  );
  if (!scenes) bad("scenes use one whole-pixel cell");

  // A mood redraws the face; a new mascot keeps the mood.
  const swap = await page.evaluate(async () => {
    const wait = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el = document.getElementById("mascot-demo");
    const face = () => el.querySelector(".sd-mascot-eyes").innerHTML;
    const before = face();
    el.dataset.mood = "happy";
    await wait();
    const changed = face() !== before;
    const closed = el.hasAttribute("data-closed");
    const body = el.querySelector(".sd-mascot-body").innerHTML;
    el.dataset.sdMascot = "elephant";
    await wait();
    const swapped = el.querySelector(".sd-mascot-body").innerHTML !== body && el.dataset.mood === "happy";
    const alt = !!el.querySelector(".sd-mascot-alt rect");
    el.dataset.sdMascot = "iris";
    el.dataset.mood = "idle";
    await wait();
    return { changed, closed, swapped, alt, open: !el.hasAttribute("data-closed") };
  });
  for (const [key, ok] of Object.entries(swap)) if (!ok) bad(`swap ${key}`);

  // The eyes follow the pointer: the viewport's bottom-right corner is (1, 1).
  const box = await stage.boundingBox();
  const view = page.viewportSize();
  await page.mouse.move(view.width - 4, view.height - 4);
  const look = await page
    .waitForFunction(() => {
      const s = document.getElementById("mascot-demo").style;
      return s.getPropertyValue("--sd-mascot-x") === "1" && s.getPropertyValue("--sd-mascot-y") === "1";
    }, null, { timeout: 2000 })
    .then(() => true, () => false);
  if (!look) bad("eyes follow the pointer");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const centered = await page
    .waitForFunction(() => document.getElementById("mascot-demo").style.getPropertyValue("--sd-mascot-x") === "0", null, { timeout: 2000 })
    .then(() => true, () => false);
  if (!centered) bad("eyes look out when the pointer is over the mascot");

  // A press smiles, then returns to the mood it had.
  await stage.click();
  const smiled = await page.evaluate(() => document.getElementById("mascot-demo").dataset.mood);
  if (smiled !== "happy") bad("press smiles", smiled);
  const back = await page
    .waitForFunction(() => document.getElementById("mascot-demo").dataset.mood === "idle", null, { timeout: 3000 })
    .then(() => true, () => false);
  if (!back) bad("press returns to the mood");

  // Busy is the only loop: IRIS scans, an animal moves, and both stop again.
  const busy = await page.evaluate(() => {
    const el = document.getElementById("mascot-demo");
    const running = (sel) => getComputedStyle(el.querySelector(sel)).animationName !== "none";
    const idle = running(".sd-mascot-scan");
    el.setAttribute("aria-busy", "true");
    const scan = running(".sd-mascot-scan");
    el.removeAttribute("aria-busy");
    const off = !running(".sd-mascot-scan");
    return { idle: !idle, scan, off };
  });
  for (const [key, ok] of Object.entries(busy)) if (!ok) bad(`busy ${key}`);
  const flap = await page.evaluate(async () => {
    const wait = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el = document.getElementById("mascot-demo");
    el.dataset.sdMascot = "eagle";
    await wait();
    el.setAttribute("aria-busy", "true");
    const on = getComputedStyle(el.querySelector(".sd-mascot-alt")).animationName !== "none";
    el.removeAttribute("aria-busy");
    el.dataset.sdMascot = "iris";
    await wait();
    return on;
  });
  if (!flap) bad("busy animal moves");
}
