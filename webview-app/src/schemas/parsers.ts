import { type ZodError, z } from "zod";

import {
  type CanvasComponent,
  CanvasComponentSchema,
  type CanvasState,
  CanvasStateSchema,
} from "@/schemas/canvas";
import { type ExtensionMessage, MessageSchema } from "@/schemas/messages";

const HexColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: "Color must be #RGB or #RRGGBB",
  });

const NumberInputSchema = z
  .string()
  .trim()
  .min(1, { message: "Value is required" })
  .transform((value) => Number(value));

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface NumericInputOptions {
  min: number;
  max: number;
  integer?: boolean;
}

function logParseError(scope: string, error: ZodError, data: unknown) {
  console.error(`[zod] ${scope} parse failed`, {
    issues: error.issues,
    received: data,
  });
}

export function parseCanvasComponent(data: unknown): CanvasComponent | null {
  const result = CanvasComponentSchema.safeParse(data);

  if (!result.success) {
    logParseError("CanvasComponent", result.error, data);
    return null;
  }

  return result.data;
}

export function parseCanvasState(data: unknown): CanvasState | null {
  const result = CanvasStateSchema.safeParse(data);

  if (!result.success) {
    logParseError("CanvasState", result.error, data);
    return null;
  }

  return result.data;
}

export function parseMessage(data: unknown): ExtensionMessage | null {
  if (data && typeof data === "object" && "type" in data) {
    const candidateType = (data as { type?: unknown }).type;
    if (
      typeof candidateType === "string" &&
      ![
        "stateChanged",
        "toolbarCommand",
        "loadState",
        "configDefaults",
        "previewCodeResponse",
      ].includes(candidateType)
    ) {
      console.warn("[zod] Unknown extension message type ignored", {
        type: candidateType,
        received: data,
      });
      return null;
    }
  }

  const result = MessageSchema.safeParse(data);

  if (!result.success) {
    logParseError("ExtensionMessage", result.error, data);
    return null;
  }

  return result.data;
}

export function parseClampedNumericInput(
  rawValue: string,
  options: NumericInputOptions,
): number | null {
  const schema = NumberInputSchema.pipe(z.number().finite()).transform((value) => {
    const nextValue = options.integer ? Math.round(value) : value;
    return clampNumber(nextValue, options.min, options.max);
  });

  const result = schema.safeParse(rawValue);
  return result.success ? result.data : null;
}

export function parseHexColorInput(rawValue: string): string | null {
  const result = HexColorSchema.safeParse(rawValue);

  if (!result.success) {
    return null;
  }

  return result.data.toLowerCase();
}
