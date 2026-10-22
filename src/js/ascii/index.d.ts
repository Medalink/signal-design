// Types for signal-design/ascii. Pieces come from ascii-magic-art (optional peer dependency).

/** A redraw of a piece in other characters; "original" keeps the piece's own. */
export type Look =
  | "original"
  | "dots"
  | "ascii"
  | "dense"
  | "numbers"
  | "binary"
  | "letters"
  | "blocks"
  | "squares"
  | "lines"
  | "dither";

export interface PieceMeta {
  slug: string;
  name: string;
  category: string;
  cols: number;
  rows: number;
  fps: number;
  /** Palette key to hex. Only its brightness is used: the art draws in greys. */
  palette?: Record<string, string>;
  /** "square" marks a photo piece, which mountAscii does not draw. */
  cell?: "square";
  /** A piece that never moves. */
  still?: boolean;
}

/** One frame: rows of text, or text plus a color layer of the same shape whose characters are palette keys. */
export type Frame = string | { text: string; color: string; palette?: Record<string, string> };

/** A piece module namespace, e.g. `await import("ascii-magic-art/pieces/spinning-torus.js")`. */
export interface Piece {
  meta: PieceMeta;
  /** Returns draw(t), the frame at t seconds. */
  default: () => (t: number) => Frame;
}

export interface AsciiOptions {
  /** Seconds into the piece for the still frame, and where playing starts. Default 0. */
  at?: number;
  look?: Look;
  /** Playback speed. Default 1. */
  speed?: number;
}

export interface Ascii {
  /** Draw the frame at t seconds now. */
  render(t: number): void;
  /**
   * Play while true and hold while false, whatever aria-busy says. With no
   * argument, follow aria-busy on the element or its closest ancestor that has it.
   */
  busy(on?: boolean): void;
  /** Stop and disconnect. The last frame stays. */
  destroy(): void;
}

/**
 * Draw a piece as text in an element. Still by default; plays only while busy,
 * on screen, in a visible tab and without prefers-reduced-motion.
 */
export function mountAscii(el: HTMLElement, piece: Piece, options?: AsciiOptions): Ascii;
