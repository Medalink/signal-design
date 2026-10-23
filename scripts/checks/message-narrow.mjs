export const page = "conversation";
/** A message in a narrow column: long unbroken author names must not widen the row; in the head and the quote they truncate and leave the badge, time and quoted text visible, and an inline author wraps. */
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
    const quoteName = message.querySelector(".sd-message-ref > b");
    const quote = message.querySelector(".sd-message-ref > span");
    const inline = block.querySelectorAll(".sd-message")[1];
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
      inlineNoOverflow: inline.scrollWidth <= inline.clientWidth,
      inlineAuthorInside: [...inline.querySelector(".sd-message-author").getClientRects()].every((r) => r.right <= inline.getBoundingClientRect().right + 0.5),
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} message narrow`, key);

  // The author as a button (head) or a link (quote) inside <b> must truncate too.
  const control = await page.evaluate(() => {
    const message = document.querySelector("#demo-narrow-button-author .sd-message");
    message.scrollIntoView();
    const box = message.getBoundingClientRect();
    const head = message.querySelector(".sd-message-head");
    const reply = message.querySelector(".sd-message-ref");
    const truncated = (el) => el.scrollWidth > el.clientWidth && getComputedStyle(el).textOverflow === "ellipsis";
    const button = head.querySelector("b > button");
    const link = reply.querySelector("b > a");
    return {
      noOverflow: message.scrollWidth <= message.clientWidth,
      buttonTruncated: truncated(button),
      buttonInsideName: button.getBoundingClientRect().right <= button.parentElement.getBoundingClientRect().right + 0.5,
      buttonShare: button.parentElement.getBoundingClientRect().width <= head.getBoundingClientRect().width * 0.6 + 0.5,
      timeInside: head.querySelector("time").getBoundingClientRect().right <= box.right + 0.5,
      linkTruncated: truncated(link),
      linkShare: link.parentElement.getBoundingClientRect().width <= reply.getBoundingClientRect().width * 0.4 + 0.5,
    };
  });
  for (const [key, passed] of Object.entries(control)) if (!passed) fail(`${where} message narrow control author`, key);
}
