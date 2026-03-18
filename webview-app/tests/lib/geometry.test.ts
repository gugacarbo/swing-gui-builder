import { describe, expect, it } from "vitest";

import { calculateResize, clamp, isPointInRect, snapToGrid } from "@/lib/geometry";

describe("geometry helpers", () => {
  describe("clamp", () => {
    it("keeps values in range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-3, 0, 10)).toBe(0);
      expect(clamp(42, 0, 10)).toBe(10);
    });

    it("throws when min is greater than max", () => {
      expect(() => clamp(1, 10, 0)).toThrow("clamp: min cannot be greater than max");
    });
  });

  describe("snapToGrid", () => {
    it("rounds to integer when grid is 1 or below", () => {
      expect(snapToGrid(4.4, 1)).toBe(4);
      expect(snapToGrid(4.6, 0)).toBe(5);
    });

    it("snaps to the nearest grid increment", () => {
      expect(snapToGrid(13, 5)).toBe(15);
      expect(snapToGrid(12, 4)).toBe(12);
      expect(snapToGrid(10.1, 2)).toBe(10);
    });
  });

  describe("calculateResize", () => {
    it("grows rectangle from south-east handle", () => {
      const resized = calculateResize(
        { x: 10, y: 20, width: 100, height: 80 },
        {
          handle: "se",
          deltaX: 35,
          deltaY: 25,
          minWidth: 20,
          minHeight: 20,
          gridSize: 5,
        },
      );

      expect(resized).toEqual({ x: 10, y: 20, width: 135, height: 105 });
    });

    it("resizes from west handle while moving x and clamping minimum width", () => {
      const resized = calculateResize(
        { x: 50, y: 20, width: 60, height: 40 },
        {
          handle: "w",
          deltaX: 80,
          deltaY: 0,
          minWidth: 30,
          gridSize: 10,
        },
      );

      expect(resized).toEqual({ x: 80, y: 20, width: 30, height: 40 });
    });

    it("resizes from north handle while moving y and clamping minimum height", () => {
      const resized = calculateResize(
        { x: 5, y: 50, width: 60, height: 40 },
        {
          handle: "n",
          deltaX: 0,
          deltaY: 45,
          minHeight: 20,
          gridSize: 5,
        },
      );

      expect(resized).toEqual({ x: 5, y: 70, width: 60, height: 20 });
    });

    it("supports combined north-west handle with grid snapping", () => {
      const resized = calculateResize(
        { x: 100, y: 80, width: 120, height: 90 },
        {
          handle: "nw",
          deltaX: -23,
          deltaY: -16,
          minWidth: 20,
          minHeight: 20,
          gridSize: 10,
        },
      );

      expect(resized).toEqual({ x: 80, y: 60, width: 140, height: 110 });
    });
  });

  describe("isPointInRect", () => {
    it("includes boundary points", () => {
      const rect = { x: 10, y: 20, width: 50, height: 30 };

      expect(isPointInRect(10, 20, rect)).toBe(true);
      expect(isPointInRect(60, 50, rect)).toBe(true);
    });

    it("returns false for points outside rectangle bounds", () => {
      const rect = { x: 10, y: 20, width: 50, height: 30 };

      expect(isPointInRect(9, 20, rect)).toBe(false);
      expect(isPointInRect(61, 50, rect)).toBe(false);
      expect(isPointInRect(30, 51, rect)).toBe(false);
    });
  });
});
