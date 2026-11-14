import { useEffect, useRef } from "react";
import { initPredict } from "../js/predict.js";

const PASS_MS = 80;

/**
 * Hears `sd:predict` on `ref`'s element and passes its detail to
 * `onPredict`. Returns `left(delay)`: what remains of a hover delay counted
 * from the last path prediction, while that prediction is still current, so a
 * card or tip whose arrival was foreseen opens sooner, but never before the
 * pointer gets there and stays a moment.
 */
export function usePredicted(ref, onPredict) {
  const at = useRef(null);
  const handler = useRef(onPredict);
  handler.current = onPredict;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    initPredict();
    const on = (event) => {
      if (event.target !== el) return;
      at.current = event.detail.via === "path" ? performance.now() : null;
      handler.current?.(event.detail);
    };
    el.addEventListener("sd:predict", on);
    return () => el.removeEventListener("sd:predict", on);
  }, [ref]);
  // A pointer that crosses the trigger without stopping leaves within this, so nothing opens on the way past.
  return (delay) => (at.current !== null && ref.current?.hasAttribute("data-sd-predicted") ? Math.max(Math.min(delay, PASS_MS), delay - (performance.now() - at.current)) : delay);
}
