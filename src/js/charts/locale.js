/**
 * What a chart says besides its numbers: the language of its dates and a few
 * words (forecast, totals, the kinds of range). English by default.
 *
 *   createChart(canvas, { locale: "de", text: { forecast: "PROGNOSE" } });
 *   setChartDefaults({ locale: "de", text: { forecast: "PROGNOSE" } }); // every chart after
 *
 * The text lives here, not in `signal-design/js`, so the charts work with the
 * bundled `dist/signal.js`, which has its own copy of that table.
 */
export const DEFAULT_CHART_TEXT = Object.freeze({
  forecast: "FORECAST",
  bucket: "{seconds}s bucket",
  total: "Total {value}",
  dailyPeak: "daily peak",
  baseline: "baseline",
  "band.jitter": "jitter ±{value}",
  "band.range": "range {from} – {to}",
  "event.surge": "surge",
  "event.drop": "drop",
  "range.maintenance": "maintenance",
  "range.missing": "missing",
  "range.alert": "alert",
  "range.dip": "dip",
  "range.spike": "spike",
});

const defaults = { locale: "en", text: {} };

/** Set the locale and the text every chart made afterwards starts from. `locale: undefined` or a `text` value of `undefined` restores English. */
export function setChartDefaults(options = {}) {
  const { locale, text = {} } = options;
  for (const key of Object.keys(text)) {
    if (!(key in DEFAULT_CHART_TEXT)) throw new RangeError(`Unknown chart text "${key}"`);
  }
  if ("locale" in options) defaults.locale = locale ?? "en";
  for (const [key, value] of Object.entries(text)) {
    if (value === undefined) delete defaults.text[key];
    else defaults.text[key] = value;
  }
}

export const defaultLocale = () => defaults.locale;

/** A chart's text for `key`: its own `text` option, then the defaults set above, then English. */
export function chartText(key, vars = {}, own = undefined) {
  const value = own?.[key] ?? defaults.text[key] ?? DEFAULT_CHART_TEXT[key];
  return typeof value === "function" ? value(vars) : value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

/** The name of a range of `kind`; a kind Signal does not know prints as it is. */
export const rangeText = (kind, own = undefined) => (`range.${kind}` in DEFAULT_CHART_TEXT ? chartText(`range.${kind}`, {}, own) : kind);
