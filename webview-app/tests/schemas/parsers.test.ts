import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type NumericInputOptions,
  parseCanvasComponent,
  parseCanvasState,
  parseClampedNumericInput,
  parseHexColorInput,
  parseMessage,
} from "@/schemas/parsers";

describe("parseClampedNumericInput", () => {
  const defaultOptions: NumericInputOptions = {
    min: 0,
    max: 100,
  };

  it("parses valid integer string", () => {
    expect(parseClampedNumericInput("50", defaultOptions)).toBe(50);
  });

  it("parses valid float string", () => {
    expect(parseClampedNumericInput("50.5", defaultOptions)).toBe(50.5);
  });

  it("clamps value to minimum", () => {
    expect(parseClampedNumericInput("-10", defaultOptions)).toBe(0);
  });

  it("clamps value to maximum", () => {
    expect(parseClampedNumericInput("150", defaultOptions)).toBe(100);
  });

  it("returns null for empty string", () => {
    expect(parseClampedNumericInput("", defaultOptions)).toBe(null);
  });

  it("returns null for whitespace only", () => {
    expect(parseClampedNumericInput("   ", defaultOptions)).toBe(null);
  });

  it("returns null for non-numeric string", () => {
    expect(parseClampedNumericInput("abc", defaultOptions)).toBe(null);
  });

  it("returns null for NaN input", () => {
    expect(parseClampedNumericInput("NaN", defaultOptions)).toBe(null);
  });

  it("rounds value when integer option is true", () => {
    const options: NumericInputOptions = { min: 0, max: 100, integer: true };
    expect(parseClampedNumericInput("50.7", options)).toBe(51);
    expect(parseClampedNumericInput("50.3", options)).toBe(50);
  });

  it("keeps decimal when integer option is false", () => {
    const options: NumericInputOptions = { min: 0, max: 100, integer: false };
    expect(parseClampedNumericInput("50.7", options)).toBe(50.7);
  });

  it("handles negative numbers", () => {
    const options: NumericInputOptions = { min: -100, max: 100 };
    expect(parseClampedNumericInput("-50", options)).toBe(-50);
  });

  it("handles string with leading/trailing whitespace", () => {
    expect(parseClampedNumericInput("  50  ", defaultOptions)).toBe(50);
  });

  it("clamps at boundaries", () => {
    expect(parseClampedNumericInput("0", defaultOptions)).toBe(0);
    expect(parseClampedNumericInput("100", defaultOptions)).toBe(100);
  });
});

describe("parseHexColorInput", () => {
  it("parses valid 6-digit hex color", () => {
    expect(parseHexColorInput("#ff0000")).toBe("#ff0000");
    expect(parseHexColorInput("#00ff00")).toBe("#00ff00");
    expect(parseHexColorInput("#0000ff")).toBe("#0000ff");
  });

  it("parses valid 3-digit hex color", () => {
    expect(parseHexColorInput("#f00")).toBe("#f00");
    expect(parseHexColorInput("#0f0")).toBe("#0f0");
    expect(parseHexColorInput("#00f")).toBe("#00f");
  });

  it("converts to lowercase", () => {
    expect(parseHexColorInput("#FF0000")).toBe("#ff0000");
    expect(parseHexColorInput("#ABC")).toBe("#abc");
  });

  it("trims whitespace", () => {
    expect(parseHexColorInput("  #ff0000  ")).toBe("#ff0000");
  });

  it("returns null for missing hash prefix", () => {
    expect(parseHexColorInput("ff0000")).toBe(null);
  });

  it("returns null for invalid hex characters", () => {
    expect(parseHexColorInput("#gg0000")).toBe(null);
    expect(parseHexColorInput("#xyz")).toBe(null);
  });

  it("returns null for wrong length", () => {
    expect(parseHexColorInput("#ff")).toBe(null);
    expect(parseHexColorInput("#ffff")).toBe(null);
    expect(parseHexColorInput("#fffff")).toBe(null);
    expect(parseHexColorInput("#fffffff")).toBe(null);
  });

  it("returns null for empty string", () => {
    expect(parseHexColorInput("")).toBe(null);
  });
});

describe("parseCanvasComponent", () => {
  it("parses valid component", () => {
    const validComponent = {
      id: "test-id",
      type: "Button",
      variableName: "button1",
      x: 10,
      y: 20,
      width: 100,
      height: 30,
    };

    const result = parseCanvasComponent(validComponent);
    expect(result).toMatchObject(validComponent);
  });

  it("returns null for invalid component", () => {
    const invalidComponent = {
      id: 123, // should be string
      type: "Button",
    };

    const result = parseCanvasComponent(invalidComponent);
    expect(result).toBeNull();
  });

  it("returns null for missing required fields", () => {
    const incompleteComponent = {
      type: "Button",
    };

    const result = parseCanvasComponent(incompleteComponent);
    expect(result).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseCanvasComponent(null)).toBeNull();
    expect(parseCanvasComponent("string")).toBeNull();
    expect(parseCanvasComponent(123)).toBeNull();
  });
});

describe("parseCanvasState", () => {
  it("parses valid canvas state", () => {
    const validState = {
      className: "MainWindow",
      components: [],
      frameWidth: 800,
      frameHeight: 600,
    };

    const result = parseCanvasState(validState);
    expect(result).toEqual(validState);
  });

  it("returns null for invalid state", () => {
    const invalidState = {
      className: 123, // should be string
    };

    const result = parseCanvasState(invalidState);
    expect(result).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseCanvasState(null)).toBeNull();
    expect(parseCanvasState("string")).toBeNull();
  });
});

describe("parseMessage", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("parses valid stateChanged message", () => {
    const message = {
      type: "stateChanged",
      state: {
        className: "MainWindow",
        components: [],
        frameWidth: 800,
        frameHeight: 600,
      },
    };

    const result = parseMessage(message);
    expect(result).toMatchObject(message);
  });

  it("parses valid toolbarCommand message", () => {
    const message = {
      type: "toolbarCommand",
      command: "undo",
    };

    const result = parseMessage(message);
    expect(result).toEqual(message);
  });

  it("returns null for unknown message type and warns", () => {
    const message = {
      type: "unknownType",
      data: "test",
    };

    const result = parseMessage(message);
    expect(result).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[zod] Unknown extension message type ignored",
      expect.objectContaining({ type: "unknownType" }),
    );
  });

  it("returns null for message without type", () => {
    const message = {
      data: "test",
    };

    const result = parseMessage(message);
    expect(result).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseMessage(null)).toBeNull();
    expect(parseMessage("string")).toBeNull();
  });
});
