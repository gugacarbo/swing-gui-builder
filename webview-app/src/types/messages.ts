import type { CanvasState, ConfigDefaults } from "@/types/canvas";

export { IncomingExtensionMessageSchema, MessageSchema, OutgoingExtensionMessageSchema, ToolbarCommandSchema } from "@/schemas/messages";

export type ToolbarCommand =
  | "newWindow"
  | "open"
  | "save"
  | "generate"
  | "initConfig"
  | "undo"
  | "redo"
  | "delete"
  | "previewCode";

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

export interface PreviewCodeFile {
  fileName: string;
  content: string;
}

export interface PreviewCodeResponseMessage {
  type: "previewCodeResponse";
  files: PreviewCodeFile[];
}

export type OutgoingExtensionMessage = StateChangedMessage | ToolbarCommandMessage;
export type IncomingExtensionMessage = LoadStateMessage | ConfigDefaultsMessage | PreviewCodeResponseMessage;
export type Message = OutgoingExtensionMessage | IncomingExtensionMessage;
