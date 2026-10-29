import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sweep } from "../../bin/rules.mjs";

export const page = "surfaces";

const cli = fileURLToPath(new URL("../../bin/signal-design.mjs", import.meta.url));
const root = fileURLToPath(new URL("../../", import.meta.url));

/**
 * A finding names its rule, data-sd-check-ignore silences exactly the rules it
 * lists for its subtree, and the CLI's --skip turns a rule off or refuses a
 * name it does not know. The CLI runs for real, on a page of its own with
 * rounded corners and a blurred shadow (a Signal page cannot have the corners:
 * its base layer holds every radius at zero).
 */
export default async function checkRuleNames(page, where, fail) {
  const shadow = "box-shadow:0 2px 8px #000";
  const found = await page.evaluate(
    ([source, shadow]) => {
      const run = new Function(`return (${source})()`);
      const sample = (html) => {
        const host = document.createElement("div");
        host.innerHTML = html;
        document.body.append(host);
        const lines = run().filter((line) => line.includes("rule-probe"));
        host.remove();
        return lines;
      };
      const box = (extra = "") => `<div class="rule-probe" style="width:20px;height:20px;${extra}"></div>`;
      return {
        shadow: sample(box(shadow)),
        flat: sample(box("box-shadow:0 0 0 1px #888")),
        ignored: sample(`<div data-sd-check-ignore="shadows">${box(shadow)}</div>`),
        listed: sample(`<div data-sd-check-ignore="corners shadows">${box(shadow)}</div>`),
        other: sample(`<div data-sd-check-ignore="corners">${box(shadow)}</div>`),
        lookalike: sample(`<div data-sd-check-ignore="shadows-extra">${box(shadow)}</div>`),
      };
    },
    [sweep.toString(), shadow],
  );
  if (!found.shadow.length || found.shadow.some((line) => !line.startsWith("shadows: "))) fail(`${where} rule names`, `a blurred shadow was not reported as "shadows: ...": ${JSON.stringify(found.shadow)}`);
  if (found.flat.length) fail(`${where} rule names`, `a hairline shadow was reported: ${JSON.stringify(found.flat)}`);
  if (found.ignored.length) fail(`${where} rule names`, `data-sd-check-ignore="shadows" did not silence a shadow: ${JSON.stringify(found.ignored)}`);
  if (found.listed.length) fail(`${where} rule names`, `data-sd-check-ignore="corners shadows" did not silence a shadow: ${JSON.stringify(found.listed)}`);
  if (!found.other.length) fail(`${where} rule names`, 'data-sd-check-ignore="corners" silenced a shadow');
  if (!found.lookalike.length) fail(`${where} rule names`, 'data-sd-check-ignore="shadows-extra" silenced a shadow');

  // The CLI is Chromium only; one engine runs it.
  if (page.context().browser().browserType().name() !== "chromium") return;
  const dir = mkdtempSync(join(tmpdir(), "signal-rule-names-"));
  try {
    const file = join(dir, "page.html");
    writeFileSync(
      file,
      `<!doctype html><title>t</title>
<div id="round" style="width:20px;height:20px;border-radius:8px"></div>
<div id="glow" style="width:20px;height:20px;${shadow}"></div>
<div data-sd-check-ignore="corners shadows"><div id="exempt" style="width:20px;height:20px;border-radius:8px;${shadow}"></div></div>`,
    );
    const url = pathToFileURL(file).href;
    const run = (...args) => {
      const done = spawnSync(process.execPath, [cli, "check", url, "--widths", "1280", ...args], { cwd: root, encoding: "utf8" });
      return { code: done.status, out: `${done.stdout}${done.stderr}` };
    };
    // The page loads no Signal CSS, so the fonts rule has nothing to say about it.
    const all = run("--skip", "fonts");
    if (all.code !== 1) fail(`${where} rule names`, `the CLI exited ${all.code} on a page with a rounded corner and a blurred shadow`);
    if (!/FAIL \S+ @1280px: corners: div#round/.test(all.out)) fail(`${where} rule names`, `no "corners: div#round" finding: ${all.out.trim()}`);
    if (!/FAIL \S+ @1280px: shadows: div#glow/.test(all.out)) fail(`${where} rule names`, `no "shadows: div#glow" finding: ${all.out.trim()}`);
    if (all.out.includes("#exempt")) fail(`${where} rule names`, `an exempt element was reported: ${all.out.trim()}`);
    const noCorners = run("--skip", "fonts,corners");
    if (noCorners.out.includes("corners:") || !noCorners.out.includes("shadows: div#glow")) fail(`${where} rule names`, `--skip corners: ${noCorners.out.trim()}`);
    const none = run("--skip", "fonts,corners,shadows");
    if (none.code !== 0) fail(`${where} rule names`, `--skip fonts,corners,shadows still exited ${none.code}: ${none.out.trim()}`);
    const unknown = run("--skip", "corners,sparkles");
    if (unknown.code !== 2 || !unknown.out.includes("sparkles") || !unknown.out.includes("shadows")) fail(`${where} rule names`, `--skip with an unknown rule exited ${unknown.code}: ${unknown.out.trim()}`);
    const bare = run("--skip");
    if (bare.code !== 2) fail(`${where} rule names`, `--skip without names exited ${bare.code}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
