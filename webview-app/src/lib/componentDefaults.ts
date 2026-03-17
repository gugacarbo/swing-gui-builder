import {
  DEFAULT_BG,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
} from "@/lib/constants";
import type { CanvasComponent, ComponentProps, ComponentType } from "@/types/canvas";

const BASE_DEFAULT_PROPS: Omit<ComponentProps, "text"> = {
  backgroundColor: DEFAULT_BG,
  textColor: DEFAULT_TEXT_COLOR,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontSize: DEFAULT_FONT_SIZE,
  eventMethodName: "",
};

type ComponentSpecificDefaults = Partial<
  Pick<CanvasComponent, "selected" | "items" | "value" | "min" | "max" | "orientation" | "position">
>;
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
  MenuBar: { ...BASE_DEFAULT_PROPS, text: "MenuBar" },
  Menu: { ...BASE_DEFAULT_PROPS, text: "Menu" },
  MenuItem: { ...BASE_DEFAULT_PROPS, text: "Menu Item" },
  ToolBar: { ...BASE_DEFAULT_PROPS, text: "ToolBar", position: "top" },
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
  MenuBar: { width: 320, height: 34 },
  Menu: { width: 110, height: 30 },
  MenuItem: { width: 140, height: 28 },
  ToolBar: { width: 280, height: 40 },
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
