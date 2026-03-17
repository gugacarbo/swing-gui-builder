// @ts-ignore TS6059: shared type module is intentionally outside src
import type { CanvasComponent, CanvasState, ComponentType } from "@shared/types/canvas";

export type { CanvasState, ComponentType };

export type ComponentModel = CanvasComponent;

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
  MenuBar: { width: 400, height: 32 },
  Menu: { width: 140, height: 28 },
  MenuItem: { width: 140, height: 28 },
  ToolBar: { width: 400, height: 40 },
};
