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

export interface ComponentModel {
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
  position?: "top" | "bottom" | "left" | "right";
}

export interface CanvasState {
  className: string;
  frameWidth: number;
  frameHeight: number;
  components: ComponentModel[];
}

export const DEFAULT_COMPONENT_SIZES: Record<ComponentType, { width: number; height: number }> = {
  Panel: { width: 200, height: 150 },
  Button: { width: 100, height: 30 },
  Label: { width: 100, height: 25 },
  TextField: { width: 150, height: 30 },
  PasswordField: { width: 150, height: 30 },
  TextArea: { width: 200, height: 100 },
  CheckBox: { width: 120, height: 25 },
  RadioButton: { width: 120, height: 25 },
  ComboBox: { width: 150, height: 30 },
  List: { width: 150, height: 100 },
  ProgressBar: { width: 150, height: 25 },
  Slider: { width: 150, height: 45 },
  Spinner: { width: 100, height: 30 },
  Separator: { width: 150, height: 10 },
};
