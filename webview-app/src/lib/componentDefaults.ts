import type { CanvasComponent, ComponentProps, ComponentType } from "@/types/canvas";

const BASE_DEFAULT_PROPS: Omit<ComponentProps, "text"> = {
  backgroundColor: "#ffffff",
  textColor: "#000000",
  fontFamily: "Arial",
  fontSize: 12,
  eventMethodName: "",
};

type ComponentSpecificDefaults = Partial<Pick<CanvasComponent, "selected" | "items" | "value" | "min" | "max" | "orientation">>;
type DefaultComponentProps = ComponentProps & ComponentSpecificDefaults;

const DEFAULT_PROPS_BY_TYPE: Record<ComponentType, DefaultComponentProps> = {
  Panel: { ...BASE_DEFAULT_PROPS, text: "Panel" },
  Button: { ...BASE_DEFAULT_PROPS, text: "Button" },
  Label: { ...BASE_DEFAULT_PROPS, text: "Label" },
  TextField: { ...BASE_DEFAULT_PROPS, text: "TextField" },
  PasswordField: { ...BASE_DEFAULT_PROPS, text: "PasswordField" },
  TextArea: { ...BASE_DEFAULT_PROPS, text: "TextArea" },
  CheckBox: { ...BASE_DEFAULT_PROPS, text: "CheckBox", selected: false },
  RadioButton: { ...BASE_DEFAULT_PROPS, text: "RadioButton", selected: false },
  ComboBox: { ...BASE_DEFAULT_PROPS, text: "ComboBox", items: ["Item 1", "Item 2", "Item 3"] },
  List: { ...BASE_DEFAULT_PROPS, text: "List", items: ["Item 1", "Item 2", "Item 3"] },
  ProgressBar: { ...BASE_DEFAULT_PROPS, text: "ProgressBar", value: 50, min: 0, max: 100 },
  Slider: { ...BASE_DEFAULT_PROPS, text: "Slider", value: 50, min: 0, max: 100 },
  Spinner: { ...BASE_DEFAULT_PROPS, text: "Spinner", value: 50, min: 0, max: 100 },
  Separator: { ...BASE_DEFAULT_PROPS, text: "Separator", orientation: "horizontal" },
};

const DEFAULT_SIZE_BY_TYPE: Record<ComponentType, { width: number; height: number }> = {
  Panel: { width: 200, height: 150 },
  Button: { width: 120, height: 36 },
  Label: { width: 120, height: 28 },
  TextField: { width: 180, height: 36 },
  PasswordField: { width: 180, height: 36 },
  TextArea: { width: 220, height: 96 },
  CheckBox: { width: 120, height: 28 },
  RadioButton: { width: 120, height: 28 },
  ComboBox: { width: 180, height: 36 },
  List: { width: 180, height: 96 },
  ProgressBar: { width: 180, height: 28 },
  Slider: { width: 180, height: 44 },
  Spinner: { width: 120, height: 36 },
  Separator: { width: 180, height: 10 },
};

export function getDefaultProps(type: ComponentType): DefaultComponentProps {
  const defaults = DEFAULT_PROPS_BY_TYPE[type];
  return {
    ...defaults,
    items: defaults.items ? [...defaults.items] : undefined,
  };
}

export function getDefaultSize(type: ComponentType): { width: number; height: number } {
  return DEFAULT_SIZE_BY_TYPE[type];
}
