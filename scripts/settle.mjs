/**
 * A page counts as settled once it has loaded and no request has been open
 * for `quiet` ms. Playwright's "networkidle" waits a fixed 500 ms after the
 * last request, which was most of every page check; the showcase's late
 * requests (fonts, lazy imports) all start within 100 ms of load.
 */
const open = new WeakMap();

/** Count this page's open requests from now on. Call before it navigates. */
export function track(page) {
  if (open.has(page)) return;
  const state = { requests: new Set(), last: performance.now() };
  const start = (request) => {
    const from = request.redirectedFrom();
    if (from) state.requests.delete(from);
    state.requests.add(request);
    state.last = performance.now();
  };
  const end = (request) => {
    state.requests.delete(request);
    state.last = performance.now();
  };
  page.on("request", start);
  page.on("requestfinished", end);
  page.on("requestfailed", end);
  open.set(page, state);
}

/** Wait until a tracked page has had no open request for `quiet` ms. */
export async function settle(page, { quiet = 100, timeout = 30000 } = {}) {
  const state = open.get(page);
  if (!state) throw new Error("settle(page) needs track(page) before the page navigates");
  const end = performance.now() + timeout;
  while (state.requests.size || performance.now() - state.last < quiet) {
    if (performance.now() > end) throw new Error(`the network did not settle in ${timeout} ms: ${[...state.requests].map((r) => r.url()).slice(0, 3).join(" ")}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/** page.goto, then wait for the page to settle. */
export async function gotoSettled(page, url) {
  track(page);
  const response = await page.goto(url, { waitUntil: "load" });
  await settle(page);
  return response;
}
