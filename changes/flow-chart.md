### Added
- `sd-flow`: a pipeline chart of stages and jobs on a dot grid, joined by
  CSS-drawn edges. `data-status` (`done`, `running`, `queued`, `waiting`,
  `failed`, `skipped`) sets each stage, job and legend mark; edges leave a
  stage solid, dashed or grey by its status; `--value` fills a stage head
  and a running job. Mono or spectrum through `data-chart-theme`. CSS only.
