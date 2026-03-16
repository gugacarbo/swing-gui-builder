import { z } from "zod";

import { CanvasStateSchema, ConfigDefaultsSchema } from "@/schemas/canvas";

export const ToolbarCommandSchema = z.enum([
  "newWindow",
  "open",
  "save",
  "generate",
  "initConfig",
  "undo",
  "redo",
  "delete",
  "previewCode",
]);

export const StateChangedMessageSchema = z.object({
  type: z.literal("stateChanged"),
  state: CanvasStateSchema,
});

export const ToolbarCommandMessageSchema = z.object({
  type: z.literal("toolbarCommand"),
  command: ToolbarCommandSchema,
});

export const LoadStateMessageSchema = z.object({
  type: z.literal("loadState"),
  state: CanvasStateSchema,
});

export const ConfigDefaultsMessageSchema = z
  .object({
    type: z.literal("configDefaults"),
    defaults: ConfigDefaultsSchema.optional(),
    config: ConfigDefaultsSchema.optional(),
  })
  .superRefine((message, ctx) => {
    if (!message.defaults && !message.config) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "configDefaults message must include defaults or config",
        path: ["defaults"],
      });
    }
  })
  .transform((message) => ({
    type: message.type,
    defaults: message.defaults ?? message.config!,
  }));

export const PreviewCodeFileSchema = z.object({
  fileName: z.string(),
  content: z.string(),
});

export const PreviewCodeResponseMessageSchema = z.object({
  type: z.literal("previewCodeResponse"),
  files: z.array(PreviewCodeFileSchema),
});

export const MessageSchema = z.discriminatedUnion("type", [
  StateChangedMessageSchema,
  ToolbarCommandMessageSchema,
  LoadStateMessageSchema,
  ConfigDefaultsMessageSchema,
  PreviewCodeResponseMessageSchema,
]);

export const IncomingExtensionMessageSchema = z.discriminatedUnion("type", [
  LoadStateMessageSchema,
  ConfigDefaultsMessageSchema,
  PreviewCodeResponseMessageSchema,
]);

export const OutgoingExtensionMessageSchema = z.discriminatedUnion("type", [
  StateChangedMessageSchema,
  ToolbarCommandMessageSchema,
]);

export type ToolbarCommand = z.infer<typeof ToolbarCommandSchema>;
export type StateChangedMessage = z.infer<typeof StateChangedMessageSchema>;
export type ToolbarCommandMessage = z.infer<typeof ToolbarCommandMessageSchema>;
export type LoadStateMessage = z.infer<typeof LoadStateMessageSchema>;
export type ConfigDefaultsMessage = z.infer<typeof ConfigDefaultsMessageSchema>;
export type PreviewCodeFile = z.infer<typeof PreviewCodeFileSchema>;
export type PreviewCodeResponseMessage = z.infer<typeof PreviewCodeResponseMessageSchema>;
export type ExtensionMessage = z.infer<typeof MessageSchema>;
export type IncomingExtensionMessage = z.infer<typeof IncomingExtensionMessageSchema>;
export type OutgoingExtensionMessage = z.infer<typeof OutgoingExtensionMessageSchema>;
