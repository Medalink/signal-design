/** A message in a narrow column: long unbroken author names must not widen the row; they truncate and leave the badge, time and quoted text visible. */
export default async function checkMessageNarrow(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("conversation-message-in-a-narrow-column");
    block.scrollIntoView();
    const message = block.querySelector(".sd-message");
    const box = message.getBoundingClientRect();
    const inside = (el) => el.getBoundingClientRect().right <= box.right + 0.5;
    // The body box itself is sized by the message; its grid track is what grew.
    const rows = [...message.querySelectorAll(".sd-message-body > *")];
    const head = message.querySelector(".sd-message-head");
    const name = head.querySelector("b");
    const quoteName = message.querySelector(".sd-reply > b");
    const quote = message.querySelector(".sd-reply > span");
    const truncated = (el) => el.scrollWidth > el.clientWidth && getComputedStyle(el).textOverflow === "ellipsis";
    return {
      rowsInside: rows.every(inside),
      noOverflow: message.scrollWidth <= message.clientWidth,
      headNameTruncated: truncated(name),
      headNameShare: name.getBoundingClientRect().width <= head.getBoundingClientRect().width * 0.6 + 0.5,
      headTimeInside: inside(head.querySelector("time")),
      replyNameTruncated: truncated(quoteName),
      replyNameShare: quoteName.getBoundingClientRect().width <= quoteName.parentElement.getBoundingClientRect().width * 0.4 + 0.5,
      replyQuoteVisible: quote.getBoundingClientRect().width > 40,
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} message narrow`, key);
}
