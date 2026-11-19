### Fixed
- `initRain` (run by `init()`): a second `init()` call no longer mounts every rain canvas again. The guard stored an empty string and tested it as a boolean, so it never held; on the worker path the second mount tried to take a canvas the first had already handed to its worker and threw `InvalidStateError` from `getContext`.
