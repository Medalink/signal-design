/**
 * What a network that changed under a run looks like, shared by the sweep
 * (scripts/check.mjs) and the axe audit (scripts/a11y.mjs).
 *
 * Many pages loading at once can fill the dev server's accept queue, and
 * Windows refuses a connection then instead of queuing it. A network change
 * (a bridge or veth pair made or removed on the machine) aborts in-flight
 * loads with ERR_NETWORK_CHANGED. A font face it kills mid-fetch shows no
 * network text of its own, only an `error` status in the fonts rule's FAIL
 * line. A burst can also starve a page's first requests past the settle
 * window without any of them failing; the settle throw names that itself.
 */
export const transient = /ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_NETWORK_CHANGED|Could not connect to server|fonts:.*:error|network did not settle/;

/**
 * How many attempts a job that keeps meeting transient errors gets. One retry
 * is not always enough: the machine's network can churn for a whole sweep —
 * veth pairs made and removed as other rings start and stop — and kill
 * in-flight loads on the second attempt too. A failure that repeats past the
 * last attempt still fails and is logged; a page that saw no transient error
 * never retries at all.
 */
export const TRANSIENT_ATTEMPTS = 4;

/**
 * Watches a page for a load that a network change or a refused connection
 * killed: a failed request or a console error that matches `transient`.
 * Attach it before the page navigates. `met` lists what it saw, in order;
 * `stop()` detaches it.
 */
export function watchTransient(page) {
  const met = [];
  const onFailed = (request) => {
    const text = request.failure()?.errorText ?? "";
    if (transient.test(text)) met.push(`${text} on ${request.url()}`);
  };
  const onConsole = (message) => {
    if (message.type() === "error" && transient.test(message.text())) met.push(`console: ${message.text()}`);
  };
  page.on("requestfailed", onFailed);
  page.on("console", onConsole);
  return {
    met,
    stop() {
      page.off("requestfailed", onFailed);
      page.off("console", onConsole);
    },
  };
}
