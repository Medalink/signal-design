### Fixed
- The frame rate counter (`data-sd-fps`, `fps.subscribe`) no longer reports 0 or 1 fps after the page
  stops drawing for a while, as an off-screen frame or a covered window does. A sample that runs past
  twice its one-second window starts over.
