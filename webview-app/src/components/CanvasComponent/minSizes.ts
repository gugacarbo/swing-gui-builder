import type { CanvasComponent } from "@/types/canvas";

export interface ComponentMinSize {
  minWidth: number;
  minHeight: number;
}

export const FALLBACK_MIN_SIZE: ComponentMinSize = { minWidth: 48, minHeight: 28 };

export const MIN_SIZE_BY_TYPE: Partial<Record<CanvasComponent["type"], ComponentMinSize>> = {
  Label: { minWidth: 24, minHeight: 20 },
  Button: { minWidth: 72, minHeight: 28 },
  TextField: { minWidth: 88, minHeight: 28 },
  TextArea: { minWidth: 88, minHeight: 52 },
  CheckBox: { minWidth: 72, minHeight: 24 },
  RadioButton: { minWidth: 72, minHeight: 24 },
  ComboBox: { minWidth: 92, minHeight: 28 },
  List: { minWidth: 96, minHeight: 60 },
  ProgressBar: { minWidth: 96, minHeight: 16 },
  Slider: { minWidth: 96, minHeight: 24 },
  Spinner: { minWidth: 72, minHeight: 28 },
  Separator: { minWidth: 24, minHeight: 6 },
  Panel: { minWidth: 72, minHeight: 48 },
};

export function getComponentMinSize(component: CanvasComponent): ComponentMinSize {
  if (component.type === "Separator" && component.orientation === "vertical") {
    return { minWidth: 6, minHeight: 24 };
  }

  return MIN_SIZE_BY_TYPE[component.type] ?? FALLBACK_MIN_SIZE;
}