/** A message in a narrow column: a long unbroken author name must not widen the body past the row. */
export default async function checkMessageNarrow(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("conversation-message-in-a-narrow-column");
    block.scrollIntoView();
    const message = block.querySelector(".sd-message");
    const box = message.getBoundingClientRect();
    // The body box itself is sized by the message; its grid track is what grew.
    const rows = [...message.querySelectorAll(".sd-message-body > *")];
    return { rowsInside: rows.every((row) => row.getBoundingClientRect().right <= box.right + 0.5) };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} message narrow`, key);
}
