/**
 * Supported Swing component types shared across extension and webview.
 */
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
  | "Separator"
  | "MenuBar"
  | "Menu"
  | "MenuItem"
  | "ToolBar";

/**
 * Serializable component model exchanged between extension and webview.
 */
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
  children?: string[];
  parentId?: string;
  parentOffset?: { x: number; y: number };
  position?: "top" | "bottom" | "left" | "right" | "north" | "south" | "east" | "west";
}

/**
 * Root canvas document shared between extension and webview.
 */
export interface CanvasState {
  className: string;
  frameTitle?: string;
  frameWidth: number;
  frameHeight: number;
  backgroundColor?: string;
  components: CanvasComponent[];
}
