import type { ComponentProps, ComponentType } from "@/types/canvas";

const BASE_DEFAULT_PROPS: Omit<ComponentProps, "text"> = {
  backgroundColor: "#ffffff",
  textColor: "#000000",
  fontFamily: "Arial",
  fontSize: 12,
  eventMethodName: "",
};

const DEFAULT_PROPS_BY_TYPE: Record<ComponentType, ComponentProps> = {
  Button: { ...BASE_DEFAULT_PROPS, text: "Button" },
  Label: { ...BASE_DEFAULT_PROPS, text: "Label" },
  TextField: { ...BASE_DEFAULT_PROPS, text: "TextField" },
  PasswordField: { ...BASE_DEFAULT_PROPS, text: "PasswordField" },
  TextArea: { ...BASE_DEFAULT_PROPS, text: "TextArea" },
};

const DEFAULT_SIZE_BY_TYPE: Record<ComponentType, { width: number; height: number }> = {
  Button: { width: 120, height: 36 },
  Label: { width: 120, height: 28 },
  TextField: { width: 180, height: 36 },
  PasswordField: { width: 180, height: 36 },
  TextArea: { width: 220, height: 96 },
};

export function getDefaultProps(type: ComponentType): ComponentProps {
  return DEFAULT_PROPS_BY_TYPE[type];
}

export function getDefaultSize(type: ComponentType): { width: number; height: number } {
  return DEFAULT_SIZE_BY_TYPE[type];
}
