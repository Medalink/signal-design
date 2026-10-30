export const page = "messages";
/** Message markdown: inline code takes the text color, `sd-md` starts under the author with its own white-space, a quote has a strong edge, an ordered list counts plainly, a fence keeps its lines and scrolls, and a table head reads as a head, not a caps label. */
export default async function checkMessageMarkdown(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("conversation-message-markdown");
    block.scrollIntoView();
    const text = (el) => getComputedStyle(el);
    const inline = block.querySelector(".sd-message-text > code");
    const md = block.querySelector(".sd-md");
    const author = md.parentElement.querySelector(".sd-message-author").getBoundingClientRect();
    const quote = text(md.querySelector("blockquote"));
    const pre = text(md.querySelector("pre"));
    const th = text(md.querySelector("th"));
    const wrap = md.querySelector(".sd-table-wrap");
    return {
      inlineCodeColor: text(inline).color === text(inline.parentElement).color,
      mdBelowAuthor: md.getBoundingClientRect().top >= author.bottom - 1,
      mdWhiteSpace: text(md).whiteSpace === "normal",
      quoteEdge: quote.borderInlineStartWidth === "2px" && quote.fontSize === text(md).fontSize,
      orderedPlain: text(md.querySelector("ol")).listStyleType === "decimal",
      fenceLines: pre.whiteSpace === "pre" && md.querySelector("pre").scrollWidth >= md.querySelector("pre").clientWidth,
      headNotCaps: th.textTransform === "none" && th.whiteSpace !== "nowrap",
      tableFits: wrap.getBoundingClientRect().right <= md.getBoundingClientRect().right + 1,
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} message markdown`, key);
}
