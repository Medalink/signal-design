/**
 * Mascots: characters on a 15 by 15 grid that share one set of moods. Plain
 * data, no DOM. Cell characters as in art-pieces.js.
 *
 *   body    rows 0 to 13: the figure, its signal cells ("o") are its status light
 *   ground  row 14, faint, left out inside a scene
 *   alt     cells that flicker in while busy (wings, ears, a paw); IRIS scans instead
 *   faces   IRIS: a full 11 by 7 grid per mood at `face`, "e" eyes and "m" mouth
 *   eyes    the animals: the centre cell of each eye (one eye for a profile, facing right)
 *   mouth   where the mouth goes, or null (a beak or a trunk does that job)
 */

export const MOODS = ["idle", "calm", "happy", "curious", "focused", "sleepy", "alert", "offline"];

const GROUND = ["..:::::::::::.."];

export const MASCOTS = {
  iris: {
    label: "IRIS",
    body: [
      "......ooo......",
      "......ooo......",
      ".......#.......",
      ".#############.",
      ".#...........#.",
      ".#...........#.",
      ".#...........#.",
      ".#...........#.",
      ".#...........#.",
      ".#...........#.",
      ".#...........#.",
      ".#############.",
      "....#.....#....",
      "...##.....##...",
    ],
    ground: GROUND,
    busy: "scan",
    face: [2, 4],
    faces: {
      idle: ["...........", "...........", "..ee...ee..", "..ee...ee..", "...........", "....mmm....", "..........."],
      calm: ["...........", "...........", "...........", ".e.e...e.e.", "..e.....e..", "...........", "....mmm...."],
      happy: ["...........", "...........", "..e.....e..", ".e.e...e.e.", "...........", "...m...m...", "....mmm...."],
      curious: ["...........", ".......ee..", "..ee...ee..", "..ee.......", "...........", ".....m.....", "..........."],
      focused: ["...........", ".ee.....ee.", "...e...e...", "..ee...ee..", "..ee...ee..", "...........", "....mmm...."],
      sleepy: ["...........", "...........", "...........", ".eee...eee.", "...........", ".....m.....", "..........."],
      alert: ["...........", "..ee...ee..", "..ee...ee..", "...........", "....mmm....", "....m.m....", "....mmm...."],
      offline: ["...........", ".e.e...e.e.", "..e.....e..", ".e.e...e.e.", "...........", "....mmm....", "..........."],
    },
  },

  /* A bald eagle in profile on a branch: white head, hooked beak, dark body. */
  eagle: {
    label: "Eagle",
    body: [
      "......oo.oo....",
      "........#......",
      "......#####....",
      ".....#.....#...",
      ".....#......##.",
      ".....#.......##",
      ".....#.....#.#.",
      "....#++#####...",
      "...#+++++++#...",
      "..#++#++++++#..",
      "..#+#+++++++#..",
      ".#+#++++++++#..",
      "#+#.#######....",
      "##.....#.#.....",
    ],
    ground: ["..###########.."],
    busy: "alt",
    alt: [
      "...............",
      "...............",
      "...............",
      "...............",
      "..#............",
      ".##............",
      ".#.............",
    ],
    eyes: [[9, 4]],
    mouth: null,
  },

  /* A squirrel in profile, sitting up, its tail curled behind. */
  squirrel: {
    label: "Squirrel",
    body: [
      ".........oo.oo.",
      "..####.....#...",
      ".#++++#..#.....",
      "#+++++#..##....",
      "#++++#...#####.",
      "#+++#...#:::::#",
      "#+++#...#:::::#",
      "#+++#...#::::#.",
      ".#++#...##::#..",
      ".#++#..#::#....",
      "..#++##:::#....",
      "..#+++#::::##..",
      "...#+########..",
      "....##.##..##..",
    ],
    ground: GROUND,
    busy: "alt",
    alt: [
      "...............",
      "##.............",
      "#..............",
    ],
    eyes: [[11, 6]],
    mouth: null,
    flipMarks: true,
  },

  /* An elephant in profile: a big ear, the trunk down, a small tusk. */
  elephant: {
    label: "Elephant",
    body: [
      "........oo.oo..",
      "..........#....",
      "...#########...",
      "..#::#####::#..",
      ".#:::#+++#:::#.",
      ".#:::#+++#::::#",
      "##::::#++#::::#",
      "##:::::##::::##",
      ".#:::::::::::##",
      ".#:::::::::::##",
      "..##########.##",
      "..##..##.##.##.",
      "..##..##.##....",
      "..##..##.##....",
    ],
    ground: GROUND,
    busy: "alt",
    alt: [
      "...............",
      "...............",
      "...............",
      "...............",
      "....#..........",
      "....#..........",
      ".....#.........",
    ],
    eyes: [[11, 5]],
    mouth: null,
  },
};

/**
 * Shared eye and mouth shapes for the animals, as [dx, dy] cells from the
 * anchor. The right eye mirrors dx. `right` overrides the right eye.
 */
export const EYES = {
  idle: [[0, 0], [0, 1]],
  calm: [[-1, 0], [1, 0], [0, 1]],
  happy: [[0, 0], [-1, 1], [1, 1]],
  curious: { left: [[0, 0], [0, 1]], right: [[0, -1], [0, 0]] },
  focused: [[-1, 0], [0, 1]],
  sleepy: [[-1, 1], [0, 1], [1, 1]],
  alert: [[0, -1], [0, 0], [0, 1]],
  offline: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
};

export const MOUTHS = {
  idle: [[0, 0]],
  calm: [[0, 0]],
  happy: [[-1, 0], [1, 0], [0, 1]],
  curious: [[0, 1]],
  focused: [[-1, 0], [0, 0], [1, 0]],
  sleepy: [[0, 0]],
  alert: [[-1, 0], [0, 0], [1, 0], [-1, 1], [1, 1]],
  offline: [[-1, 0], [0, 0], [1, 0]],
};

/** Marks around the head, rows 0 to 2, beside the signal. */
export const MARKS = {
  happy: ["...............", "..+.........+..", "..............."],
  curious: ["...........+++.", ".............+.", "............+.."],
  sleepy: ["..........+++..", "...........+...", "..........+++.."],
  alert: [".o...........o.", "..o.........o..", "..............."],
};
