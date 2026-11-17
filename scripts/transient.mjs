/**
 * What a network that changed under a run looks like, shared by the sweep
 * (scripts/check.mjs) and the axe audit (scripts/a11y.mjs).
 *
 * Many pages loading at once can fill the dev server's accept queue, and
 * Windows refuses a connection then instead of queuing it. A network change
 * (a bridge or veth pair made or removed on the machine) aborts in-flight
 * loads with ERR_NETWORK_CHANGED. A font face it kills mid-fetch shows no
 * network text of its own, only an `error` status in the fonts rule's FAIL
 * line.
 */
export const transient = /ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_NETWORK_CHANGED|Could not connect to server|fonts:.*:error/;

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
