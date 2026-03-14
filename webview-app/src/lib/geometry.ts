export type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeOptions {
  handle: ResizeHandle;
  deltaX: number;
  deltaY: number;
  minWidth?: number;
  minHeight?: number;
  gridSize?: number;
}

/**
 * Restricts a numeric value to a bounded range.
 *
 * @param value - The input value to constrain.
 * @param min - The inclusive lower bound.
 * @param max - The inclusive upper bound.
 * @returns The value clamped to the `[min, max]` interval.
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error("clamp: min cannot be greater than max");
  }

  return Math.min(max, Math.max(min, value));
}

/**
 * Snaps a numeric value to the nearest grid step.
 *
 * @param value - The raw coordinate/size value.
 * @param gridSize - The grid step in pixels. Values `<= 1` behave like integer rounding.
 * @returns The value snapped to the closest grid increment.
 */
export function snapToGrid(value: number, gridSize = 1): number {
  if (gridSize <= 1) {
    return Math.round(value);
  }

  return Math.round(value / gridSize) * gridSize;
}

/**
 * Calculates the next rectangle while resizing from a given handle.
 *
 * Behavior mirrors the current canvas resize interaction:
 * - East/South handles grow from the fixed north-west origin.
 * - West/North handles move the origin while keeping opposite edges anchored.
 * - Width and height are clamped to minimums.
 * - Returned values are snapped to grid (default integer pixels).
 *
 * @param startRect - The rectangle at drag start.
 * @param options - Resize metadata such as handle, deltas, and constraints.
 * @returns A new rectangle representing the resized bounds.
 */
export function calculateResize(startRect: Rect, options: ResizeOptions): Rect {
  const {
    handle,
    deltaX,
    deltaY,
    minWidth = 1,
    minHeight = 1,
    gridSize = 1,
  } = options;

  let nextX = startRect.x;
  let nextY = startRect.y;
  let nextWidth = startRect.width;
  let nextHeight = startRect.height;

  if (handle.includes("e")) {
    nextWidth = Math.max(minWidth, snapToGrid(startRect.width + deltaX, gridSize));
  }

  if (handle.includes("s")) {
    nextHeight = Math.max(minHeight, snapToGrid(startRect.height + deltaY, gridSize));
  }

  if (handle.includes("w")) {
    const candidateWidth = startRect.width - deltaX;
    nextWidth = Math.max(minWidth, snapToGrid(candidateWidth, gridSize));
    nextX = snapToGrid(startRect.x + (startRect.width - nextWidth), gridSize);
  }

  if (handle.includes("n")) {
    const candidateHeight = startRect.height - deltaY;
    nextHeight = Math.max(minHeight, snapToGrid(candidateHeight, gridSize));
    nextY = snapToGrid(startRect.y + (startRect.height - nextHeight), gridSize);
  }

  return {
    x: snapToGrid(nextX, gridSize),
    y: snapToGrid(nextY, gridSize),
    width: nextWidth,
    height: nextHeight,
  };
}

/**
 * Checks whether a point is inside (or on the edge of) a rectangle.
 *
 * @param x - Point x coordinate.
 * @param y - Point y coordinate.
 * @param rect - Rectangle bounds to test.
 * @returns `true` when the point lies within inclusive rectangle bounds.
 */
export function isPointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}


