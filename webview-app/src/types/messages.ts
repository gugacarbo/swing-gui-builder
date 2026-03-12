import type { CanvasState, ConfigDefaults } from "@/types/canvas";

export { IncomingExtensionMessageSchema, MessageSchema, OutgoingExtensionMessageSchema, ToolbarCommandSchema } from "@/schemas/messages";

export type ToolbarCommand = "newWindow" | "open" | "save" | "generate" | "initConfig" | "undo" | "redo" | "delete";

export interface StateChangedMessage {
  type: "stateChanged";
  state: CanvasState;
}

export interface ToolbarCommandMessage {
  type: "toolbarCommand";
  command: ToolbarCommand;
}

export interface LoadStateMessage {
  type: "loadState";
  state: CanvasState;
}

export interface ConfigDefaultsMessage {
  type: "configDefaults";
  config: ConfigDefaults;
}

export type OutgoingExtensionMessage = StateChangedMessage | ToolbarCommandMessage;
export type IncomingExtensionMessage = LoadStateMessage | ConfigDefaultsMessage;
export type Message = OutgoingExtensionMessage | IncomingExtensionMessage;
