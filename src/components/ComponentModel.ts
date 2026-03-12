export type ComponentType = "Button" | "Label" | "TextField" | "PasswordField" | "TextArea";

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
}

export interface CanvasState {
  className: string;
  frameWidth: number;
  frameHeight: number;
  components: ComponentModel[];
}

export const DEFAULT_COMPONENT_SIZES: Record<ComponentType, { width: number; height: number }> = {
  Button: { width: 100, height: 30 },
  Label: { width: 100, height: 25 },
  TextField: { width: 150, height: 30 },
  PasswordField: { width: 150, height: 30 },
  TextArea: { width: 200, height: 100 },
};
