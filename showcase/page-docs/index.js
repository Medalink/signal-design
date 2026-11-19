/**
 * The doc sections under each library page's preview, one file per page:
 * page-docs/<id>.js default-exports the doc of lib-<id>.html. Only the build
 * reads them (layout-plugin.js), so none of this text ships in a page's
 * script. A new file is picked up on the next dev-server start.
 *
 * Every field is optional; layout-plugin.js renders the ones present, in
 * this order, and lists them under "On this page":
 *
 *   intro       string    The lead under the title (replaces the page's own).
 *   when        string[]  When to use.
 *   notWhen     string[]  When not to use, naming the part to use instead.
 *   install     { cmd, note }  Installation: the command and one note (HTML).
 *   usage       string    Usage: escaped HTML (&lt; &gt;) of the smallest
 *                         working markup. Its presence adds "Copy page".
 *   examples    { title, html }[]  Examples: live markup, rendered and shown.
 *   api         { name, type, def?, desc }[]  API reference. type is one of
 *                         class, attribute, ARIA, token, function, event.
 *   keyboard    [key, what][]  Keyboard interactions.
 *   a11y        string[]  Accessibility.
 *   motion      string[]  Motion: durations, loops, reduced motion.
 *   responsive  string[]  Responsive behavior.
 *   notes       string[]  Notes for AI.
 *   related     string[]  Page ids (see pages.js) for Related.
 *
 * Strings are HTML: <code> for class names, attributes and tokens.
 */
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const dir = import.meta.dirname;

/** Page id -> doc object, for every file in this folder. */
export const DOCS = Object.fromEntries(
  await Promise.all(
    readdirSync(dir)
      .filter((file) => file.endsWith(".js") && file !== "index.js")
      .sort()
      .map(async (file) => [file.slice(0, -3), (await import(pathToFileURL(resolve(dir, file)).href)).default]),
  ),
);

/** The doc object of a library page, or undefined. */
export const docOf = (page) => (page?.id ? DOCS[page.id] : undefined);
