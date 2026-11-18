// The cost model. Seconds here are modeled from the Keystroke-Level Model, never measured on
// a person. They rank paths against each other; they do not predict a stopwatch.
export const COST = {
  M: 1.35,
  B: 0.2,
  K: 0.28,
  POINT_BASE: 1.03,
  POINT_PER_BIT: 0.096,
  POINT_AVERAGE: 1.1,
  S: 1.0,
  HOLD: 0.45,
}

function pointingSeconds(distance, size) {
  return COST.POINT_BASE + COST.POINT_PER_BIT * Math.max(0, Math.log2(distance / size + 0.5))
}

export function pointerStep(from, target) {
  const size = Math.max(target.size, 1)
  const distance = Math.hypot(target.x - from.x, target.y - from.y)
  return {
    seconds: COST.M + COST.S * target.scrollScreens + pointingSeconds(distance, size) + COST.B,
    fittsBits: Math.log2(distance / size + 1),
    scrollScreens: target.scrollScreens,
    pointer: { x: target.x, y: target.y },
  }
}

export const LIST_PICK_SECONDS = COST.POINT_AVERAGE + COST.B

export function typingSeconds(keys) {
  return COST.M + COST.K * keys
}

export function median(values) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function p90(values) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(0.9 * sorted.length) - 1)]
}

export function round3(value) {
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : 0
}
