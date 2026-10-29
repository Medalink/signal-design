export const page = "stats";

/** A sortable header follows its column: a number column's header sits at the end like its cells, a text column's at the start. */
export default async function checkTableSortNum(page, where, fail) {
  const got = await page.evaluate(() => {
    const host = document.createElement("div");
    host.innerHTML = `<table class="sd-table"><thead><tr>
      <th data-sort="name" aria-sort="ascending">Name</th>
      <th class="sd-num" data-sort="cpu">CPU</th>
      <th data-num data-sort="mem">Memory</th></tr></thead>
      <tbody><tr><td>api</td><td class="sd-num">12%</td><td data-num>4 GiB</td></tr></tbody></table>`;
    document.body.append(host);
    const align = [...host.querySelectorAll("th")].map((th) => getComputedStyle(th).textAlign);
    const cells = [...host.querySelectorAll("td")].map((td) => getComputedStyle(td).textAlign);
    host.remove();
    return { align, cells };
  });
  const [name, cpu, mem] = got.align;
  if (!["left", "start"].includes(name)) fail(`${where} table sort num`, `a sortable text header aligns ${name}`);
  if (cpu !== "end" || mem !== "end") fail(`${where} table sort num`, `sortable number headers align ${cpu} and ${mem}, not end`);
  if (got.cells[1] !== "end" || got.cells[2] !== "end") fail(`${where} table sort num`, `number cells align ${got.cells.slice(1)}`);
}
