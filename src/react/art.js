/**
 * A pixel art piece (`signal-design/js` art) drawn by React, so the app needs no initArt() and no
 * markup strings. `name` is a built-in piece or one added with defineArt(); `tone` colours its
 * signal cells. It is decorative until it has a `label`.
 */
import { createElement as h } from "react";
import { artRects } from "../js/art.js";
import { cx } from "./util.js";

export function Art({ name, tone, muted, flip, label, className, style, ...props }) {
  const art = artRects(name);
  if (!art) throw new RangeError(`Unknown art piece "${name}"`);
  return h(
    "span",
    {
      className: cx("sd-art", className),
      "data-tone": tone,
      "data-muted": muted ? "" : undefined,
      "data-flip": flip ? "" : undefined,
      role: label ? "img" : undefined,
      "aria-label": label,
      "aria-hidden": label ? undefined : true,
      style: { "--sd-art-rows": art.h, ...style },
      ...props,
    },
    h(
      "svg",
      { viewBox: `0 0 ${art.w} ${art.h}`, width: art.w, height: art.h, fill: "currentColor", shapeRendering: "crispEdges", "aria-hidden": true, focusable: false },
      art.layers.map(({ layer, rects }) =>
        h(
          "g",
          { key: layer, className: `sd-art-${layer}` },
          rects.map(({ x, y, width, signal, opacity }) =>
            h("rect", { key: `${x},${y}`, x, y, width, height: 1, className: signal ? "sd-art-signal" : undefined, fillOpacity: !signal && opacity < 1 ? opacity : undefined }),
          ),
        ),
      ),
    ),
  );
}
