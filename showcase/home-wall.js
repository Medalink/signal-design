/**
 * The wall of components on the home page: one tile per library page, each
 * holding a small part that works where it stands and linking to its page,
 * grouped the way the docs sidebar groups them. home-markup.js puts it in
 * #home-components; pages/home-wall.js makes the heavy tiles run.
 */
import { SECTIONS } from "./pages.js";
import { WIDTH, specimen } from "./wall-specimens.js";

const arrow = `<svg class="wall-arrow" aria-hidden="true"><use href="#i-next"/></svg>`;

/**
 * How many columns each tile of a group spans at a given column count, so
 * every row ends flush: rows fill in order, and a short row's spare columns
 * go to its first tiles. A wide tile takes up to its width (see WIDTH).
 */
function spans(pages, columns) {
  const out = [];
  let row = [];
  const flush = () => {
    for (let free = columns - row.reduce((n, t) => n + t.span, 0), i = 0; free > 0; free--, i = (i + 1) % row.length) row[i].span++;
    row = [];
  };
  for (const page of pages) {
    const span = Math.min(WIDTH[page.id] ?? 1, columns);
    if (row.reduce((n, t) => n + t.span, 0) + span > columns) flush();
    const entry = { page, span };
    row.push(entry);
    out.push(entry);
  }
  flush();
  return out.map((e) => e.span);
}

function tile(page, at, pages) {
  const style = [4, 3, 2].map((c) => `--s${c}: ${spans(pages, c)[at]}`).join("; ");
  return `        <article class="wall-tile" data-page="${page.id}" style="${style}">
          <h5 class="wall-tile-title"><a href="./${page.file}">${page.title}${arrow}</a></h5>
          <div class="wall-tile-body">${specimen(page)}</div>
        </article>`;
}

/** Every library section's groups of tiles. The example apps are the previews above the wall. */
export function homeWall() {
  const sections = SECTIONS.filter((s) => s.id !== "examples").map((s) => {
    const groups = s.groups
      .map(
        (g) => `      <section class="wall-group" aria-labelledby="wall-g-${s.id}-${g.title.toLowerCase().replace(/\W+/g, "-")}">
        <h4 id="wall-g-${s.id}-${g.title.toLowerCase().replace(/\W+/g, "-")}" class="wall-group-h">${g.title}</h4>
        <div class="wall-grid">
${g.pages.map((p, at) => tile(p, at, g.pages)).join("\n")}
        </div>
      </section>`,
      )
      .join("\n");
    return `    <div class="wall-part">
      <h3 class="wall-part-h">${s.title}</h3>
${groups}
    </div>`;
  });
  return `  <div class="home-wall">
${sections.join("\n")}
  </div>`;
}
