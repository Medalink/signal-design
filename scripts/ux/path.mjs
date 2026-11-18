import { LIST_PICK_SECONDS, pointerStep, typingSeconds, COST } from './model.mjs'

/**
 * A path is what a user has spent so far on the way to a goal. Every function returns a new
 * path, so a step never undoes the one before it.
 */
export function startPath(viewport) {
  return {
    clicks: 0,
    hovers: 0,
    holds: 0,
    keys: 0,
    seconds: 0,
    fittsBits: 0,
    scrollScreens: 0,
    choices: [],
    pointer: { x: viewport.width / 2, y: viewport.height / 2 },
  }
}

/**
 * One press on a measured element. A native list takes a second press on an option that was not
 * on screen when the step began. A held press waits for the app's long-press delay.
 */
export function press(path, target, { listPick = false, hold = false } = {}) {
  const step = pointerStep(path.pointer, target)
  return {
    ...path,
    clicks: path.clicks + (listPick ? 2 : 1),
    holds: path.holds + (hold ? 1 : 0),
    seconds: path.seconds + step.seconds + (listPick ? LIST_PICK_SECONDS : 0) + (hold ? COST.HOLD : 0),
    fittsBits: path.fittsBits + step.fittsBits,
    scrollScreens: path.scrollScreens + step.scrollScreens,
    choices: [...path.choices, target.choicesVisible],
    pointer: step.pointer,
  }
}

/** Moving a mouse onto something to show what it hides: a pointer step with no press. */
export function hover(path, target) {
  const step = pointerStep(path.pointer, target)
  return {
    ...path,
    hovers: path.hovers + 1,
    seconds: path.seconds + step.seconds - COST.B,
    fittsBits: path.fittsBits + step.fittsBits,
    scrollScreens: path.scrollScreens + step.scrollScreens,
    choices: [...path.choices, target.choicesVisible],
    pointer: step.pointer,
  }
}

export function typeText(path, keys) {
  return { ...path, keys: path.keys + keys, seconds: path.seconds + typingSeconds(keys) }
}

export function pressKey(path) {
  return { ...path, keys: path.keys + 1, seconds: path.seconds + COST.K }
}
