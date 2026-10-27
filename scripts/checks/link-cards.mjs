export const page = "attachments";

/** Link card variants: hero bleed, compact, document type, blocked tone and a static loading state. */
export default async function checkLinkCards(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("conversation-link-cards");
    block.scrollIntoView();
    const color = (expr, host) => {
      const probe = document.createElement("span");
      probe.style.color = expr;
      host.append(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    };
    const hero = block.querySelector(".sd-link-card-hero");
    const heroThumb = hero.querySelector(".sd-link-card-thumb").getBoundingClientRect();
    const heroBox = hero.getBoundingClientRect();
    const compact = block.querySelector(".sd-link-card-compact");
    const blocked = block.querySelector("[data-blocked]");
    const busy = block.querySelector('[aria-busy="true"]');
    const raised = color("var(--sd-raised)", busy);
    return {
      heroBleeds: Math.abs(heroThumb.left - (heroBox.left + 2)) <= 1 && Math.abs(heroThumb.right - (heroBox.right - 1)) <= 1 && heroThumb.top - heroBox.top <= 2,
      heroAbove: heroThumb.bottom <= hero.querySelector(".sd-link-card-site").getBoundingClientRect().top,
      compactShort: compact.getBoundingClientRect().height < 80 && compact.querySelector(".sd-link-card-thumb").getBoundingClientRect().width === 40,
      docType: getComputedStyle(block.querySelector(".sd-link-card-type")).gridColumnStart === "2",
      blockedEdge: getComputedStyle(blocked).borderInlineStartColor === color("var(--sd-danger)", blocked) && blocked.tagName === "DIV",
      blockedNote: getComputedStyle(blocked.querySelector(".sd-link-card-note")).color === color("var(--sd-danger)", blocked),
      busyBars: [...busy.querySelectorAll(".sd-link-card-site, .sd-link-card-title, .sd-link-card-desc")].every((s) => getComputedStyle(s).backgroundColor === raised && getComputedStyle(s).animationName === "none" && s.offsetHeight > 0),
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} link cards`, key);
}
