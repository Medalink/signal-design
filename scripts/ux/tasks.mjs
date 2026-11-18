// A user goal as the SHORTEST path the UI offers today, per layout.
// Step kinds: click (a tap on a touch profile), hover (a mouse only), longPress (a finger only),
// type, key. A step may carry only: 'desktop' or 'phone'. A task with no path on a layout carries
// profiles: [...], or skip: 'why' when it has none anywhere, and is reported as skipped. A task
// that misses its goal is an error, never a number.
import { APP_TASKS } from './tasks/app.mjs'
import { DOCS_TASKS } from './tasks/docs.mjs'

export const TASKS = [...DOCS_TASKS, ...APP_TASKS]
