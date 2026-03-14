export type ComponentType = "Button" | "Label" | "TextField" | "PasswordField" | "TextArea";

export interface CanvasComponent {
  id: string;
  type: ComponentType;
  variableName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  eventMethodName: string;
}

export type ComponentProps = Pick<
  CanvasComponent,
  "text" | "backgroundColor" | "textColor" | "fontFamily" | "fontSize" | "eventMethodName"
>;

/**
 * Serializable layout state shared with the VS Code extension.
 */
export interface CanvasState {
  className: string;
  frameWidth: number;
  frameHeight: number;
  components: CanvasComponent[];
}

/**
 * UI-focused state used by the React app.
 */
export interface CanvasViewState extends CanvasState {
  selectedComponentId: string | null;
}

export interface ConfigDefaults {
  defaultBackgroundColor: string;
  defaultTextColor: string;
  defaultFontFamily: string;
  defaultFontSize: number;
  components: Record<string, unknown>;
}
