export type ComponentType =
  | "Panel"
  | "Button"
  | "Label"
  | "TextField"
  | "PasswordField"
  | "TextArea"
  | "CheckBox"
  | "RadioButton"
  | "ComboBox"
  | "List"
  | "ProgressBar"
  | "Slider"
  | "Spinner"
  | "Separator";

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
  selected?: boolean;
  items?: string[];
  value?: number;
  min?: number;
  max?: number;
  orientation?: "horizontal" | "vertical";
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
