/**
 * Helper for the rule controls in scripts/checks/: runs one rule from
 * bin/rules.mjs on the live page against markup the control puts there, and
 * returns what the rule said about it. Every sample is added to the page (its
 * [popover] elements opened), checked, then removed, so one control can try several without them touching.
 * An element of a sample that carries class "rule-probe" is the one the
 * rule's findings are kept for; the page's own findings are dropped.
 */
export async function probeRule(page, rule, samples, arg) {
  return page.evaluate(
    ([source, samples, arg]) => {
      const run = new Function("arg", `return (${source})(arg)`);
      const out = {};
      for (const [name, html] of Object.entries(samples)) {
        const host = document.createElement("div");
        host.id = "rule-probe-host";
        host.innerHTML = html;
        document.body.append(host);
        for (const popover of host.querySelectorAll("[popover]")) popover.showPopover?.();
        try {
          out[name] = run(arg).filter((line) => line.includes("rule-probe"));
        } finally {
          host.remove();
        }
      }
      return out;
    },
    [rule.toString(), samples, arg],
  );
}
